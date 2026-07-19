import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AppHub.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add a button for Salesman Mobile
if "salesman_mobile" not in content:
    mobile_btn = """
      {permissions.salesman_admin && (
        <button
          onClick={() => onNavigate('salesman_mobile')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all text-left group flex flex-col justify-between"
        >
          <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Salesman Mobile</h3>
            <p className="text-sm text-slate-500">Test the mobile app view for field sales reps.</p>
          </div>
        </button>
      )}
"""
    # Insert near the salesman_admin button
    content = re.sub(r'(<h3 className="font-bold text-slate-800 text-lg mb-1">Salesman HQ</h3>\s*<p className="text-sm text-slate-500">Manage field sales, customers, and payment tracking.</p>\s*</div>\s*</button>\s*)\}', rf'\1{mobile_btn}}}', content)
    
    # Import Smartphone if not exists
    if "Smartphone" not in content:
        content = content.replace("from 'lucide-react';", ", Smartphone } from 'lucide-react';")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added Salesman Mobile button to AppHub.")
else:
    print("AppHub already has Salesman Mobile.")
