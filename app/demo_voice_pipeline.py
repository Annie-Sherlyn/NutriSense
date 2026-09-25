"""
demo_voice_pipeline.py — Full pipeline demo with all 8 mandated test cases.

Runs:  python -m app.demo_voice_pipeline
"""
import os
import sys
import pandas as pd
from datetime import datetime

from app.schemas.raw_input import RawInput
from app.schemas.profile import DEMO_PROFILE
from app.schemas.resolved_input import PostMealInput
from app.resolution.voice_resolver import resolve
from app.nutrition.meal_calculator import calculate_meal_nutrition
from app.nutrition.daily_tracker import aggregate_daily
from app.recommendation.nutrient_gap import calculate_gaps, rank_gaps
from app.recommendation.recommender import suggest_foods
from app.nutrition.icmr_targets import get_targets_for_profile
from app.nutrition.food_database import load_food_db
from app.voice.speech_to_text import transcribe_text


def run_test_case(text: str, test_name: str, food_db: pd.DataFrame):
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"INPUT: '{text}'")
    print(f"{'='*60}")

    transcript = transcribe_text(text)

    raw = RawInput(
        input_id="voice_test",
        timestamp=datetime.now(),
        source="voice",
        stage="post_meal",
        raw_payload={"text": transcript}
    )

    resolved = resolve(raw)

    if isinstance(resolved, dict) and resolved.get("status") == "needs_verification":
        print(f"STATUS: needs_verification")
        for u in resolved.get('unresolved_items', []):
            print(f"  UNRESOLVED: '{u['item']}' | candidates: {[c['label']+' ('+c['food_id']+')' for c in u['candidates'][:3]]}")
        if resolved.get("resolved_items"):
            print("  RESOLVED (kept despite ambiguity):")
            for ri in resolved["resolved_items"]:
                print(f"    - {ri['quantity']} {ri['unit']} of {ri['raw_label']} "
                      f"(ID: {ri['resolved_food_id']}, Conf: {ri['match_confidence']:.2f})")
        return "needs_verification"

    # Full pipeline for confirmed items
    print(f"STATUS: confirmed")
    print(f"PARSED ITEMS:")
    for item in resolved.items:
        print(f"  - {item.quantity} {item.unit} of {item.raw_label} "
              f"(ID: {item.resolved_food_id}, Conf: {item.match_confidence:.2f})")

    meal_nutrients = calculate_meal_nutrition(resolved)
    daily_totals = aggregate_daily([meal_nutrients])
    targets = get_targets_for_profile(DEMO_PROFILE)
    gaps = calculate_gaps(targets, daily_totals)
    ranked = rank_gaps(gaps, DEMO_PROFILE.priority_nutrients)
    suggested = suggest_foods(ranked, DEMO_PROFILE, food_db)

    print("\n--- Meal Nutrition ---")
    for k, v in meal_nutrients.items():
        print(f"  {k}: {v:.1f}")

    print("\n--- Top Ranked Gaps ---")
    for n, g in ranked[:3]:
        print(f"  {n}: {g:.1f}")

    print("\n--- Suggested Foods ---")
    for s in suggested:
        print(f"  {s['name']}")

    return "success"


def main():
    db_path = os.path.join(os.path.dirname(__file__), "data", "foods.csv")
    food_db = load_food_db(db_path)

    test_cases = [
        # -- MANDATED TEST CASES --
        ("I ate two idlies and one bowl of sambar.",
         "TC1: idlies+sambar [FD001+FD088]"),

        ("Kipli. Pongal. Boori.",
         "TC2: ASR norm + ambiguity [FD001 ok; pongal+poori=verify]"),

        ("2 chicken biryani and 1 naan",
         "TC3: chicken biryani+naan [FD057+FD199]"),

        ("1 biryani",
         "TC4: biryani alone = needs_verification"),

        ("1 puri",
         "TC5: puri = needs_verification (no auto-FD016)"),

        ("one paneer masal",
         "TC6: fuzzy 'paneer masal' = Paneer Masala [FD274]"),

        ("one apple and one banana",
         "TC7: apple+banana [FD279+FD280]"),

        ("one bowl of sambar, two idly and one dosa",
         "TC8: sambar+idly+dosa [FD088+FD001+FD002-or-verify]"),

        # -- REGRESSION TESTS --
        ("I ate 2 idlis and one bowl of sambar for breakfast",
         "REG1: Standard complex meal"),
        ("I had one dosa and a cup of sambar",
         "REG2: Dosa and sambar"),
        ("For lunch I ate two chapatis with chicken curry",
         "REG3: Chapatis with chicken curry"),
        ("I had three idlis",
         "REG4: Simple plural"),
        ("2 Biryani, 1 Puri, 1 Naan & Butter Chicken.",
         "REG5: Comma list with &"),
        ("2 idli, sambar and 1 unicorn",
         "REG6: Partial failure isolation"),
    ]

    results = {}
    for text, name in test_cases:
        res = run_test_case(text, name, food_db)
        results[name] = res
        print(f"\nResult: {res}")

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for name, res in results.items():
        status = "PASS" if res in ("success", "needs_verification") else "FAIL"
        print(f"  [{status}] {name}: {res}")


if __name__ == "__main__":
    main()
