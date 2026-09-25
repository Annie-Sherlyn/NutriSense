from pydantic import BaseModel

class ComparisonResult(BaseModel):
    winner_food_id: str
    reason: str
    ranked: list[dict]  # food_id, score, notes

class GapRecommendation(BaseModel):
    nutrient: str
    gap_amount: float
    suggested_food_ids: list[str]
    timing_note: str | None = None
