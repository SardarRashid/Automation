
import json

with open("database.rules.json", "r") as f:
    rules = json.load(f)

users_rule = rules["rules"]["users"]

# We want to change the top-level users .write and add a $userId child
users_rule[".write"] = "auth != null && (root.child(\x27users\x27).child(auth.token.email.replace(\x27.\x27, \x27_\x27)).child(\x27role\x27).val() === \x27it_admin\x27 || root.child(\x27users\x27).child(auth.token.email.replace(\x27.\x27, \x27_\x27)).child(\x27role\x27).val() === \x27admin\x27)"
users_rule["$userId"] = {
    ".write": "auth != null && !data.exists() && newData.child(\x27email\x27).val() === auth.token.email && newData.child(\x27role\x27).val() === \x27pending\x27"
}

with open("database.rules.json", "w") as f:
    json.dump(rules, f, indent=2)

print("Updated rules!")

