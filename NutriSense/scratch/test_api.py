import urllib.request
import json
from pathlib import Path

img_path = Path("scratch/composite_lunch_plate.jpg")
with open(img_path, 'rb') as f:
    img_data = f.read()

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
header = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="image"; filename="samosa.jpg"\r\n'
    f'Content-Type: image/jpeg\r\n\r\n'
).encode('utf-8')
footer = f'\r\n--{boundary}--\r\n'.encode('utf-8')
body = header + img_data + footer

req = urllib.request.Request(
    'http://localhost:5173/api/food/image/analyze',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
    method='POST'
)

with urllib.request.urlopen(req) as resp:
    print('Vite Proxy Status:', resp.status)
    data = json.loads(resp.read().decode('utf-8'))
    print('Mode:', data.get('mode'))
    print('Plate Message:', data.get('plateMessage'))
    print('Detected Items Count:', len(data.get('detectedItems', [])))
    for itm in data.get('detectedItems', []):
        print(f"  - {itm['name']} ({round(itm['confidence']*100, 1)}%) [Box: {itm['box']}]")
    print('Annotated Image Present:', bool(data.get('annotatedImage')))
