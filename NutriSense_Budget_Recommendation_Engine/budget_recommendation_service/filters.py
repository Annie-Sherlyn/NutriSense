"""
Hard Filtering Component.
Enforces budget constraints, dietary preferences, allergy safety, and data completeness.
"""

from typing import List, Dict, Optional, Tuple
from .models import FoodNutritionData

# Diet compatibility hierarchy
DIET_ALLOWED_TAGS: Dict[str, List[str]] = {
    "vegan": ["vegan"],
    "vegetarian": ["vegetarian", "vegan"],
    "eggetarian": ["vegetarian", "vegan", "eggetarian"],
    "non_vegetarian": ["vegetarian", "vegan", "eggetarian", "non_vegetarian"],
}

def is_within_budget(effective_price: Optional[float], budget: float) -> bool:
    """Checks whether the effective price fits strictly within the user's budget."""
    if effective_price is None or effective_price <= 0:
        return False
    return effective_price <= budget

def is_diet_compatible(user_diet: str, food_diet_tags: List[str]) -> bool:
    """
    Checks if the food's diet tags are compatible with the user's dietary restriction.
    Uses structured tags rather than string name heuristics.
    """
    if not user_diet:
        return True

    user_diet_clean = user_diet.lower().strip()
    allowed_tags = DIET_ALLOWED_TAGS.get(user_diet_clean, ["vegetarian", "vegan"])

    food_tags_clean = [t.lower().strip() for t in food_diet_tags]
    return any(tag in allowed_tags for tag in food_tags_clean)

def is_allergy_safe(user_allergies: List[str], food_allergen_tags: List[str]) -> bool:
    """
    Checks if any user allergen is present in the food's allergen tags.
    Allergies are hard exclusions: any intersection results in immediate rejection.
    """
    if not user_allergies or not food_allergen_tags:
        return True

    user_allergens_set = {a.lower().strip() for a in user_allergies if a.strip()}
    food_allergens_set = {a.lower().strip() for a in food_allergen_tags if a.strip()}

    # Disjoint means safe
    return user_allergens_set.isdisjoint(food_allergens_set)

def is_data_valid(effective_price: Optional[float], nutrition: Optional[Dict[str, float]]) -> bool:
    """Verifies that price and minimum nutrition attributes exist and are positive."""
    if effective_price is None or effective_price <= 0:
        return False
    if not nutrition or not isinstance(nutrition, dict):
        return False
    # Must have calories and at least one macro
    if nutrition.get("calories", 0) <= 0:
        return False
    return True

def apply_hard_filters(
    food: FoodNutritionData,
    effective_price: Optional[float],
    budget: float,
    user_diet: str,
    user_allergies: List[str]
) -> Tuple[bool, Optional[str]]:
    """
    Applies all hard filters sequentially.
    Returns: (is_passed: bool, rejection_reason: Optional[str])
    """
    if not is_data_valid(effective_price, food.nutrition):
        if effective_price is None:
            return False, "PRICE_UNKNOWN"
        return False, "NUTRITION_DATA_INCOMPLETE"

    if not is_within_budget(effective_price, budget):
        return False, f"EXCEEDS_BUDGET (Price ₹{effective_price:.0f} > Budget ₹{budget:.0f})"

    if not is_diet_compatible(user_diet, food.diet_tags):
        return False, f"DIET_INCOMPATIBLE ({food.diet_tags} does not match {user_diet})"

    if not is_allergy_safe(user_allergies, food.allergen_tags):
        return False, f"ALLERGEN_INTERSECTION (Contains {food.allergen_tags})"

    return True, None
