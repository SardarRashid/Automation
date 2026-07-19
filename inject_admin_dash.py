import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AdminPanel.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace("import { AuditLogViewer } from '../components/AuditLogViewer';", "import { AuditLogViewer } from '../components/AuditLogViewer';\nimport { AdminDashboard } from '../components/dashboards/AdminDashboard';")

# Replace renderDashboard logic
# Current renderDashboard function
old_render = '''  const renderDashboard = () => (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">'''

new_render = '''  const renderDashboard = () => (
    <AdminDashboard onAction={(action) => {
      if (action === 'users') setActiveView('users');
      if (action === 'settings') setActiveView('settings');
      if (action === 'broadcast') alert('Broadcast feature coming soon');
    }} />
  );
  
  // This removes the rest of the old renderDashboard. I need to be careful with regex.
'''

# Using regex to replace the whole renderDashboard function
match = re.search(r'const renderDashboard = \(\) => \{(.*?)\};\n', content, re.DOTALL)
if match:
    pass # Wait, it is defined as const renderDashboard = () => ( ... );

# Let's use a simpler regex
content = re.sub(r'const renderDashboard = \(\) => \(.*?\);\n\n  const renderUsers', "const renderDashboard = () => (\n    <AdminDashboard onAction={(a) => { if(a==='users') setActiveView('users'); if(a==='settings') setActiveView('settings'); }} />\n  );\n\n  const renderUsers", content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
