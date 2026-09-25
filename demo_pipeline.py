import pandas as pd
import os

from app.schemas.profile import DEMO_PROFILE
from app.nutrition.icmr_targets import get_targets_for_profile
from app.nutrition.food_database import load_food_db
from app.recommendation.nutrient_gap import rank_gaps
from app.recommendation.candidate_filter import filter_by_profile

def suggest_for_gap(gaps, food_db):
    """Mock implementation to supply some candidates"""
    return [
        {"food_id": "FD001", "name": "Idli"}
    ]

def main():
    print("=== DEMO PROFILE ===")
    print(f"Name: {DEMO_PROFILE.name}")
    print(f"Diet: {DEMO_PROFILE.diet_type}")
    print(f"Activity Level: {DEMO_PROFILE.activity_level}")
    print(f"Priority Nutrients: {DEMO_PROFILE.priority_nutrients}")
    print(f"Allergens: {DEMO_PROFILE.allergens}")
    print("====================\n")

    db_path = os.path.join(os.path.dirname(__file__), "app", "data", "foods.csv")
    food_db = load_food_db(db_path)

    # 1. Get targets
    targets = get_targets_for_profile(DEMO_PROFILE)
    print("--- Targets ---")
    for k, v in targets.items():
        print(f"{k}: {v}")
    print()

    # 2. Mock Gaps
    gaps = {
        "calories_kcal": 500.0,
        "protein_g": 30.0,
        "carbs_g": 50.0,
        "iron_mg": 15.0,
        "calcium_mg": 300.0
    }

    # 3. Rank Gaps
    ranked_gaps = rank_gaps(gaps, DEMO_PROFILE.priority_nutrients)
    print("--- Ranked Gaps ---")
    for n, g in ranked_gaps:
        print(f"{n}: {g}")
    print()

    # 4. Suggest for gap
    candidates = suggest_for_gap(gaps, food_db)
    print("--- Suggested foods (raw) ---")
    for c in candidates:
        print(f"- {c['name']} ({c['food_id']})")
    print()

    # 5. Filter by profile
    filtered_candidates = filter_by_profile(candidates, DEMO_PROFILE, food_db)
    print("--- Suggested foods (profile-filtered) ---")
    for c in filtered_candidates:
        print(f"- {c['name']} ({c['food_id']})")
    print()

if __name__ == "__main__":
    main()
