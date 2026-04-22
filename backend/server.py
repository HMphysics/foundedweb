from fastapi import FastAPI, APIRouter, Depends, Request, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone

from auth import get_current_user
from db import get_db
from stripe_utils import create_checkout_session, verify_webhook_signature, create_customer_portal_session

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (async for existing endpoints)
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'prop_forge')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Plan features definition
PLAN_FEATURES = {
    "free": {
        "firms_allowed": ["apex_eod", "topstep", "ftmo"],
        "modes": ["simple"],
        "compare": False,
        "export": False,
        "post_pass": False,
        "commissions": False,
        "behavioral": False,
        "save_configs": 0,
    },
    "pro": {
        "firms_allowed": "all",
        "modes": ["simple", "bootstrap"],
        "compare": True,
        "export": True,
        "post_pass": True,
        "commissions": True,
        "behavioral": True,
        "save_configs": 10,
    },
    "lifetime": {
        "firms_allowed": "all",
        "modes": ["simple", "bootstrap"],
        "compare": True,
        "export": True,
        "post_pass": True,
        "commissions": True,
        "behavioral": True,
        "save_configs": -1,
    },
}

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class CheckoutRequest(BaseModel):
    plan_type: str  # 'pro_monthly' | 'lifetime'

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.get("/user/plan")
async def get_user_plan(user=Depends(get_current_user)):
    sync_db = get_db()
    record = sync_db.user_plans.find_one({"user_id": user["id"]})
    
    if not record:
        record = {
            "user_id": user["id"],
            "email": user["email"],
            "plan": "free",
            "status": "active",
            "created_at": datetime.now(timezone.utc),
        }
        sync_db.user_plans.insert_one(record)
    
    plan_key = record.get("plan", "free")
    return {
        "plan": plan_key,
        "status": record.get("status", "active"),
        "features": PLAN_FEATURES.get(plan_key, PLAN_FEATURES["free"]),
    }

@api_router.post("/checkout")
async def checkout(body: CheckoutRequest, user=Depends(get_current_user)):
    try:
        sync_db = get_db()
        record = sync_db.user_plans.find_one({"user_id": user["id"]})
        stripe_customer_id = record.get("stripe_customer_id") if record else None
        
        url = create_checkout_session(
            user_id=user["id"],
            user_email=user["email"],
            plan_type=body.plan_type,
            stripe_customer_id=stripe_customer_id,
        )
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")
    
    try:
        event = verify_webhook_signature(payload, sig_header)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    sync_db = get_db()
    event_type = event["type"]
    obj = event["data"]["object"]
    
    # Convert Stripe object to dict for easier access
    if hasattr(obj, 'to_dict_recursive'):
        obj = obj.to_dict_recursive()
    
    if event_type == "checkout.session.completed":
        user_id = obj.get("client_reference_id") or obj.get("metadata", {}).get("user_id")
        plan_type = obj.get("metadata", {}).get("plan_type")
        stripe_customer_id = obj.get("customer")
        subscription_id = obj.get("subscription")
        
        if not user_id:
            return {"received": True, "warning": "no user_id"}
        
        update = {
            "stripe_customer_id": stripe_customer_id,
            "updated_at": datetime.now(timezone.utc),
        }
        if plan_type == "pro_monthly":
            update["plan"] = "pro"
            update["status"] = "active"
            update["subscription_id"] = subscription_id
        elif plan_type == "lifetime":
            update["plan"] = "lifetime"
            update["status"] = "active"
            update["lifetime_paid"] = True
        
        sync_db.user_plans.update_one(
            {"user_id": user_id},
            {"$set": update},
            upsert=True
        )
    
    elif event_type == "customer.subscription.deleted":
        stripe_customer_id = obj.get("customer")
        if stripe_customer_id:
            sync_db.user_plans.update_one(
                {"stripe_customer_id": stripe_customer_id, "plan": "pro"},
                {"$set": {"plan": "free", "status": "active", "updated_at": datetime.now(timezone.utc)}}
            )
    
    elif event_type == "customer.subscription.updated":
        stripe_customer_id = obj.get("customer")
        sub_status = obj.get("status")
        cancel_at_period_end = obj.get("cancel_at_period_end", False)
        
        new_status = "active"
        if sub_status in ("canceled", "unpaid"):
            new_status = "canceled"
        elif cancel_at_period_end:
            new_status = "cancel_pending"
        
        if stripe_customer_id:
            sync_db.user_plans.update_one(
                {"stripe_customer_id": stripe_customer_id},
                {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
            )
    
    elif event_type == "invoice.payment_failed":
        stripe_customer_id = obj.get("customer")
        if stripe_customer_id:
            sync_db.user_plans.update_one(
                {"stripe_customer_id": stripe_customer_id},
                {"$set": {"status": "payment_failed", "updated_at": datetime.now(timezone.utc)}}
            )
    
    return {"received": True}

@api_router.post("/portal")
async def portal(user=Depends(get_current_user)):
    sync_db = get_db()
    record = sync_db.user_plans.find_one({"user_id": user["id"]})
    stripe_customer_id = record.get("stripe_customer_id") if record else None
    
    if not stripe_customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer for this user")
    
    url = create_customer_portal_session(stripe_customer_id)
    return {"url": url}

# Include the router in the main app
app.include_router(api_router)

# CORS configuration
CORS_ORIGINS = [
    "https://foundedwebb.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()