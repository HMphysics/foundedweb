from fastapi import FastAPI, APIRouter, Depends
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

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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