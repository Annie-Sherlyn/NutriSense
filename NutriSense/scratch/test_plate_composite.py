import sys
from pathlib import Path
from PIL import Image
import numpy as np

sys.path.insert(0, str(Path("dl_service").resolve()))
from detector import FoodPlateDetector

# Create a composite plate image with:
# Top-Left: Beetroot Poriyal
# Top-Right: Carrot Poriyal
# Bottom / Center: Sadham (Rice) or Sambar Sadham
beetroot_img = list(Path("Dataset/lunch/beetroot poriyal").glob("*.jpg"))[0]
carrot_img = list(Path("Dataset/lunch/carrot poriyal").glob("*.jpg"))[0]
rice_img = list(Path("Dataset/lunch/sadham").glob("*.jpg"))[0]
sambar_img = list(Path("Dataset/breakfast/sambar").glob("*.jpg"))[0]

plate_w, plate_h = 600, 600
composite = Image.new("RGB", (plate_w, plate_h), (240, 240, 240))

# Resize sub-dishes
im_beet = Image.open(beetroot_img).resize((280, 280))
im_carr = Image.open(carrot_img).resize((280, 280))
im_rice = Image.open(rice_img).resize((280, 280))
im_samb = Image.open(sambar_img).resize((280, 280))

composite.paste(im_beet, (10, 10))
composite.paste(im_carr, (310, 10))
composite.paste(im_rice, (10, 310))
composite.paste(im_samb, (310, 310))

composite_path = Path("scratch/composite_lunch_plate.jpg")
composite.save(composite_path)

detector = FoodPlateDetector()
res = detector.detect(str(composite_path))

print("\n" + "=" * 60)
print("COMPOSITE PLATE DETECTION TEST:")
print("=" * 60)
print(f"Mode: {res['mode'].upper()} (Multi-Item: {res['isMultiItem']})")
print(f"Message: {res['plateMessage']}")
print(f"Detected Items ({len(res['detectedItems'])}):")
for itm in res['detectedItems']:
    print(f"  - [{itm.get('platePosition', 'Plate')}] {itm['name']} ({round(itm['confidence']*100, 1)}%) [Box: {itm['box']}, Color: {itm.get('color')}]")
print(f"Annotated Image Present: {bool(res['annotatedImage'])}")
print("=" * 60)
