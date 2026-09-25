from app.schemas.resolved_input import PostMealInput
from app.nutrition.food_database import get_food
import pandas as pd

def calculate_meal_nutrition(resolved_input: PostMealInput) -> dict:
    """
    Computes per-meal nutrient totals from a PostMealInput using foods.csv as the nutrient source.
    """
    totals = {
        "calories_kcal": 0.0,
        "protein_g": 0.0,
        "carbs_g": 0.0,
        "fat_g": 0.0,
        "iron_mg": 0.0,
        "calcium_mg": 0.0
    }
    
    for item in resolved_input.items:
        qty = item.quantity if item.quantity is not None else 1.0
        overrides = item.nutrient_override or {}
        
        # If we have a food_id, we can fetch from DB
        food = get_food(item.resolved_food_id) if item.resolved_food_id else {}
        
        def get_nutrient(key_csv, key_out):
            if key_out in overrides:
                return overrides[key_out]
            if food:
                min_val = food.get(f"{key_csv}_min", 0.0)
                return float(min_val) if pd.notna(min_val) else 0.0
            return 0.0
            
        totals["calories_kcal"] += get_nutrient("calories", "calories_kcal") * qty
        totals["protein_g"] += get_nutrient("protein", "protein_g") * qty
        totals["carbs_g"] += get_nutrient("carbs", "carbs_g") * qty
        totals["fat_g"] += get_nutrient("fat", "fat_g") * qty
        totals["iron_mg"] += get_nutrient("iron", "iron_mg") * qty
        totals["calcium_mg"] += get_nutrient("calcium", "calcium_mg") * qty
        
    return totals
