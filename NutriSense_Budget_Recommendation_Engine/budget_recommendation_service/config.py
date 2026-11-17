"""
Configuration constants and scoring weights for the Budget-Aware Nutrient Recommendation Engine (BANS).
"""

from pathlib import Path

# Core Scoring Weights for BANS (Budget-Aware Nutrient Score)
# Must sum strictly to 1.0. Nutrition coverage dominates.
NUTRIENT_WEIGHT: float = 0.60
VALUE_WEIGHT: float = 0.25
MEAL_WEIGHT: float = 0.15

# Priority Nutrient Multipliers
NORMAL_NUTRIENT_WEIGHT: float = 1.0
PRIORITY_NUTRIENT_WEIGHT: float = 2.0

# Meal Suitability Scores
EXACT_MEAL_SCORE: float = 1.0
ACCEPTABLE_MEAL_SCORE: float = 0.5
INAPPROPRIATE_MEAL_SCORE: float = 0.0

# Maximum Recommendations to return
DEFAULT_TOP_K: int = 3

# Data Paths
BASE_DIR: Path = Path(__file__).parent.resolve()
DATA_DIR: Path = BASE_DIR / "data"

DEFAULT_NUTRITION_PATH: Path = DATA_DIR / "mock_nutrition.json"
DEFAULT_PRICE_BANDS_PATH: Path = DATA_DIR / "food_price_bands.json"
DEFAULT_MOCK_MENU_PATH: Path = DATA_DIR / "mock_menu.json"

# Validate weights invariant
_weight_sum = round(NUTRIENT_WEIGHT + VALUE_WEIGHT + MEAL_WEIGHT, 6)
if _weight_sum != 1.0:
    raise ValueError(f"BANS scoring weights must sum to 1.0, got: {_weight_sum}")
