"""
Cost-Wise Nutrient Recommendation Engine (BANS Engine).
Pure orchestration of price resolution, hard filters, scoring, pair optimization, and explanations.
"""

from typing import List, Dict, Optional, Tuple

from .models import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationItem,
    FoodItemRef,
    ScoreBreakdown,
    EvaluatedCandidate,
    FoodNutritionData,
)
from .config import DEFAULT_TOP_K
from .repositories.nutrition_repository import NutritionRepository, MockNutritionRepository
from .repositories.price_repository import PriceBandRepository, LocalPriceBandRepository
from .providers.menu_price_provider import MenuPriceProvider, MockMenuPriceProvider
from .price_resolver import PriceResolver
from .filters import apply_hard_filters
from .scoring import (
    calculate_nutrient_coverage,
    calculate_gap_score,
    calculate_affordability,
    calculate_value_score,
    calculate_meal_score,
    calculate_bans,
)
from .combinations import evaluate_pairs, apply_diversity_filter
from .explanations import generate_reasons

class BudgetRecommendationEngine:
    """
    Budget-Aware Nutrient Recommendation Engine.
    Evaluates affordable foods and food pairs to maximize remaining nutrient gap coverage.
    """

    def __init__(
        self,
        nutrition_repo: Optional[NutritionRepository] = None,
        price_repo: Optional[PriceBandRepository] = None,
        menu_provider: Optional[MenuPriceProvider] = None,
    ):
        self.nutrition_repo = nutrition_repo or MockNutritionRepository()
        self.price_repo = price_repo or LocalPriceBandRepository()
        self.menu_provider = menu_provider or MockMenuPriceProvider()
        self.price_resolver = PriceResolver(self.price_repo)

    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        """
        Executes the end-to-end recommendation pipeline based on the input contract.
        """
        # 1. Edge Case: Non-positive budget
        if request.budget <= 0:
            return RecommendationResponse(
                status="NO_BUDGET",
                mode=request.mode,
                budget=request.budget,
                nutrient_gaps=request.nutrient_gaps,
                eligible_food_count=0,
                recommendations=[],
                message="Budget must be greater than zero."
            )

        # 2. Edge Case: No positive nutrient gaps
        has_positive_gap = any(v is not None and v > 0 for v in request.nutrient_gaps.values())
        if not has_positive_gap:
            return RecommendationResponse(
                status="NO_SIGNIFICANT_GAPS",
                mode=request.mode,
                budget=request.budget,
                nutrient_gaps=request.nutrient_gaps,
                eligible_food_count=0,
                recommendations=[],
                message="All nutrient requirements have already been fulfilled. No active gaps to close."
            )

        # 3. Candidate Universe Selection & Menu Pricing
        current_menu_items = None
        if request.mode == "menu":
            current_menu_items = self.menu_provider.get_menu_items(request.menu)
            if not current_menu_items:
                return RecommendationResponse(
                    status="NO_SUPPORTED_MENU_ITEMS",
                    mode=request.mode,
                    budget=request.budget,
                    nutrient_gaps=request.nutrient_gaps,
                    eligible_food_count=0,
                    recommendations=[],
                    message="No dishes on the scanned menu could be matched with the supported food database."
                )
            # Candidate universe is strictly the foods available on the menu
            candidate_foods: List[FoodNutritionData] = []
            for food_id in current_menu_items.keys():
                food = self.nutrition_repo.get_food(food_id)
                if food:
                    candidate_foods.append(food)

            if not candidate_foods:
                return RecommendationResponse(
                    status="NO_SUPPORTED_MENU_ITEMS",
                    mode=request.mode,
                    budget=request.budget,
                    nutrient_gaps=request.nutrient_gaps,
                    eligible_food_count=0,
                    recommendations=[],
                    message="None of the dishes on the scanned menu could be matched with the supported nutrition database."
                )
        else:
            # Mode A: General Recommendation uses the full supported food repository
            candidate_foods = self.nutrition_repo.get_all_foods()

        # 4. Price Resolution and Hard Filtering
        surviving_candidates: List[Tuple[FoodNutritionData, float, str, str]] = []
        filter_rejection_counts: Dict[str, int] = {
            "budget": 0,
            "diet": 0,
            "allergy": 0,
            "data": 0
        }

        for food in candidate_foods:
            resolved = self.price_resolver.resolve_price(
                food_id=food.food_id,
                current_menu_items=current_menu_items,
                user_id=request.user_id,
                order_history=request.order_history
            )

            passed, reason = apply_hard_filters(
                food=food,
                effective_price=resolved.effective_price,
                budget=request.budget,
                user_diet=request.diet,
                user_allergies=request.allergies
            )

            if passed and resolved.effective_price is not None:
                surviving_candidates.append(
                    (food, resolved.effective_price, resolved.source, resolved.confidence)
                )
            elif reason:
                if "BUDGET" in reason:
                    filter_rejection_counts["budget"] += 1
                elif "DIET" in reason:
                    filter_rejection_counts["diet"] += 1
                elif "ALLERGEN" in reason:
                    filter_rejection_counts["allergy"] += 1
                else:
                    filter_rejection_counts["data"] += 1

        # 5. Handle empty survivors edge cases
        if not surviving_candidates:
            if filter_rejection_counts["allergy"] > 0 and len(candidate_foods) == filter_rejection_counts["allergy"]:
                status = "NO_SAFE_OPTIONS"
                msg = "All available options were excluded due to allergen safety constraints."
            elif filter_rejection_counts["diet"] > 0 and len(candidate_foods) == (filter_rejection_counts["diet"] + filter_rejection_counts["allergy"]):
                status = "NO_SAFE_OPTIONS"
                msg = f"No options available matching dietary preference: {request.diet}."
            else:
                status = "NO_AFFORDABLE_OPTIONS"
                msg = f"No foods found within ₹{request.budget:.0f} budget."

            return RecommendationResponse(
                status=status,
                mode=request.mode,
                budget=request.budget,
                nutrient_gaps=request.nutrient_gaps,
                eligible_food_count=0,
                recommendations=[],
                message=msg
            )

        # 6. Single Candidate Evaluation
        single_evaluated: List[EvaluatedCandidate] = []
        for food, price, src, conf in surviving_candidates:
            coverage = calculate_nutrient_coverage(food.nutrition, request.nutrient_gaps)
            gap_score = calculate_gap_score(coverage, request.priority_nutrients)
            affordability = calculate_affordability(price, request.budget)
            value_score = calculate_value_score(gap_score, affordability)
            meal_score = calculate_meal_score(request.meal_type, food.meal_tags)
            bans = calculate_bans(gap_score, value_score, meal_score)

            single_evaluated.append(
                EvaluatedCandidate(
                    food_ids=[food.food_id],
                    display_names=[food.display_name],
                    servings=[food.serving],
                    combination_groups=[food.combination_group],
                    total_price=price,
                    price_source=src,
                    price_confidence=conf,
                    combined_nutrients=food.nutrition,
                    coverage_by_nutrient=coverage,
                    gap_score=gap_score,
                    affordability_score=affordability,
                    value_score=value_score,
                    meal_score=meal_score,
                    bans_score=bans,
                    is_pair=False
                )
            )

        # 7. Pair Optimizer Evaluation
        pair_evaluated = evaluate_pairs(
            eligible_foods=surviving_candidates,
            budget=request.budget,
            meal_type=request.meal_type,
            nutrient_gaps=request.nutrient_gaps,
            priority_nutrients=request.priority_nutrients
        )

        # 8. Combined Ranking and Diversity Filtering
        all_candidates = single_evaluated + pair_evaluated
        all_candidates.sort(
            key=lambda c: (c.bans_score, c.value_score, c.gap_score),
            reverse=True
        )

        top_candidates = apply_diversity_filter(all_candidates, top_k=DEFAULT_TOP_K)

        # 9. Format Recommendation Output Items with Explanations
        output_items: List[RecommendationItem] = []
        for idx, cand in enumerate(top_candidates, start=1):
            reasons = generate_reasons(
                candidate=cand,
                budget=request.budget,
                meal_type=request.meal_type,
                priority_nutrients=request.priority_nutrients
            )

            foods_ref = [
                FoodItemRef(
                    food_id=cand.food_ids[i],
                    display_name=cand.display_names[i],
                    serving=cand.servings[i]
                )
                for i in range(len(cand.food_ids))
            ]

            output_items.append(
                RecommendationItem(
                    rank=idx,
                    type="pair" if cand.is_pair else "single",
                    foods=foods_ref,
                    total_price=round(cand.total_price, 2),
                    price_source=cand.price_source,
                    price_confidence=cand.price_confidence,
                    scores=ScoreBreakdown(
                        gap_score=cand.gap_score,
                        affordability_score=cand.affordability_score,
                        value_score=cand.value_score,
                        meal_score=cand.meal_score,
                        bans_score=cand.bans_score
                    ),
                    nutrient_coverage=cand.coverage_by_nutrient,
                    reasons=reasons
                )
            )

        return RecommendationResponse(
            status="success",
            mode=request.mode,
            budget=request.budget,
            nutrient_gaps=request.nutrient_gaps,
            eligible_food_count=len(surviving_candidates),
            recommendations=output_items,
            message=f"Found {len(output_items)} optimal recommendations within budget."
        )
