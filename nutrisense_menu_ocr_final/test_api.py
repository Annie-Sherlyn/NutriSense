import requests

try:
    res = requests.post('http://localhost:8000/api/menu-ocr', files={'image': open('mewnu.webp', 'rb')})
    if res.status_code == 200:
        data = res.json()
        print("Success!")
        print("Stats:", data.get('stats'))
    else:
        print("Error Status:", res.status_code)
        print("Response:", res.text)
except Exception as e:
    print("Exception:", e)
