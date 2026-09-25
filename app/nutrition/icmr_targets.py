from app.schemas.profile import UserProfile
from app.nutrition.targets import DEFAULT_TARGETS

NutrientTargets = dict[str, float]

def get_targets_for_profile(profile: UserProfile) -> NutrientTargets:
    """
    Looks up ICMR-NIN 2020/2024 daily targets by (age_group, gender, activity_level).
    Note: Exact numbers should be verified against official ICMR-NIN 2024 tables before the real demo.
    Falls back to DEFAULT_TARGETS for unspecified nutrients.
    """
    targets = DEFAULT_TARGETS.copy()
    
    # Activity level adjustments for calories (example values)
    if profile.activity_level == "sedentary":
        targets["calories_kcal"] = 1900.0 if profile.gender == "female" else 2300.0
    elif profile.activity_level == "moderate":
        targets["calories_kcal"] = 2200.0 if profile.gender == "female" else 2700.0
    elif profile.activity_level == "active":
        targets["calories_kcal"] = 2500.0 if profile.gender == "female" else 3000.0

    # Gender adjustments for iron (ICMR-NIN values often show large differences)
    if profile.gender == "female":
        targets["iron_mg"] = 29.0
    elif profile.gender == "male":
        targets["iron_mg"] = 19.0
        
    return targets
