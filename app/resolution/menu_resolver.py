from app.schemas.raw_input import RawInput
from app.schemas.resolved_input import PreMealInput, PostMealInput, classify_match

def resolve(raw_input: RawInput) -> PreMealInput | PostMealInput:
    """
    TODO: OCR the menu image → parse each line into 
    {raw_label, price_inr, nutrient_override (if the menu prints macros)} → 
    fuzzy-match raw_label against food_database to get resolved_food_id + 
    match_confidence → classify_match() to get match_status → 
    assemble PreMealInput (stage is pre_meal by default for this source, 
    but should still read RawInput.stage in case of post-meal use).
    """
    pass
