"""
Unit tests for scoring algorithms: Coverage, GapScore, Affordability, ValueScore, MealScore, and BANS.
"""

import pytest
from budget_recommendation_service.scoring import (
    calculate_nutrient_coverage,
    calculate_gap_score,
    calculate_affordability,
    calculate_value_score,
    calculate_meal_score,
    calculate_bans,
)

def test_nutrient_coverage_basic():
    # protein gap: 20g, food has 8g -> 8/20 = 0.40
    food_nutrients = {"protein_g": 8.0, "iron_mg": 2.0}
    gaps = {"protein_g": 20.0, "iron_mg": 5.0}
    cov = calculate_nutrient_coverage(food_nutrients, gaps)
    assert cov["protein_g"] == 0.40
    assert cov["iron_mg"] == 0.40

def test_nutrient_coverage_capped_at_one():
    # iron gap: 2mg, food has 6mg -> must be capped at 1.0, NOT 3.0
    food_nutrients = {"iron_mg": 6.0}
    gaps = {"iron_mg": 2.0}
    cov = calculate_nutrient_coverage(food_nutrients, gaps)
    assert cov["iron_mg"] == 1.0

def test_nutrient_coverage_zero_or_negative_gaps_ignored():
    food_nutrients = {"protein_g": 10.0, "fiber_g": 5.0}
    gaps = {"protein_g": 20.0, "fiber_g": 0.0, "iron_mg": -2.0}
    cov = calculate_nutrient_coverage(food_nutrients, gaps)
    assert "protein_g" in cov
    assert "fiber_g" not in cov
    assert "iron_mg" not in cov

def test_priority_nutrient_weighting():
    # 2 nutrients: protein (normal weight=1.0) with coverage 0.50
    # iron (priority weight=2.0) with coverage 1.0
    # GapScore = (1.0*0.5 + 2.0*1.0) / (1.0 + 2.0) = 2.5 / 3.0 = 0.8333
    cov = {"protein_g": 0.50, "iron_mg": 1.0}
    gap_score = calculate_gap_score(cov, priority_nutrients=["iron_mg"])
    assert round(gap_score, 4) == 0.8333

def test_gap_score_all_zero():
    cov = {"protein_g": 0.0, "iron_mg": 0.0}
    gap_score = calculate_gap_score(cov)
    assert gap_score == 0.0

def test_affordability_calculation():
    # budget = 100, price = 20 -> 1 - 20/100 = 0.80
    assert calculate_affordability(price=20.0, budget=100.0) == 0.80
    # budget = 100, price = 100 -> 0.0
    assert calculate_affordability(price=100.0, budget=100.0) == 0.0
    # price > budget -> 0.0
    assert calculate_affordability(price=120.0, budget=100.0) == 0.0
    # non-positive budget -> 0.0
    assert calculate_affordability(price=20.0, budget=0.0) == 0.0

def test_value_score():
    # ValueScore = GapScore * AffordabilityScore
    gap_score = 0.80
    affordability = 0.60
    assert calculate_value_score(gap_score, affordability) == 0.48

def test_meal_score():
    # Exact match
    assert calculate_meal_score("breakfast", ["breakfast", "snack"]) == 1.0
    # Adjacent acceptable match
    assert calculate_meal_score("dinner", ["lunch"]) == 0.5
    assert calculate_meal_score("snack", ["breakfast"]) == 0.5
    # Inappropriate
    assert calculate_meal_score("snack", ["lunch", "dinner"]) == 0.0

def test_bans_calculation():
    # BANS = 0.60 * GapScore + 0.25 * ValueScore + 0.15 * MealScore
    gap = 0.80
    val = 0.40
    meal = 1.0
    # bans = 0.60*0.80 + 0.25*0.40 + 0.15*1.0 = 0.48 + 0.10 + 0.15 = 0.73
    bans = calculate_bans(gap, val, meal)
    assert bans == 0.73
    assert 0.0 <= bans <= 1.0
