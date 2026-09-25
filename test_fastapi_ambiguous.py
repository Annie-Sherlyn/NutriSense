import requests
import json

health_url = "http://localhost:8000/health"
print(f"Testing {health_url}...")
try:
    res = requests.get(health_url)
    print("Status:", res.status_code)
    print(res.json())
except Exception as e:
    print(e)

print("\n-----------------------\n")

url = "http://localhost:8000/voice/log"
file_path = "test_audio_ambiguous.mp3"
print(f"Testing {url} with {file_path}...")
with open(file_path, "rb") as f:
    files = {"file": (file_path, f, "audio/mpeg")}
    response = requests.post(url, files=files)
    
print("Status Code:", response.status_code)
try:
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(response.text)
