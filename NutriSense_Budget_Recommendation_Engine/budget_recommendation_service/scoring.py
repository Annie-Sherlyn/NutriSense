"""
Deterministic Scoring Algorithms for BANS (Budget-Aware Nutrient Score).
Calculates nutrient gap coverage, priority weighting, affordability, value-for-money,
meal suitability, and composite BANS scores.
"""

from typing import Dict, List, Optional, Tuple
from .config import (
    NUTRIENT_WEIGHT,
    VALUE_WEIGHT,
    MEAL_WEIGHT,
    NORMAL_NUTRIENT_WEIGHT,
    PRIORITY_NUTRIENT_WEIGHT,
    EXACT_MEAL_SCORE,
    ACCEPTABLE_MEAL_SCORE,
    INAPPROPRIATE_MEAL_SCORE,
)
from .models import NUTRIENT_KEY_ALIASES

# Adjacent meal acceptability transitions
MEAL_ADJACENCY: Dict[str, List[str]] = {
    "breakfast": ["snack"],
    "lunch": ["dinner"],
    "dinner": ["lunch"],
    "snack": ["breakfast"],
}

def normalize_nutrient_key(key: str) -> str:
    """Normalizes nutrient keys to standard canonical aliases."""
    clean = key.lower().strip()
    return NUTRIENT_KEY_ALIASES.get(clean, clean)

def calculate_nutrient_coverage(
    food_nutrients: Dict[str, float],
    nutrient_gaps: Dict[str, float]
) -> Dict[str, float]:
    """
    Calculates coverage for each participating nutrient gap:
      Coverage(food, n) = min(Amount(food, n) / Gap(n), 1.0)
    Only participating nutrients with positive remaining gaps (Gap > 0) are considered.
    Coverage is strictly capped at 1.0 (100%).
    """
    coverage: Dict[str, float] = {}

    for raw_gap_key, gap_val in nutrient_gaps.items():
        if gap_val is None or gap_val <= 0:
            continue

        norm_key = normalize_nutrient_key(raw_gap_key)
        # Search food nutrients by normalized key or raw key
        food_amount = 0.0
        for f_key, f_val in food_nutrients.items():
            if normalize_nutrient_key(f_key) == norm_key:
                food_amount = float(f_val or 0.0)
                break

        cov_ratio = min(food_amount / gap_val, 1.0)
        coverage[raw_gap_key] = max(0.0, round(cov_ratio, 4))

    return coverage

def calculate_gap_score(
    coverage_dict: Dict[str, float],
    priority_nutrients: Optional[List[str]] = None
) -> float:
    """
    Computes weighted GapScore based on normal (1.0) and priority (2.0) weights:
      GapScore = SUM(weight_n * coverage_n) / SUM(weight_n)
    Returns float clamped between 0.0 and 1.0.
    """
    if not coverage_dict:
        return 0.0

    priority_set = {normalize_nutrient_key(p) for p in (priority_nutrients or [])}

    weighted_sum = 0.0
    total_weight = 0.0

    for key, cov in coverage_dict.items():
        norm_key = normalize_nutrient_key(key)
        weight = PRIORITY_NUTRIENT_WEIGHT if norm_key in priority_set else NORMAL_NUTRIENT_WEIGHT
        weighted_sum += weight * cov
        total_weight += weight

    if total_weight <= 0:
        return 0.0

    score = weighted_sum / total_weight
    return max(0.0, min(1.0, round(score, 4)))

def calculate_affordability(price: float, budget: float) -> float:
    """
    Computes affordability score for items within budget:
      AffordabilityScore = 1.0 - (price / budget)
    Clamped to [0.0, 1.0].
    """
    if budget <= 0 or price > budget:
        return 0.0
    score = 1.0 - (price / budget)
    return max(0.0, min(1.0, round(score, 4)))

def calculate_value_score(gap_score: float, affordability_score: float) -> float:
    """
    Computes value-for-money score:
      ValueScore = GapScore * AffordabilityScore
    Ensures low-cost nutritionally irrelevant items do not beat valuable options.
    """
    score = gap_score * affordability_score
    return max(0.0, min(1.0, round(score, 4)))

def calculate_meal_score(meal_type: str, food_meal_tags: List[str]) -> float:
    """
    Calculates deterministic meal suitability score:
      Exact match: 1.0
      Acceptable adjacent meal: 0.5
      Inappropriate: 0.0
    """
    if not meal_type or not food_meal_tags:
        return ACCEPTABLE_MEAL_SCORE

    meal_clean = meal_type.lower().strip()
    food_tags_clean = [t.lower().strip() for t in food_meal_tags]

    # Exact match
    if meal_clean in food_tags_clean:
        return EXACT_MEAL_SCORE

    # Acceptable adjacent match
    adjacent_allowed = MEAL_ADJACENCY.get(meal_clean, [])
    if any(t in adjacent_allowed for t in food_tags_clean):
        return ACCEPTABLE_MEAL_SCORE

    return INAPPROPRIATE_MEAL_SCORE

def calculate_bans(
    gap_score: float,
    value_score: float,
    meal_score: float,
    nutrient_weight: float = NUTRIENT_WEIGHT,
    value_weight: float = VALUE_WEIGHT,
    meal_weight: float = MEAL_WEIGHT
) -> float:
    """
    Computes the composite Budget-Aware Nutrient Score (BANS):
      BANS = (0.60 * GapScore) + (0.25 * ValueScore) + (0.15 * MealScore)
    Clamped strictly to [0.0, 1.0].
    """
    bans = (nutrient_weight * gap_score) + (value_weight * value_score) + (meal_weight * meal_score)
    return max(0.0, min(1.0, round(bans, 4)))
