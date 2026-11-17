"""
Deterministic Explanation Generator.
Constructs transparent, verifiable reasons from mathematical scores and nutrient coverages.
Does not use LLMs or unpredictable heuristics.
"""

from typing import List
from .models import EvaluatedCandidate

NUTRIENT_PRETTY_NAMES = {
    "protein": "protein",
    "protein_g": "protein",
    "iron": "iron",
    "iron_mg": "iron",
    "fiber": "fiber",
    "fiber_g": "fiber",
    "calcium": "calcium",
    "calcium_mg": "calcium",
    "vitamin_b12": "Vitamin B12",
    "vitamin_b12_mcg": "Vitamin B12",
    "calories": "energy/calories",
}

def generate_reasons(
    candidate: EvaluatedCandidate,
    budget: float,
    meal_type: str,
    priority_nutrients: List[str]
) -> List[str]:
    """
    Generates a deterministic list of reasons explaining why this item was recommended.
    """
    reasons: List[str] = []

    # 1. Budget Affordability & Price Provenance
    if candidate.total_price < budget * 0.70:
        reasons.append(f"Comfortably fits within ₹{budget:.0f} budget (Cost: ₹{candidate.total_price:.0f}, {candidate.affordability_score*100:.0f}% savings)")
    else:
        reasons.append(f"Fits within ₹{budget:.0f} budget (Cost: ₹{candidate.total_price:.0f})")

    if candidate.price_source == "current_menu":
        reasons.append("Priced directly from current restaurant menu")
    elif candidate.price_source == "user_history_avg":
        reasons.append(f"Estimated from your average past scanned order history (₹{candidate.total_price:.0f})")

    # 2. Priority Nutrient Coverage
    priority_clean = [p.lower().replace("_g", "").replace("_mg", "").replace("_mcg", "") for p in priority_nutrients]
    for n_key, cov in candidate.coverage_by_nutrient.items():
        clean_key = n_key.lower().replace("_g", "").replace("_mg", "").replace("_mcg", "")
        pretty_name = NUTRIENT_PRETTY_NAMES.get(n_key, clean_key)
        if clean_key in priority_clean:
            if cov >= 0.75:
                reasons.append(f"Strongly satisfies priority {pretty_name} requirement ({cov*100:.0f}% coverage)")
            elif cov >= 0.30:
                reasons.append(f"Contributes significantly toward priority {pretty_name} gap ({cov*100:.0f}% coverage)")

    # 3. Overall Top Nutrient Coverages (non-priority)
    sorted_cov = sorted(
        [(k, v) for k, v in candidate.coverage_by_nutrient.items() if k.lower().replace("_g", "").replace("_mg", "").replace("_mcg", "") not in priority_clean],
        key=lambda x: x[1],
        reverse=True
    )
    for n_key, cov in sorted_cov[:2]:
        if cov >= 0.50:
            pretty_name = NUTRIENT_PRETTY_NAMES.get(n_key, n_key)
            reasons.append(f"Substantially covers remaining {pretty_name} gap ({cov*100:.0f}%)")
        elif cov >= 0.25 and len(reasons) < 4:
            pretty_name = NUTRIENT_PRETTY_NAMES.get(n_key, n_key)
            reasons.append(f"Provides useful intake toward {pretty_name} ({cov*100:.0f}%)")

    # 4. Combination Benefit
    if candidate.is_pair:
        reasons.append(
            f"Synergistic pair: {candidate.display_names[0]} + {candidate.display_names[1]} improves multiple nutrient coverages together"
        )

    # 5. Meal Suitability
    if candidate.meal_score >= 1.0:
        reasons.append(f"Ideal meal match for {meal_type.capitalize()}")
    elif candidate.meal_score >= 0.5:
        reasons.append(f"Suitable option for {meal_type.capitalize()}")

    return reasons[:5]
