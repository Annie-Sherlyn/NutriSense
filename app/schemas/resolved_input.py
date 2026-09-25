"""
Pre_meal vs Post_meal distinction:
- Pre_meal inputs represent comparison scenarios (e.g., looking at a menu) where quantities may be unknown. 
  They carry 1+ candidates and expect quantity/unit to be null.
- Post_meal inputs represent logging scenarios (what was eaten). They carry 1+ items where quantity/unit are required.

Nutrient_override precedence rule:
- If `nutrient_override` is populated (e.g., a menu card listing protein/calories), downstream nutrition calculations
  MUST prefer these values over a food_database lookup for this item.

MVP Scope & Confidence Contract:
- Closed-world MVP scope: only foods.csv dishes are expected as input. No category-fallback is needed for this scope; 
  `resolved_food_id` stays nullable only for robustness.
- The downstream code trusts `match_status` rather than raw `confidence`. Items marked "needs_verification" MUST be 
  confirmed by the user before being used in any calculations.
- `assumed_quantity` defaults to 1.0, representing "1 standard serving" for pre-meal comparisons when the quantity 
  is omitted.
"""
from pydantic import BaseModel, model_validator
from typing import Literal
from datetime import datetime

MATCH_CONFIDENCE_THRESHOLD = 0.75

def classify_match(confidence: float | None) -> Literal["confirmed", "needs_verification"]:
    if confidence is None or confidence < MATCH_CONFIDENCE_THRESHOLD:
        return "needs_verification"
    return "confirmed"

MealType = Literal["breakfast", "brunch", "lunch", "snack", "dinner", "other"]

class ResolvedItem(BaseModel):
    raw_label: str
    source: Literal["voice", "menu_ocr", "photo_dish", "manual"]
    resolved_food_id: str | None       # null if no confident DB match
    match_confidence: float | None      # null if source is "manual" (direct pick)
    match_status: Literal["confirmed", "needs_verification"]
    price_inr: float | None = None      # populated for menu_ocr / manual
    nutrient_override: dict[str, float] | None = None  
        # populated only when the source itself printed nutrient values 
        # (e.g. a menu card listing protein/calories); when set, downstream 
        # nutrition calculation MUST prefer these values over a food_database 
        # lookup for this item
    quantity: float | None = None       # required (non-null) when stage == post_meal
    unit: str | None = None             # required (non-null) when stage == post_meal
    assumed_quantity: float = 1.0       # used only when stage is pre_meal and quantity is None

class Constraints(BaseModel):
    budget_inr: float | None = None

class PreMealInput(BaseModel):
    input_id: str
    stage: Literal["pre_meal"] = "pre_meal"
    timestamp: datetime
    candidates: list[ResolvedItem]   # 1+ items, quantity/unit expected null
    meal_type: MealType | None = None
    constraints: Constraints | None = None

class PostMealInput(BaseModel):
    input_id: str
    stage: Literal["post_meal"] = "post_meal"
    timestamp: datetime
    items: list[ResolvedItem]        # 1+ items, quantity/unit required
    meal_type: MealType | None = None

    @model_validator(mode='after')
    def validate_quantity_and_unit(self) -> 'PostMealInput':
        for idx, item in enumerate(self.items):
            if item.quantity is None or item.unit is None:
                raise ValueError(f"Item at index {idx} must specify both quantity and unit for post-meal input.")
        return self
