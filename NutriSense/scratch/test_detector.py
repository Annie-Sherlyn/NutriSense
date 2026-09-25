import sys
from pathlib import Path
sys.path.insert(0, str(Path("dl_service").resolve()))
from detector import FoodPlateDetector

detector = FoodPlateDetector()

test_cases = [
    ('Dosa', list(Path('Dataset/breakfast/dosa').glob('*.jpg'))[0]),
    ('Carrot Poriyal', list(Path('Dataset/lunch/carrot poriyal').glob('*.jpg'))[0]),
    ('Beetroot Poriyal', list(Path('Dataset/lunch/beetroot poriyal').glob('*.jpg'))[0]),
    ('Sambar Sadham', list(Path('Dataset/lunch/sambar sadham').glob('*.jpg'))[0]),
    ('Samosa (New)', list(Path('Dataset/snacks/samosa').glob('*.jpg'))[0]),
    ('Murukku (New)', list(Path('Dataset/snacks/murukku').glob('*.jpg'))[0]),
]

for label, img_path in test_cases:
    res = detector.detect(str(img_path))
    print(f"=== Testing: {label} ({img_path.name}) ===")
    print(f"  Mode: {res['mode']}, isMultiItem: {res['isMultiItem']}")
    print(f"  Message: {res['plateMessage']}")
    print(f"  Detected items ({len(res['detectedItems'])}):")
    for d in res['detectedItems']:
        print(f"    - {d['name']} ({round(d['confidence']*100, 1)}%) [Box: {d['box']}, Color: {d.get('color', '')}]")
    print(f"  Annotated image generated: {bool(res['annotatedImage'])}")
    print()
