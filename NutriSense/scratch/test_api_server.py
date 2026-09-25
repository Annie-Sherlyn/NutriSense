import sys
import json
from pathlib import Path
from fastapi.testclient import TestClient
from PIL import Image
import io

sys.path.insert(0, str(Path("dl_service").resolve()))
from server import app

client = TestClient(app)

def test_api():
    # 1. Health endpoint
    health_resp = client.get("/health")
    print(f"Health status: {health_resp.status_code}")
    print("Health response:", json.dumps(health_resp.json(), indent=2))
    assert health_resp.status_code == 200

    # 2. Classes endpoint
    classes_resp = client.get("/classes")
    print(f"Classes status: {classes_resp.status_code}, count: {len(classes_resp.json())}")
    assert classes_resp.status_code == 200

    # 3. Analyze plate endpoint
    test_img_path = Path("scratch/eval_suite/case_1_two_item_combo.jpg")
    with open(test_img_path, "rb") as f:
        img_bytes = f.read()

    analyze_resp = client.post(
        "/food/image/analyze",
        files={"image": ("plate.jpg", img_bytes, "image/jpeg")}
    )
    print(f"Analyze status: {analyze_resp.status_code}")
    assert analyze_resp.status_code == 200

    data = analyze_resp.json()
    print("Analyze result keys:", list(data.keys()))
    print(f"Success: {data.get('success')}, source: {data.get('source')}")
    print(f"Items count: {len(data.get('items', []))}")
    for item in data.get("items", []):
        print(f"  - {item['dish_name']} (conf={item['confidence']}, qty={item['quantity']}, confirm={item['needs_confirmation']})")

    # Verify required keys
    assert data["success"] is True
    assert data["source"] == "dish_photo"
    assert "items" in data
    assert "needs_confirmation" in data
    assert "isMultiItem" in data
    assert "mode" in data
    assert "detectedItems" in data
    assert "annotatedImage" in data
    print("\nAPI Integration Test PASSED successfully!")

if __name__ == "__main__":
    test_api()
