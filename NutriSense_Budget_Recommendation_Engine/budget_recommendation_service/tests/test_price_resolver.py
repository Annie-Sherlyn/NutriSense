"""
Unit tests for PriceResolver.
Verifies menu price override, local price band fallback, and unknown price handling.
"""

import pytest
from budget_recommendation_service.price_resolver import PriceResolver
from budget_recommendation_service.repositories.price_repository import LocalPriceBandRepository
from budget_recommendation_service.models import MenuItemInput

@pytest.fixture
def price_resolver():
    repo = LocalPriceBandRepository()
    return PriceResolver(repo)

def test_resolve_price_from_local_bands(price_resolver):
    # Dosa typical price in seed is 110.0
    res = price_resolver.resolve_price("dosa")
    assert res.effective_price == 110.0
    assert res.source == "local_price_band"
    assert res.confidence == "medium"

def test_current_menu_overrides_seed_price(price_resolver):
    # Mock menu has Dosa at 75 with confidence 0.96
    menu_items = {
        "dosa": MenuItemInput(dish_name="Plain Dosa", food_id="dosa", price=75.0, confidence=0.96)
    }
    res = price_resolver.resolve_price("dosa", menu_items)
    assert res.effective_price == 75.0
    assert res.source == "current_menu"
    assert res.confidence == "0.96"

def test_unknown_food_price(price_resolver):
    res = price_resolver.resolve_price("non_existent_dish_xyz")
    assert res.effective_price is None
    assert res.source == "unknown"
    assert res.confidence == "none"

def test_menu_mode_fallback_when_item_not_in_menu(price_resolver):
    # In general price resolution logic, if item not in menu, falls back to seed
    menu_items = {
        "idly": MenuItemInput(dish_name="Idly", food_id="idly", price=55.0, confidence=0.94)
    }
    # Query dosa, which is not in this specific menu
    res = price_resolver.resolve_price("dosa", menu_items)
    assert res.effective_price == 110.0
    assert res.source == "local_price_band"

def test_new_user_without_history_uses_seed_price_bands(price_resolver):
    # A new user has no previous menu or screenshot uploads in database
    res = price_resolver.resolve_price("dosa", user_id="new_user_unregistered_999")
    assert res.effective_price == 110.0
    assert res.source == "local_price_band"

def test_returning_user_with_ocr_history_uses_average_price(price_resolver):
    # 'user_returning_01' previously uploaded order screenshots with Dosa at 70 and 80 -> avg 75.0
    res = price_resolver.resolve_price("dosa", user_id="user_returning_01")
    assert res.effective_price == 75.0
    assert res.source == "user_history_avg"
    assert res.confidence == "high"

def test_current_menu_overrides_user_history(price_resolver):
    # Even if returning user has history average of 75, active session menu at 65 takes precedence
    current_menu = {
        "dosa": MenuItemInput(dish_name="Plain Dosa", food_id="dosa", price=65.0, confidence=0.99)
    }
    res = price_resolver.resolve_price("dosa", current_menu_items=current_menu, user_id="user_returning_01")
    assert res.effective_price == 65.0
    assert res.source == "current_menu"
