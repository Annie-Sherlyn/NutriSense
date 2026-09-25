from app.schemas.raw_input import RawInput
from app.schemas.resolved_input import PreMealInput, PostMealInput, classify_match

def resolve(raw_input: RawInput) -> PreMealInput | PostMealInput:
    """
    TODO: DL classifier on the dish image → single 
    {raw_label, resolved_food_id, match_confidence} → classify_match() to get 
    match_status → typically post_meal (photo of what was eaten) with quantity 
    defaulted to 1 serving unless the user is prompted to confirm portion size.
    """
    pass
