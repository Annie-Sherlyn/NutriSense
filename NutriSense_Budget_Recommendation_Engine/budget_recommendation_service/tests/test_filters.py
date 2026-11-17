"""
Unit tests for hard filtering: budget, diet, allergies, and data validity.
"""

import pytest
from budget_recommendation_service.filters import (
    is_within_budget,
    is_diet_compatible,
    is_allergy_safe,
    is_data_valid,
    apply_hard_filters,
)
from budget_recommendation_service.models import FoodNutritionData

def test_budget_filtering():
    assert is_within_budget(effective_price=80.0, budget=100.0) is True
    assert is_within_budget(effective_price=100.0, budget=100.0) is True
    assert is_within_budget(effective_price=105.0, budget=100.0) is False
    assert is_within_budget(effective_price=None, budget=100.0) is False
    assert is_within_budget(effective_price=-10.0, budget=100.0) is False

def test_diet_filtering():
    # Vegetarian user
    assert is_diet_compatible("vegetarian", ["vegetarian"]) is True
    assert is_diet_compatible("vegetarian", ["vegan"]) is True
    assert is_diet_compatible("vegetarian", ["non_vegetarian"]) is False
    assert is_diet_compatible("vegetarian", ["eggetarian"]) is False

    # Eggetarian user
    assert is_diet_compatible("eggetarian", ["eggetarian"]) is True
    assert is_diet_compatible("eggetarian", ["vegetarian"]) is True
    assert is_diet_compatible("eggetarian", ["non_vegetarian"]) is False

    # Vegan user
    assert is_diet_compatible("vegan", ["vegan"]) is True
    assert is_diet_compatible("vegan", ["vegetarian"]) is False

    # Non-vegetarian user
    assert is_diet_compatible("non_vegetarian", ["non_vegetarian"]) is True
    assert is_diet_compatible("non_vegetarian", ["vegetarian"]) is True

def test_allergy_filtering_hard_exclusion():
    # User allergic to dairy
    assert is_allergy_safe(["dairy"], ["dairy"]) is False
    assert is_allergy_safe(["dairy"], ["gluten", "dairy"]) is False
    assert is_allergy_safe(["dairy"], ["gluten"]) is True
    assert is_allergy_safe(["egg"], ["egg"]) is False
    assert is_allergy_safe([], ["dairy", "gluten"]) is True

def test_data_validity():
    assert is_data_valid(effective_price=50.0, nutrition={"calories": 150, "protein_g": 5}) is True
    assert is_data_valid(effective_price=None, nutrition={"calories": 150}) is False
    assert is_data_valid(effective_price=0.0, nutrition={"calories": 150}) is False
    assert is_data_valid(effective_price=50.0, nutrition={}) is False
    assert is_data_valid(effective_price=50.0, nutrition={"calories": 0}) is False

def test_apply_hard_filters_rejection_reasons():
    food = FoodNutritionData(
        food_id="boiled_egg",
        display_name="Boiled Egg",
        serving="1 egg",
        nutrition={"calories": 78, "protein_g": 6.3},
        diet_tags=["eggetarian"],
        allergen_tags=["egg"],
        meal_tags=["breakfast"],
        combination_group="standalone"
    )

    # 1. Budget exceeded
    passed, reason = apply_hard_filters(food, effective_price=120.0, budget=100.0, user_diet="eggetarian", user_allergies=[])
    assert passed is False
    assert "EXCEEDS_BUDGET" in reason

    # 2. Diet incompatible (Vegetarian user rejecting eggetarian)
    passed, reason = apply_hard_filters(food, effective_price=20.0, budget=100.0, user_diet="vegetarian", user_allergies=[])
    assert passed is False
    assert "DIET_INCOMPATIBLE" in reason

    # 3. Allergy intersection
    passed, reason = apply_hard_filters(food, effective_price=20.0, budget=100.0, user_diet="eggetarian", user_allergies=["egg"])
    assert passed is False
    assert "ALLERGEN_INTERSECTION" in reason

    # 4. Valid candidate passes
    passed, reason = apply_hard_filters(food, effective_price=20.0, budget=100.0, user_diet="eggetarian", user_allergies=[])
    assert passed is True
    assert reason is None
