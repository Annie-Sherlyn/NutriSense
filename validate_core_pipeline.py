import os
import pandas as pd
from datetime import datetime
from app.schemas.profile import DEMO_PROFILE
from app.schemas.resolved_input import PostMealInput, ResolvedItem
from app.nutrition.icmr_targets import get_targets_for_profile
from app.nutrition.meal_calculator import calculate_meal_nutrition
from app.nutrition.daily_tracker import aggregate_daily
from app.recommendation.nutrient_gap import calculate_gaps, rank_gaps
from app.recommendation.recommender import suggest_foods
from app.nutrition.food_database import load_food_db

def main():
    db_path = os.path.join(os.path.dirname(__file__), "app", "data", "foods.csv")
    food_db = load_food_db(db_path)
    
    # manual log bypassing voice
    item = ResolvedItem(
        raw_label="Custom Manual Meal",
        source="manual",
        resolved_food_id=None,
        match_confidence=None,
        match_status="confirmed",
        quantity=1.0,
        unit="meal",
        nutrient_override={
            "calories_kcal": 2200.0,
            "protein_g": 20.0,
            "carbs_g": 200.0,
            "fat_g": 65.0,
            "iron_mg": 4.0,
            "calcium_mg": 700.0
        }
    )
    
    manual_input = PostMealInput(
        input_id="manual-001",
        timestamp=datetime.now(),
        items=[item],
        meal_type="lunch"
    )
    
    # 1. Meal Calculator
    meal_nutrients = calculate_meal_nutrition(manual_input)
    
    # 2. Daily Tracker
    daily_totals = aggregate_daily([meal_nutrients])
    
    # 3. Nutrient Gap
    targets = get_targets_for_profile(DEMO_PROFILE)
    gaps = calculate_gaps(targets, daily_totals)
    ranked = rank_gaps(gaps, DEMO_PROFILE.priority_nutrients)
    
    # 4. Recommender
    suggested = suggest_foods(ranked, DEMO_PROFILE, food_db)
    
    # Output
    print("--- Targets ---")
    for k, v in targets.items(): print(f"{k}: {v}")
    
    print("\n--- Consumed ---")
    for k, v in daily_totals.items(): print(f"{k}: {v}")
    
    print("\n--- Ranked Gaps ---")
    for n, g in ranked: print(f"{n}: {g}")
    
    print("\n--- Suggested foods ---")
    for s in suggested: print(f"{s['name']} ({s['food_id']})")

if __name__ == "__main__":
    main()
