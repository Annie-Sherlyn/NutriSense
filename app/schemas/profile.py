from pydantic import BaseModel
from typing import Literal

class UserProfile(BaseModel):
    name: str
    email: str | None = None
    diet_type: Literal["vegetarian", "vegan", "eggitarian", "non_vegetarian"]
    age_group: Literal["under_18", "18_24", "25_34", "35_50", "50_plus"]
    gender: Literal["male", "female", "other"]
    activity_level: Literal["sedentary", "moderate", "active"]
    health_goal: str | None = None
    meal_budget_inr: float
    priority_nutrients: list[str]
    allergens: list[str] = []
    location: str | None = None

DEMO_PROFILE = UserProfile(
    name="Aarav Sharma",
    diet_type="non_vegetarian",
    age_group="18_24",
    gender="male",
    activity_level="moderate",
    meal_budget_inr=150.0,
    priority_nutrients=["protein_g", "iron_mg", "calcium_mg"],
    allergens=["eggs"]
)
