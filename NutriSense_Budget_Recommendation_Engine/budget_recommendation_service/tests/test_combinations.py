"""
Unit tests for combinations.py.
Verifies pairwise synergy evaluation, compatibility matrix enforcement, and diversity filtering.
"""

import pytest
from budget_recommendation_service.combinations import (
    is_combination_compatible,
    combine_food_nutrients,
    evaluate_pairs,
    apply_diversity_filter,
)
from budget_recommendation_service.models import FoodNutritionData, EvaluatedCandidate

def test_combination_compatibility_matrix():
    # Allowed pairs
    assert is_combination_compatible("meal_base", "meal_side") is True
    assert is_combination_compatible("breakfast_base", "breakfast_side") is True
    assert is_combination_compatible("snack", "fruit") is True
    assert is_combination_compatible("standalone", "fruit") is True

    # Incompatible pairs (e.g. two main meal bases, or side dish + fruit)
    assert is_combination_compatible("meal_base", "meal_base") is False
    assert is_combination_compatible("breakfast_base", "breakfast_base") is False
    assert is_combination_compatible("meal_side", "fruit") is False

def test_combine_food_nutrients():
    nutrients_a = {"protein_g": 6.0, "iron_mg": 1.2, "fiber_g": 2.0}
    nutrients_b = {"protein_g": 3.0, "calcium_mg": 100.0, "fiber_g": 1.5}
    combined = combine_food_nutrients(nutrients_a, nutrients_b)

    assert combined["protein_g"] == 9.0
    assert combined["iron_mg"] == 1.2
    assert combined["calcium_mg"] == 100.0
    assert combined["fiber_g"] == 3.5

def test_evaluate_pairs_budget_enforcement():
    # Food A: price 60, Food B: price 50 -> total 110
    food_a = FoodNutritionData(
        food_id="food_a", display_name="Food A", serving="1 bowl",
        nutrition={"protein_g": 10.0}, diet_tags=["vegetarian"], allergen_tags=[],
        meal_tags=["snack"], combination_group="snack"
    )
    food_b = FoodNutritionData(
        food_id="food_b", display_name="Food B", serving="1 piece",
        nutrition={"protein_g": 5.0}, diet_tags=["vegetarian"], allergen_tags=[],
        meal_tags=["snack"], combination_group="fruit"
    )

    items = [
        (food_a, 60.0, "local_price_band", "medium"),
        (food_b, 50.0, "local_price_band", "medium")
    ]
    # Budget 100 -> pair price 110 > 100 -> should return empty
    pairs = evaluate_pairs(items, budget=100.0, meal_type="snack", nutrient_gaps={"protein_g": 20.0}, priority_nutrients=[])
    assert len(pairs) == 0

    # Budget 120 -> pair price 110 <= 120 -> evaluated
    pairs_ok = evaluate_pairs(items, budget=120.0, meal_type="snack", nutrient_gaps={"protein_g": 20.0}, priority_nutrients=[])
    assert len(pairs_ok) == 1
    assert pairs_ok[0].total_price == 110.0
    assert pairs_ok[0].is_pair is True
    assert pairs_ok[0].food_ids == ["food_a", "food_b"]

def test_diversity_filtering():
    # If we have [Egg], [Egg + Banana], [Egg + Apple], and [Chappathi + Dal]
    # Diversity filter should prefer including [Chappathi + Dal] rather than 3 Egg variations
    def make_cand(fids, score):
        return EvaluatedCandidate(
            food_ids=fids, display_names=fids, servings=["1"]*len(fids),
            combination_groups=["standalone"]*len(fids), total_price=30.0,
            price_source="local_price_band", price_confidence="medium",
            combined_nutrients={}, coverage_by_nutrient={}, gap_score=score,
            affordability_score=0.8, value_score=score*0.8, meal_score=1.0,
            bans_score=score, is_pair=len(fids) > 1
        )

    cand1 = make_cand(["egg"], 0.90)
    cand2 = make_cand(["egg", "banana"], 0.88)
    cand3 = make_cand(["egg", "apple"], 0.86)
    cand4 = make_cand(["chappathi", "dal"], 0.84)

    ranked = [cand1, cand2, cand3, cand4]
    diverse_top3 = apply_diversity_filter(ranked, top_k=3)

    assert len(diverse_top3) == 3
    # Check that cand4 is picked to give diversity rather than 3 egg variants
    food_id_lists = [c.food_ids for c in diverse_top3]
    assert ["egg"] in food_id_lists
    assert ["egg", "banana"] in food_id_lists
    assert ["chappathi", "dal"] in food_id_lists
