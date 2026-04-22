import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client = None

def get_db():
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGO_URL") or os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI")
        if not mongo_uri:
            raise ValueError("No MongoDB URI found in environment variables (MONGO_URL, MONGODB_URL, or MONGODB_URI)")
        _client = MongoClient(mongo_uri)
    
    db_name = os.getenv("DB_NAME", "founded")
    return _client[db_name]
