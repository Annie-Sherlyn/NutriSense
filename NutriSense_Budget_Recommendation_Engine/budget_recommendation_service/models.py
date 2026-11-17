"""
Pydantic data models and schemas for the Cost-Wise Nutrient Recommendation Engine.
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field

# Normalized nutrient keys mapping aliases to canonical schema keys
NUTRIENT_KEY_ALIASES: Dict[str, str] = {
    "protein": "protein_g",
    "protein_g": "protein_g",
    "iron": "iron_mg",
    "iron_mg": "iron_mg",
    "fiber": "fiber_g",
    "fiber_g": "fiber_g",
    "calcium": "calcium_mg",
    "calcium_mg": "calcium_mg",
    "vitamin_b12": "vitamin_b12_mcg",
    "vitamin_b12_mcg": "vitamin_b12_mcg",
    "b12": "vitamin_b12_mcg",
    "calories": "calories",
    "carbs": "carbs_g",
    "carbs_g": "carbs_g",
    "fat": "fat_g",
    "fat_g": "fat_g",
}

class MenuItemInput(BaseModel):
    dish_name: str
    food_id: Optional[str] = None
    price: float
    confidence: Optional[float] = 1.0

class MenuInput(BaseModel):
    restaurant: Optional[str] = None
    items: List[MenuItemInput] = Field(default_factory=list)

class PastOrderRecord(BaseModel):
    food_id: str
    dish_name: Optional[str] = None
    price: float
    source: Optional[str] = "ocr_screenshot"
    timestamp: Optional[str] = None

class RecommendationRequest(BaseModel):
    mode: Literal["general", "menu"] = "general"
    budget: float
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"] = "snack"
    diet: Literal["vegetarian", "eggetarian", "non_vegetarian", "vegan"] = "vegetarian"
    allergies: List[str] = Field(default_factory=list)
    nutrient_gaps: Dict[str, float] = Field(default_factory=dict)
    priority_nutrients: List[str] = Field(default_factory=list)
    menu: Optional[MenuInput] = None
    user_id: Optional[str] = None
    order_history: Optional[List[PastOrderRecord]] = None

class FoodItemRef(BaseModel):
    food_id: str
    display_name: str
    serving: str

class ScoreBreakdown(BaseModel):
    gap_score: float
    affordability_score: float
    value_score: float
    meal_score: float
    bans_score: float

class RecommendationItem(BaseModel):
    rank: int
    type: Literal["single", "pair"]
    foods: List[FoodItemRef]
    total_price: float
    price_source: Literal["current_menu", "user_history_avg", "local_price_band", "unknown"]
    price_confidence: str
    scores: ScoreBreakdown
    nutrient_coverage: Dict[str, float]
    reasons: List[str]

class RecommendationResponse(BaseModel):
    status: str
    mode: str
    budget: float
    nutrient_gaps: Dict[str, float]
    eligible_food_count: int
    recommendations: List[RecommendationItem] = Field(default_factory=list)
    message: Optional[str] = None

# Internal Domain Models
class FoodNutritionData(BaseModel):
    food_id: str
    display_name: str
    serving: str
    nutrition: Dict[str, float]
    diet_tags: List[str] = Field(default_factory=list)
    allergen_tags: List[str] = Field(default_factory=list)
    meal_tags: List[str] = Field(default_factory=list)
    combination_group: str = "standalone"

class FoodPriceBandData(BaseModel):
    food_id: str
    display_name: str
    serving_description: str
    price_min: float
    price_typical: float
    price_max: float
    city: str = "Chennai"
    state: str = "Tamil Nadu"
    currency: str = "INR"
    source_type: str = "local_seed"
    confidence: str = "medium"

class ResolvedPrice(BaseModel):
    effective_price: Optional[float]
    source: Literal["current_menu", "user_history_avg", "local_price_band", "unknown"]
    confidence: str

class EvaluatedCandidate(BaseModel):
    food_ids: List[str]
    display_names: List[str]
    servings: List[str]
    combination_groups: List[str]
    total_price: float
    price_source: Literal["current_menu", "user_history_avg", "local_price_band", "unknown"]
    price_confidence: str
    combined_nutrients: Dict[str, float]
    coverage_by_nutrient: Dict[str, float]
    gap_score: float
    affordability_score: float
    value_score: float
    meal_score: float
    bans_score: float
    is_pair: bool = False
