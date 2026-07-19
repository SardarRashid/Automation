import os

app_hub_path = r'D:\AntiGravity\inventory-web-workspace\frontend\src\pages\AppHub.tsx'
with open(app_hub_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
content = re.sub(r"\{\s*id:\s*'inventory-tracker-pwa'[\s\S]*?\},", "", content)
with open(app_hub_path, 'w', encoding='utf-8') as f:
    f.write(content)

processors_path = r'D:\AntiGravity\inventory-web-workspace\backend\processors.py'
with open(processors_path, 'r', encoding='utf-8') as f:
    p_content = f.read()

replacement = '''            final_cols = [col for col in desired_order if col in merged_df.columns]
            merged_df = merged_df[final_cols]
            
            # Explicitly drop the salesman column for Montana if it inadvertently matched
            if self.report_type == "Montana":
                for drop_col in ["Sales Man", "Sales man Name", "Sales man"]:
                    if drop_col in merged_df.columns:
                        merged_df = merged_df.drop(columns=[drop_col])
'''
p_content = p_content.replace('''            final_cols = [col for col in desired_order if col in merged_df.columns]
            merged_df = merged_df[final_cols]''', replacement)

with open(processors_path, 'w', encoding='utf-8') as f:
    f.write(p_content)

print('Patched successfully!')
