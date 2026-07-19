import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\notifications\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "message: Your order # has been approved.," in line:
        line = line.replace("message: Your order # has been approved.,", "message: Your order # has been approved.,")
    elif "message: Your order # was rejected: ," in line:
        line = line.replace("message: Your order # was rejected: ,", "message: Your order # was rejected: ,")
    elif "message: Payment # has been fully verified and approved.," in line:
        line = line.replace("message: Payment # has been fully verified and approved.,", "message: Payment # has been fully verified and approved.,")
    elif "message: The price for" in line and "is now" in line:
        line = re.sub(r'message: The price for .*?,', "message: The price for  is now .,", line)
    elif "message: You have been assigned to manage room:" in line:
        line = re.sub(r'message: You have been assigned to manage room: .*?,', "message: You have been assigned to manage room: .,", line)
    elif "message: You have been assigned to receive shipment #" in line:
        line = re.sub(r'message: You have been assigned to receive shipment # .*?,', "message: You have been assigned to receive shipment # from .,", line)
    elif "message: Your daily count for" in line and "approved.," in line:
        line = re.sub(r'message: Your daily count for .*?,', "message: Your daily count for  was approved.,", line)
    elif "message: Your daily count for" in line and "rejected:" in line:
        line = re.sub(r'message: Your daily count for .*?,', "message: Your daily count for  was rejected: ,", line)
    elif "submitted the daily count for" in line:
        line = re.sub(r'message: .*?,', "message: ${storekeeperName} submitted the daily count for .,", line)
    elif "has dropped to" in line and "Below threshold" in line:
        line = re.sub(r'message: .*?,', "message: ${item} has dropped to  (Below threshold: ).,", line)
    elif "encountered a critical sync failure" in line:
        line = re.sub(r'message: .*?,', "message: ${appName} encountered a critical sync failure: .,", line)
    elif "Suspicious action detected" in line:
        line = re.sub(r'message: .*?,', "message: Suspicious action detected: . Details: .,", line)
    elif "logged in from IP" in line:
        line = re.sub(r'message: .*?,', "message: ${email} logged in from IP .,", line)

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
