import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "dl_service"))

from inference import FoodClassifier
from dataset_utils import scan_dataset

clf = FoodClassifier()
paths, labels, classes = scan_dataset()

test_targets = ['pizza', 'biriyani', 'dosa', 'samosa', 'burger', 'apple', 'noodles', 'idly', 'poori']
samples = {}

for p, l in zip(paths, labels):
    cname = classes[l]
    if cname in test_targets and cname not in samples:
        samples[cname] = p

print("\n" + "=" * 70)
print("TESTING TRAINED MODEL PREDICTIONS ON REAL DISH IMAGES:")
print("=" * 70)
for cname, p in samples.items():
    res = clf.predict(p, top_k=2)
    top_pred = res["topPrediction"]
    conf = res["topConfidence"]
    cand2 = res["candidates"][1]["name"] if len(res["candidates"]) > 1 else ""
    cand2_conf = res["candidates"][1]["confidence"] * 100 if len(res["candidates"]) > 1 else 0
    print(f"Truth: {cname:<12} -> Top: {top_pred:<24} ({conf * 100:.1f}%) | 2nd: {cand2} ({cand2_conf:.1f}%)")
print("=" * 70)
