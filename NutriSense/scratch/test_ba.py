import sys
from pathlib import Path
sys.path.insert(0, str(Path("dl_service").resolve()))
from detector import FoodPlateDetector

det = FoodPlateDetector()
res = det.detect("scratch/test_banana_apple.jpg")
print("Mode:", res["mode"], "| isMulti:", res["isMultiItem"])
print("Message:", res["plateMessage"])
for d in res["detectedItems"]:
    conf = d["confidence"] * 100
    print(f"  Detected: {d['name']} ({conf:.1f}%) | Box: {d['box']} | Pos: {d.get('platePosition')}")
