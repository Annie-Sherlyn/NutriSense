from app.schemas.resolved_input import ResolvedItem
from app.schemas.profile import UserProfile
import pandas as pd

def filter_candidates(candidates: list[ResolvedItem], user_profile: dict) -> list[ResolvedItem]:
    """
    TODO: Allergen/diet filtering.
    """
    pass

def filter_by_profile(candidates: list[dict], profile: UserProfile, food_db: pd.DataFrame) -> list[dict]:
    """
    Filters candidates based on user profile allergens and diet type.
    Note: Filters on 'allergens' and 'dietary_tags' columns from foods.csv.
    Other potential filters (like health conditions) are skipped because foods.csv 
    doesn't have corresponding columns currently.
    """
    has_allergens = 'allergens' in food_db.columns
    has_diet = 'dietary_tags' in food_db.columns
    
    filtered = []
    for cand in candidates:
        food_id = cand.get("food_id") or cand.get("resolved_food_id")
        
        if not food_id or food_id not in food_db.index:
            filtered.append(cand)
            continue
            
        row = food_db.loc[food_id]
        
        # Allergen filter
        if has_allergens and pd.notna(row['allergens']):
            food_allergens = [a.strip().lower() for a in str(row['allergens']).split(",")]
            conflict = any(pa.lower() in food_allergens for pa in profile.allergens)
            print(f"DEBUG: {food_id}, row_allergens={row['allergens']}, food_allergens={food_allergens}, profile={profile.allergens}, conflict={conflict}")
            if conflict:
                continue
                
        # Diet filter
        if has_diet and pd.notna(row['dietary_tags']):
            tags = [t.strip().lower() for t in str(row['dietary_tags']).split(",")]
            
            is_non_veg = "non-vegetarian" in tags or "non_vegetarian" in tags or "meat" in tags
            is_vegan = "vegan" in tags
            
            if profile.diet_type == "vegetarian" and is_non_veg:
                continue
            if profile.diet_type == "vegan" and not is_vegan:
                continue
            if profile.diet_type == "eggitarian" and is_non_veg:
                continue
                
        filtered.append(cand)
        
    return filtered
