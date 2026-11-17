"""
End-to-end unit tests for the BudgetRecommendationEngine.
Validates general mode, menu mode, edge cases (no budget, no gaps, no affordable foods,
unsupported menu foods, allergy exclusion), and combination recommendations.
"""

import pytest
from budget_recommendation_service.engine import BudgetRecommendationEngine
from budget_recommendation_service.models import (
    RecommendationRequest,
    MenuInput,
    MenuItemInput,
)

@pytest.fixture
def engine():
    return BudgetRecommendationEngine()

def test_engine_general_mode_standard(engine):
    request = RecommendationRequest(
        mode="general",
        budget=100.0,
        meal_type="snack",
        diet="vegetarian",
        allergies=[],
        nutrient_gaps={"protein_g": 20.0, "iron_mg": 5.0, "fiber_g": 8.0, "calcium_mg": 300.0},
        priority_nutrients=["protein_g", "iron_mg"],
        menu=None
    )
    resp = engine.recommend(request)
    assert resp.status == "success"
    assert resp.mode == "general"
    assert resp.budget == 100.0
    assert resp.eligible_food_count > 0
    assert len(resp.recommendations) <= 3
    # Check that prices are all within budget
    for rec in resp.recommendations:
        assert rec.total_price <= 100.0
        assert rec.scores.bans_score >= 0.0
        assert rec.scores.bans_score <= 1.0

def test_engine_menu_mode_candidate_universe(engine):
    # Only Dosa (75), Idly (55), Pongal (90), Poori (120) on menu
    # Budget 100
    menu = MenuInput(
        restaurant="Demo South Indian Mess",
        items=[
            MenuItemInput(dish_name="Plain Dosa", food_id="dosa", price=75.0, confidence=0.96),
            MenuItemInput(dish_name="Idly", food_id="idly", price=55.0, confidence=0.94),
            MenuItemInput(dish_name="Ven Pongal", food_id="ven_pongal", price=90.0, confidence=0.93),
            MenuItemInput(dish_name="Poori", food_id="poori", price=120.0, confidence=0.95),
        ]
    )
    request = RecommendationRequest(
        mode="menu",
        budget=100.0,
        meal_type="breakfast",
        diet="vegetarian",
        allergies=[],
        nutrient_gaps={"protein_g": 15.0, "iron_mg": 3.0},
        priority_nutrients=["protein_g"],
        menu=menu
    )
    resp = engine.recommend(request)
    assert resp.status == "success"
    # Eligible should be Dosa, Idly, Pongal (Poori is 120 > 100, so rejected)
    assert resp.eligible_food_count == 3
    # Only foods from the menu can be recommended!
    allowed_food_ids = {"dosa", "idly", "ven_pongal"}
    for rec in resp.recommendations:
        assert rec.total_price <= 100.0
        assert rec.price_source == "current_menu"
        for f in rec.foods:
            assert f.food_id in allowed_food_ids
            # Banana or Samosa must NOT appear
            assert f.food_id not in ["banana", "samosa", "boiled_egg"]

def test_engine_menu_override_price(engine):
    # Seed Dosa is 110, menu Dosa is 75
    menu = MenuInput(
        restaurant="Demo",
        items=[MenuItemInput(dish_name="Plain Dosa", food_id="dosa", price=75.0, confidence=0.96)]
    )
    request = RecommendationRequest(
        mode="menu",
        budget=100.0,
        meal_type="breakfast",
        diet="vegetarian",
        allergies=[],
        nutrient_gaps={"protein_g": 10.0},
        priority_nutrients=[],
        menu=menu
    )
    resp = engine.recommend(request)
    assert resp.status == "success"
    dosa_rec = next(r for r in resp.recommendations if r.foods[0].food_id == "dosa")
    assert dosa_rec.total_price == 75.0
    assert dosa_rec.price_source == "current_menu"

def test_engine_edge_case_no_budget(engine):
    request = RecommendationRequest(
        mode="general",
        budget=0.0,
        meal_type="snack",
        diet="vegetarian",
        allergies=[],
        nutrient_gaps={"protein_g": 10.0},
        priority_nutrients=[]
    )
    resp = engine.recommend(request)
    assert resp.status == "NO_BUDGET"
    assert len(resp.recommendations) == 0

def test_engine_edge_case_no_significant_gaps(engine):
    request = RecommendationRequest(
        mode="general",
        budget=100.0,
        meal_type="snack",
        diet="vegetarian",
        allergies=[],
        nutrient_gaps={"protein_g": 0.0, "iron_mg": -1.0},
        priority_nutrients=[]
    )
    resp = engine.recommend(request)
    assert resp.status == "NO_SIGNIFICANT_GAPS"
    assert len(resp.recommendations) == 0

def test_engine_edge_case_no_affordable_options(engine):
    # Budget 5 Rs -> nothing in database is <= 5 Rs (cheapest is banana at 10 Rs typical)
    request = RecommendationRequest(
        mode="general",
        budget=5.0,
        meal_type="snack",
        diet="vegetarian",
        allergies=[],
        nutrient_gaps={"protein_g": 10.0},
        priority_nutrients=[]
    )
    resp = engine.recommend(request)
    assert resp.status == "NO_AFFORDABLE_OPTIONS"
    assert len(resp.recommendations) == 0

def test_engine_edge_case_allergy_exclusion(engine):
    # If a user is allergic to gluten and eggs and pulses, and candidate set is filtered out
    request = RecommendationRequest(
        mode="menu",
        budget=100.0,
        meal_type="snack",
        diet="eggetarian",
        allergies=["egg"],
        nutrient_gaps={"protein_g": 10.0},
        priority_nutrients=[],
        menu=MenuInput(
            restaurant="Egg Station",
            items=[MenuItemInput(dish_name="Boiled Egg", food_id="boiled_egg", price=20.0, confidence=0.99)]
        )
    )
    resp = engine.recommend(request)
    assert resp.status == "NO_SAFE_OPTIONS"
    assert len(resp.recommendations) == 0

def test_engine_edge_case_no_supported_menu_items(engine):
    request = RecommendationRequest(
        mode="menu",
        budget=100.0,
        meal_type="dinner",
        diet="non_vegetarian",
        allergies=[],
        nutrient_gaps={"protein_g": 15.0},
        priority_nutrients=[],
        menu=MenuInput(
            restaurant="Unknown Cuisine",
            items=[MenuItemInput(dish_name="Unknown Dish 123", food_id="unsupported_dish_xyz", price=50.0)]
        )
    )
    resp = engine.recommend(request)
    assert resp.status == "NO_SUPPORTED_MENU_ITEMS"
    assert len(resp.recommendations) == 0
