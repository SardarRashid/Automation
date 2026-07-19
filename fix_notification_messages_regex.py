import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\notifications\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def replace_message(match):
    original = match.group(0)
    # Just mapping the known broken lines based on what they were supposed to be
    if "Your order # has been approved." in original:
        return "message: Your order # has been approved.,"
    if "Your order # was rejected:" in original:
        return "message: Your order # was rejected: ,"
    if "Payment # has been fully verified and approved." in original:
        return "message: Payment # has been fully verified and approved.,"
    if "The price for  is now {newPrice}." in original:
        return "message: The price for  is now .,"
    if "You have been assigned to manage room: ." in original:
        return "message: You have been assigned to manage room: .,"
    if "You have been assigned to receive shipment # from ." in original:
        return "message: You have been assigned to receive shipment # from .,"
    if "Your daily count for  was approved." in original:
        return "message: Your daily count for  was approved.,"
    if "Your daily count for  was rejected:" in original:
        return "message: Your daily count for  was rejected: ,"
    if "submitted the daily count for ." in original:
        return "message: ${storekeeperName} submitted the daily count for .,"
    if "has dropped to  (Below threshold: )." in original:
        return "message: ${item} has dropped to  (Below threshold: ).,"
    if "encountered a critical sync failure:" in original:
        return "message: ${appName} encountered a critical sync failure: .,"
    if "Suspicious action detected: . Details: ." in original:
        return "message: Suspicious action detected: . Details: .,"
    if "logged in from IP ." in original:
        return "message: ${email} logged in from IP .,"
    return original

# Find anything that starts with 'message: ' and ends with ',' but isn't inside quotes or backticks.
# Actually, since I know the exact lines, I'll just use re.sub with a flexible whitespace regex
content = re.sub(r'message: Your order # has been approved\.,', 'message: Your order # has been approved.,', content)
content = re.sub(r'message: Your order # was rejected: ,', 'message: Your order # was rejected: ,', content)
content = re.sub(r'message: Payment # has been fully verified and approved\.,', 'message: Payment # has been fully verified and approved.,', content)
content = re.sub(r'message: The price for  is now \{newPrice\}\.,', 'message: The price for  is now .,', content)
content = re.sub(r'message: You have been assigned to manage room: \.,', 'message: You have been assigned to manage room: .,', content)
content = re.sub(r'message: You have been assigned to receive shipment # from \.,', 'message: You have been assigned to receive shipment # from .,', content)
content = re.sub(r'message: Your daily count for  was approved\.,', 'message: Your daily count for  was approved.,', content)
content = re.sub(r'message: Your daily count for  was rejected: ,', 'message: Your daily count for  was rejected: ,', content)
content = re.sub(r'message: \$\{storekeeperName\} submitted the daily count for \.,', 'message: ${storekeeperName} submitted the daily count for .,', content)
content = re.sub(r'message: \$\{item\} has dropped to  \(Below threshold: \)\.,', 'message: ${item} has dropped to  (Below threshold: ).,', content)
content = re.sub(r'message: \$\{appName\} encountered a critical sync failure: \.,', 'message: ${appName} encountered a critical sync failure: .,', content)
content = re.sub(r'message: Suspicious action detected: \. Details: \.,', 'message: Suspicious action detected: . Details: .,', content)
content = re.sub(r'message: \$\{email\} logged in from IP \.,', 'message: ${email} logged in from IP .,', content)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
