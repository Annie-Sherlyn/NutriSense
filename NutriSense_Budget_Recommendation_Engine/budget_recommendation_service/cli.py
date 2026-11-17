"""
Command Line Interface for the Cost-Wise Nutrient Recommendation Engine.
Executes the engine locally without frontend, OCR, or Supabase.
"""

import sys
import json
import argparse
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure parent directory is in sys.path
package_dir = Path(__file__).parent.resolve()
if str(package_dir.parent) not in sys.path:
    sys.path.insert(0, str(package_dir.parent))

from budget_recommendation_service.models import RecommendationRequest, RecommendationResponse
from budget_recommendation_service.engine import BudgetRecommendationEngine

def print_pretty_output(resp: RecommendationResponse, req: RecommendationRequest):
    """Prints a formatted human-readable summary matching project guidelines."""
    print("=" * 55)
    print("NUTRISENSE — COST-WISE NUTRIENT RECOMMENDER")
    print("=" * 55)

    print("\nMODE")
    print(f"  {resp.mode.upper()} Recommendation")

    print("\nBUDGET")
    print(f"  ₹{resp.budget:.0f}")

    print("\nMEAL")
    print(f"  {req.meal_type.capitalize()}")

    print("\nNUTRIENT GAPS")
    if not resp.nutrient_gaps:
        print("  None specified")
    else:
        for k, v in resp.nutrient_gaps.items():
            print(f"  {k:18} : {v}")

    print("\n" + "-" * 55)
    print("CANDIDATE PROCESSING")
    print("-" * 55)
    print(f"Status           : {resp.status}")
    print(f"Eligible Foods   : {resp.eligible_food_count}")
    if resp.message:
        print(f"Message          : {resp.message}")

    print("\n" + "-" * 55)
    print("TOP RECOMMENDATIONS")
    print("-" * 55)

    if not resp.recommendations:
        print(f"No recommendations available: [{resp.status}]")
        print(f"Details: {resp.message}")
    else:
        for item in resp.recommendations:
            food_names = " + ".join([f.display_name for f in item.foods])
            print(f"\n#{item.rank} {food_names} ({item.type.upper()})")
            print(f"  Price        : ₹{item.total_price:.0f}")
            print(f"  Price Source : {item.price_source} ({item.price_confidence})")
            print(f"  Scores       : BANS={item.scores.bans_score:.3f} | Gap={item.scores.gap_score:.3f} | Value={item.scores.value_score:.3f} | Meal={item.scores.meal_score:.1f}")
            print("  Nutrient Coverage:")
            for n_k, cov in item.nutrient_coverage.items():
                print(f"    - {n_k:16}: {cov*100:.1f}%")
            print("  Why:")
            for reason in item.reasons:
                print(f"    • {reason}")

    print("\n" + "=" * 55)

def main():
    parser = argparse.ArgumentParser(description="NutriSense Cost-Wise Nutrient Recommender CLI")
    parser.add_argument(
        "--input", "-i",
        type=str,
        default=None,
        help="Path to JSON input file containing RecommendationRequest"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw structured JSON only"
    )
    args = parser.parse_args()

    engine = BudgetRecommendationEngine()

    if args.input:
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"Error: Input file not found at: {input_path}")
            sys.exit(1)
        with open(input_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        request = RecommendationRequest(**raw_data)
    else:
        # Default scenario 1: General snack recommendation with ₹100 budget
        default_path = package_dir / "data" / "scenarios" / "scenario_1_general.json"
        with open(default_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        request = RecommendationRequest(**raw_data)

    response = engine.recommend(request)

    if args.json:
        print(response.model_dump_json(indent=2))
    else:
        print_pretty_output(response, request)
        print("\nRAW STRUCTURED JSON RESPONSE:")
        print(response.model_dump_json(indent=2))

if __name__ == "__main__":
    main()
