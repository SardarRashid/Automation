import json

with open("database.rules.json", "r", encoding="utf-8") as f:
    rules = json.load(f)

BLOCK_COND = "root.child('users').child(auth.token.email.replace('.', '_')).child('disabled').val() !== true && root.child('users').child(auth.token.email.replace('.', '_')).child('locked').val() !== true"

def modify_rule(rule_str):
    if not rule_str:
        return rule_str
    if "disabled" in rule_str or "locked" in rule_str:
        return rule_str # already modified
    return f"({rule_str}) && {BLOCK_COND}"

def traverse_rules(node):
    if isinstance(node, dict):
        for key, val in node.items():
            if key in [".read", ".write"]:
                if isinstance(val, str):
                    node[key] = modify_rule(val)
            elif isinstance(val, dict):
                traverse_rules(val)

traverse_rules(rules)

with open("database.rules.json", "w", encoding="utf-8") as f:
    json.dump(rules, f, indent=2)

print("database.rules.json modified.")
