from app.schemas.recommendation import GapRecommendation
from app.schemas.profile import UserProfile
from app.recommendation.candidate_filter import filter_by_profile
import pandas as pd

def suggest_foods(ranked_gaps: list[tuple[str, float]], profile: UserProfile, food_db: pd.DataFrame) -> list[dict]:
    """
    Suggest foods to fill the gaps and filter them based on the user profile.
    """
    # MVP: Hardcoded candidates for the demo
    candidates = [
        {"food_id": "FD001", "name": "Idli"}
    ]
    
    # Filter candidates by profile
    filtered_candidates = filter_by_profile(candidates, profile, food_db)
    
    return filtered_candidates
