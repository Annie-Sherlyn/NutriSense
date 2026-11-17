"""
Combination Optimizer and Diversity Filtering.
Evaluates pairwise food synergies, enforces culinary compatibility matrices,
and filters redundant overlapping recommendations.
"""

from typing import List, Dict, Tuple, Set, Optional
from itertools import combinations

from .models import FoodNutritionData, EvaluatedCandidate
from .scoring import (
    calculate_nutrient_coverage,
    calculate_gap_score,
    calculate_affordability,
    calculate_value_score,
    calculate_meal_score,
    calculate_bans,
)

# Compatibility Matrix for culinary combinations
ALLOWED_COMBINATIONS: Set[Tuple[str, str]] = {
    # Meal pairings
    ("meal_base", "meal_side"),
    ("meal_side", "meal_base"),
    ("meal_side", "meal_side"),

    # Breakfast pairings
    ("breakfast_base", "breakfast_side"),
    ("breakfast_side", "breakfast_base"),
    ("breakfast_side", "breakfast_side"),

    # Snack and Fruit pairings
    ("snack", "fruit"),
    ("fruit", "snack"),
    ("snack", "snack"),
    ("fruit", "fruit"),

    # Standalone items (e.g. Boiled Egg) pairing with sides/fruits/snacks
    ("standalone", "fruit"),
    ("fruit", "standalone"),
    ("standalone", "snack"),
    ("snack", "standalone"),
    ("standalone", "meal_side"),
    ("meal_side", "standalone"),
}

def is_combination_compatible(group_a: str, group_b: str) -> bool:
    """
    Determines if two foods form a sensible culinary pairing based on combination groups.
    Rejects duplicate bases (e.g., Rice + Noodles) and nonsensical pairings (e.g., Sambar + Apple).
    """
    pair = (group_a.lower().strip(), group_b.lower().strip())
    return pair in ALLOWED_COMBINATIONS

def combine_food_nutrients(nutrients_a: Dict[str, float], nutrients_b: Dict[str, float]) -> Dict[str, float]:
    """Combines quantitative nutrient totals of two foods."""
    combined: Dict[str, float] = {}
    all_keys = set(nutrients_a.keys()).union(nutrients_b.keys())
    for k in all_keys:
        val_a = float(nutrients_a.get(k, 0.0) or 0.0)
        val_b = float(nutrients_b.get(k, 0.0) or 0.0)
        combined[k] = round(val_a + val_b, 4)
    return combined

def evaluate_pairs(
    eligible_foods: List[Tuple[FoodNutritionData, float, str, str]],
    budget: float,
    meal_type: str,
    nutrient_gaps: Dict[str, float],
    priority_nutrients: List[str]
) -> List[EvaluatedCandidate]:
    """
    Evaluates all valid pairs among eligible foods within the budget:
    1. Checks combined_price <= budget
    2. Validates culinary compatibility
    3. Calculates combined nutrition coverage, GapScore, Affordability, Value, MealScore, and BANS
    """
    pair_candidates: List[EvaluatedCandidate] = []

    for item_a, item_b in combinations(eligible_foods, 2):
        food_a, price_a, src_a, conf_a = item_a
        food_b, price_b, src_b, conf_b = item_b

        total_price = price_a + price_b
        if total_price > budget:
            continue

        if not is_combination_compatible(food_a.combination_group, food_b.combination_group):
            continue

        # Combine nutrients
        combined_nutrients = combine_food_nutrients(food_a.nutrition, food_b.nutrition)

        # Calculate scoring
        coverage = calculate_nutrient_coverage(combined_nutrients, nutrient_gaps)
        gap_score = calculate_gap_score(coverage, priority_nutrients)
        affordability = calculate_affordability(total_price, budget)
        value_score = calculate_value_score(gap_score, affordability)

        # Meal score is the average/min of both
        meal_score_a = calculate_meal_score(meal_type, food_a.meal_tags)
        meal_score_b = calculate_meal_score(meal_type, food_b.meal_tags)
        combined_meal_score = round((meal_score_a + meal_score_b) / 2.0, 4)

        bans = calculate_bans(gap_score, value_score, combined_meal_score)

        if src_a == "current_menu" and src_b == "current_menu":
            price_src = "current_menu"
        elif src_a == "user_history_avg" or src_b == "user_history_avg":
            price_src = "user_history_avg"
        else:
            price_src = "local_price_band"

        conf = "high" if conf_a == "high" and conf_b == "high" else "medium"

        pair_candidates.append(
            EvaluatedCandidate(
                food_ids=[food_a.food_id, food_b.food_id],
                display_names=[food_a.display_name, food_b.display_name],
                servings=[food_a.serving, food_b.serving],
                combination_groups=[food_a.combination_group, food_b.combination_group],
                total_price=total_price,
                price_source=price_src,
                price_confidence=conf,
                combined_nutrients=combined_nutrients,
                coverage_by_nutrient=coverage,
                gap_score=gap_score,
                affordability_score=affordability,
                value_score=value_score,
                meal_score=combined_meal_score,
                bans_score=bans,
                is_pair=True
            )
        )

    return pair_candidates

def apply_diversity_filter(
    ranked_candidates: List[EvaluatedCandidate],
    top_k: int = 3
) -> List[EvaluatedCandidate]:
    """
    Selects top candidates while preventing nearly identical Top 3 selections.
    e.g. Avoids [Egg], [Egg + Banana], [Egg + Apple] if other distinct useful foods exist.
    """
    if len(ranked_candidates) <= top_k:
        return ranked_candidates

    selected: List[EvaluatedCandidate] = []
    seen_foods_count: Dict[str, int] = {}

    for cand in ranked_candidates:
        # Check how many foods in this candidate have already appeared in selected
        overlap = sum(seen_foods_count.get(fid, 0) for fid in cand.food_ids)

        # Allow at most 1 overlap per food if other options exist
        if overlap >= 2 and len(selected) >= 1:
            continue

        selected.append(cand)
        for fid in cand.food_ids:
            seen_foods_count[fid] = seen_foods_count.get(fid, 0) + 1

        if len(selected) >= top_k:
            break

    # If diversity filter left fewer than top_k, fill up with next best
    if len(selected) < top_k:
        for cand in ranked_candidates:
            if cand not in selected:
                selected.append(cand)
                if len(selected) >= top_k:
                    break

    return selected
