"""
Unit test for FastAPI endpoint POST /recommendations/budget.
"""

from fastapi.testclient import TestClient
from budget_recommendation_service.api import app

client = TestClient(app)

def test_api_recommendation_general():
    payload = {
        "mode": "general",
        "budget": 100,
        "meal_type": "snack",
        "diet": "vegetarian",
        "allergies": [],
        "nutrient_gaps": {
            "protein_g": 20,
            "iron_mg": 5
        },
        "priority_nutrients": ["protein_g"]
    }
    response = client.post("/recommendations/budget", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["mode"] == "general"
    assert len(data["recommendations"]) > 0
    assert data["recommendations"][0]["scores"]["bans_score"] > 0
