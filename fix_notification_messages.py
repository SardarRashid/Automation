import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\notifications\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "message: Your order # has been approved.,": "message: Your order # has been approved.,",
    "message: Your order # was rejected: ,": "message: Your order # was rejected: ,",
    "message: Payment # has been fully verified and approved.,": "message: Payment # has been fully verified and approved.,",
    "message: The price for  is now {newPrice}.,": "message: The price for  is now .,",
    "message: You have been assigned to manage room: .,": "message: You have been assigned to manage room: .,",
    "message: You have been assigned to receive shipment # from .,": "message: You have been assigned to receive shipment # from .,",
    "message: Your daily count for  was approved.,": "message: Your daily count for  was approved.,",
    "message: Your daily count for  was rejected: ,": "message: Your daily count for  was rejected: ,",
    "message:  submitted the daily count for .,": "message: ${storekeeperName} submitted the daily count for .,",
    "message:  has dropped to  (Below threshold: ).,": "message: ${item} has dropped to  (Below threshold: ).,",
    "message:  encountered a critical sync failure: .,": "message: ${appName} encountered a critical sync failure: .,",
    "message: Suspicious action detected: . Details: .,": "message: Suspicious action detected: . Details: .,",
    "message:  logged in from IP .,": "message: ${email} logged in from IP .,"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
