import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\reporting\ReportingEngine.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { ref, get } from 'firebase/database';", "import { ref, get, query, orderByChild, startAt, endAt } from 'firebase/database';")

# A helper block to replace basic get with optimized queries
def apply_query(block, node, date_field="date"):
    old_call = f"const {block} = await get(ref(database, '{node}'));"
    
    new_call = f"""    let {block}Ref: any = ref(database, '{node}');
    if (filters.dateFrom && filters.dateTo) {{
      {block}Ref = query(ref(database, '{node}'), orderByChild('{date_field}'), startAt(filters.dateFrom), endAt(filters.dateTo));
    }} else if (filters.dateFrom) {{
      {block}Ref = query(ref(database, '{node}'), orderByChild('{date_field}'), startAt(filters.dateFrom));
    }} else if (filters.dateTo) {{
      {block}Ref = query(ref(database, '{node}'), orderByChild('{date_field}'), endAt(filters.dateTo));
    }}
    const {block} = await get({block}Ref);"""
    
    return content.replace(old_call, new_call)

content = apply_query("paySnap", "sales_payments")
content = apply_query("mdocSnap", "material_documents")
content = apply_query("ordSnap", "sales_orders")
content = apply_query("ordersSnap", "sales_orders")
content = apply_query("paymentsSnap", "sales_payments")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated ReportingEngine.ts with queries")
