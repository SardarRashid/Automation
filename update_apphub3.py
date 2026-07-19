import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AppHub.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "central-reports" not in content:
    # We add a new AppCard
    new_card = """  {
    id: 'central-reports',
    name: 'HQ Central Reports',
    description: 'Centralized native reporting engine for Sales, Inventory, and Management data.',
    icon: <AppWindow className="w-8 h-8 text-indigo-600" />,
    type: 'web-app',
    downloadUrl: '#'
  },
"""
    content = content.replace("  {\n    id: 'inventory-mobile',", new_card + "  {\n    id: 'inventory-mobile',")
    
    # We add the Test Locally button for it
    test_btn = """              {onNavigate && app.id === 'central-reports' && (
                <button
                  onClick={() => onNavigate('central_reports')}
                  className="mt-3 w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-bold flex items-center justify-center hover:bg-indigo-700 transition-colors"
                >
                  <AppWindow className="w-4 h-4 mr-2" />
                  Open Reporting Engine
                </button>
              )}"""
              
    content = content.replace("              {onNavigate && app.id === 'salesman-pwa' && (", test_btn + "\n              {onNavigate && app.id === 'salesman-pwa' && (")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added central-reports to AppHub")
else:
    print("Already in AppHub")
