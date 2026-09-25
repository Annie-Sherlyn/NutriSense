from supabase import create_client, Client
import os
from typing import Dict, Any, List

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def log_meal_db(meal_data: Dict[str, Any]):
    if not supabase: return
    try:
        supabase.table("meals").insert(meal_data).execute()
    except Exception as e:
        print(f"Supabase insert error: {e}")

def get_today_meals_db(user_id: str = "demo-user") -> List[Dict[str, Any]]:
    if not supabase: return []
    try:
        from datetime import datetime, time
        today_start = datetime.combine(datetime.today(), time.min).isoformat()
        res = supabase.table("meals").select("*").eq("user_id", user_id).gte("created_at", today_start).execute()
        return res.data
    except Exception as e:
        print(f"Supabase select error: {e}")
        return []
