"""
NutriSense — Convenience CLI runner for the Cost-Wise Nutrient Recommendation Engine.
Usage:
  python run_budget_recommender.py [path_to_input.json]
"""

import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).parent.resolve()
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from budget_recommendation_service.cli import main

if __name__ == "__main__":
    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        sys.argv.insert(1, "--input")
    main()
