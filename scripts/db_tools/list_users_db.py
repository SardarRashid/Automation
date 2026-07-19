import os
import json
import urllib.request
import urllib.error

db_url = None
with open("frontend/src/lib/firebase.ts", "r", encoding="utf-8") as f:
    for line in f:
        if "databaseURL:" in line:
            db_url = line.split('"')[1]

db_endpoint = f"{db_url}/.json"
req = urllib.request.Request(db_endpoint)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        print("Database root keys:", data.keys())
            print(f"Key: {key}, Email: {value.get('email')}, Role: {value.get('role')}")
except urllib.error.HTTPError as e:
    print("Database error:", e.read())





