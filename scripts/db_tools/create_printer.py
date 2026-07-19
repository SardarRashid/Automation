import os
import json
import urllib.request
import urllib.error

# Extract Firebase API key from frontend/src/lib/firebase.ts
api_key = None
db_url = None
with open("frontend/src/lib/firebase.ts", "r", encoding="utf-8") as f:
    for line in f:
        if "apiKey:" in line:
            api_key = line.split('"')[1]
        elif "databaseURL:" in line:
            db_url = line.split('"')[1]

if not api_key:
    print("Could not find API key")
    exit(1)

email = "printer@system.com"
password = "printerpassword123"

# 1. Sign up user
signup_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={api_key}"
signup_data = json.dumps({"email": email, "password": password, "returnSecureToken": True}).encode("utf-8")
req = urllib.request.Request(signup_url, data=signup_data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read())
        id_token = res_data["idToken"]
        local_id = res_data["localId"]
        print(f"Created Firebase Auth User: {email}")
except urllib.error.HTTPError as e:
    err_res = json.loads(e.read())
    if err_res["error"]["message"] == "EMAIL_EXISTS":
        print("Email already exists. Attempting to login to get idToken...")
        # Login to get id token
        login_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
        login_data = json.dumps({"email": email, "password": password, "returnSecureToken": True}).encode("utf-8")
        login_req = urllib.request.Request(login_url, data=login_data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(login_req) as login_resp:
                res_data = json.loads(login_resp.read())
                id_token = res_data["idToken"]
                local_id = res_data["localId"]
                print("Logged in successfully.")
        except Exception as login_err:
            print("Failed to login to existing account. Maybe wrong password?")
            exit(1)
    else:
        print("Error creating user:", err_res)
        exit(1)

# 2. Add user to Realtime DB
user_key = email.replace(".", "_")
db_endpoint = f"{db_url}/users/{user_key}.json?auth={id_token}"

user_data = {
    "email": email,
    "name": "Sticker Printer",
    "role": "extension",
    "allowedApps": {
        "extension": True
    },
    "permissions": {}
}

db_req = urllib.request.Request(db_endpoint, data=json.dumps(user_data).encode("utf-8"), headers={"Content-Type": "application/json"}, method="PUT")
try:
    with urllib.request.urlopen(db_req) as response:
        print("Successfully updated database with extension user profile.")
except urllib.error.HTTPError as e:
    print("Database error:", e.read())


