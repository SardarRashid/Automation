import firebase_admin
from firebase_admin import credentials, auth
import json

with open("firebase_service_account.json") as f:
    cert = json.load(f)

cred = credentials.Certificate(cert)
try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app(cred)

page = auth.list_users()
for user in page.users:
    print(f"User: {user.uid}, Email: {user.email}")
