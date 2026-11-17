"""
FastAPI Route for Budget-Aware Nutrient Recommendation Engine.
Provides a thin HTTP adapter layer that delegates directly to the core BudgetRecommendationEngine.
"""

from fastapi import FastAPI, APIRouter, HTTPException
from .models import RecommendationRequest, RecommendationResponse
from .engine import BudgetRecommendationEngine

router = APIRouter(prefix="/recommendations", tags=["Budget Recommendations"])
engine = BudgetRecommendationEngine()

@router.post("/budget", response_model=RecommendationResponse)
def get_budget_recommendations(request: RecommendationRequest) -> RecommendationResponse:
    """
    POST /recommendations/budget
    Accepts remaining nutrient gaps, user budget, diet, allergies, meal type, and optional menu data.
    Returns ranked individual foods and synergistic food pairs with deterministic BANS scores and reasons.
    """
    try:
        response = engine.recommend(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")

# Standalone app instance for running or testing this microservice independently
app = FastAPI(
    title="NutriSense Cost-Wise Nutrient Recommendation Service",
    description="Budget-Aware Nutrient Recommendation Engine (BANS) microservice",
    version="1.0.0"
)
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("budget_recommendation_service.api:app", host="127.0.0.1", port=8002, reload=True)
