import json

file_path = r"D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\functions\package.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

if "tsc" in data["scripts"]["build"]:
    data["scripts"]["build"] = "tsc --skipLibCheck"

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Updated functions build script with --skipLibCheck")
