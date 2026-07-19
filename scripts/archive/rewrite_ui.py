import re

with open('d:/AntiGravity/inventory-web-workspace/frontend/src/pages/AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the buttons to Centralized Access Hub
old_buttons = """        <button onClick={() => setActiveTab('app')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'app' ? 'bg-green-700 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
          <Smartphone className="w-4 h-4" /> App Admin
        </button>
        <button onClick={() => setActiveTab('salesman')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'salesman' ? 'bg-green-700 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
          <Users className="w-4 h-4" /> Salesman App
        </button>
        <button onClick={() => setActiveTab('scanner')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'scanner' ? 'bg-green-700 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
          <ScanLine className="w-4 h-4" /> Scanner App
        </button>
        <button onClick={() => setActiveTab('extension')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'extension' ? 'bg-green-700 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
          <Layout className="w-4 h-4" /> Chrome Extension
        </button>
        <button onClick={() => setActiveTab('inventory_taking')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'inventory_taking' ? 'bg-green-700 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
          <Layout className="w-4 h-4" /> Inventory Taking App
        </button>"""

new_buttons = """        <button onClick={() => setActiveTab('access_control')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'access_control' ? 'bg-green-700 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
          <Users className="w-4 h-4" /> Centralized Access Hub
        </button>"""

if old_buttons in content:
    content = content.replace(old_buttons, new_buttons)

# 2. Update condition
content = content.replace(
    "{['app', 'salesman', 'scanner', 'extension'].includes(activeTab) && (",
    "{activeTab === 'access_control' && ("
)

# 3. Update the dropdown for new user to just standard roles (not fragmenting UI)
# Actually, the User Type dropdown is fine as is, because it's a template for new users.

# 4. We need to update the User list rendering. 
# We need to replace the filteredUsers logic to show ALL users.
content = content.replace(
    """                  if (activeTab === 'app' || activeTab === 'inventory_taking' || activeTab === 'salesman' || activeTab === 'scanner' || activeTab === 'extension') {
                    if (activeTab === 'salesman') return u.role === 'salesman' || u.role === 'SALESPERSON' || u.allowedApps?.salesman || u.role === 'pending';
                    return u.role === activeTab || u.allowedApps?.[activeTab as keyof typeof u.allowedApps] || u.role === 'pending';
                  }""",
    """                  if (activeTab === 'access_control') {
                    return true;
                  }"""
)

# Replace the inner map filteredUsers.filter...
content = content.replace(
    """                          if (activeTab === 'app' || activeTab === 'inventory_taking' || activeTab === 'salesman' || activeTab === 'scanner' || activeTab === 'extension') {
                            if (activeTab === 'salesman') return u.role === 'salesman' || u.role === 'SALESPERSON' || u.allowedApps?.salesman || u.role === 'pending';
                            return u.role === activeTab || u.allowedApps?.[activeTab as keyof typeof u.allowedApps] || u.role === 'pending';
                          }""",
    """                          if (activeTab === 'access_control') {
                            return true;
                          }"""
)


# Replace the table headers
old_thead = """                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">User</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Status / Role</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Actions</th>
                      </tr>
                    </thead>"""

new_thead = """                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-1/4">User & Role</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-1/2">App Access (Toggles)</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-1/4">Actions</th>
                      </tr>
                    </thead>"""
content = content.replace(old_thead, new_thead)


# Replace the table body row structure
old_tbody_start = """                        return (
                          <tr key={key} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${hasChanges ? 'bg-amber-50/30' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                  <UserCheck className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate">{displayData.email}</div>
                                  <div className="text-xs text-slate-500 mt-0.5 truncate">{key}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-700 capitalize w-20">
                                      {displayData.role === 'pending' ? 'Pending' : 'Active'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={displayData.role !== 'pending'}
                                        onChange={(e) => {
                                          const nextApps = { ...apps, [activeTab]: e.target.checked };
                                          const newData = { ...displayData, allowedApps: nextApps };
                                          
                                          // Update role based on toggle
                                          if (e.target.checked) {
                                            newData.role = activeTab === 'salesman' ? 'SALESPERSON' : activeTab;
                                          } else {
                                            // If untoggling the current active tab app, check if they have others
                                            const hasOtherApps = Object.entries(nextApps).some(([k, v]) => k !== activeTab && v);
                                            if (!hasOtherApps) newData.role = 'pending';
                                          }
                                          handleLocalChange(key, newData);
                                        }}
                                      />
                                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                  </div>
                                </div>
                                
                                {displayData.role !== 'pending' && (
                                  <div className="bg-slate-50 rounded p-3 border border-slate-200 w-full max-w-sm mt-2">
                                    {activeTab === 'app' && (
                                      <div className="flex flex-col gap-2">
                                        <span className="font-bold text-slate-600 text-xs uppercase tracking-wider mb-1">Web App Permissions:</span>
                                        <div className="grid grid-cols-2 gap-2">
                                          {['reports', 'invoices', 'request_forms', 'reminders', 'notes', 'profile', 'inventory_app'].map((perm) => (
                                            <label key={perm} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-green-700 text-xs">
                                              <input 
                                                type="checkbox" 
                                                checked={!!displayData.permissions?.[perm as keyof typeof displayData.permissions]}
                                                onChange={(e) => {
                                                  const newPerms = { ...(displayData.permissions || {}), [perm]: e.target.checked };
                                                  handleLocalChange(key, { ...displayData, permissions: newPerms });
                                                }}
                                                className="rounded border-slate-300 text-green-600 focus:ring-green-600"
                                              />
                                              <span className="capitalize">{perm.replace('_', ' ')}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {activeTab === 'salesman' && (
                                      <div className="flex flex-col gap-2">
                                        <span className="font-bold text-slate-600 text-xs uppercase tracking-wider mb-1">Salesman Permissions:</span>
                                        <div className="grid grid-cols-2 gap-2">
                                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-green-700 text-xs">
                                            <input 
                                              type="checkbox" 
                                              checked={!!displayData.permissions?.custom_pricing}
                                              onChange={(e) => {
                                                const newPerms = { ...(displayData.permissions || {}), custom_pricing: e.target.checked };
                                                handleLocalChange(key, { ...displayData, permissions: newPerms });
                                              }}
                                              className="rounded border-slate-300 text-green-600 focus:ring-green-600"
                                            />
                                            <span>Custom Pricing</span>
                                          </label>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">"""

new_tbody_start = """                        return (
                          <tr key={key} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${hasChanges ? 'bg-amber-50/30' : ''}`}>
                            <td className="px-6 py-4 align-top">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                  <UserCheck className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate">{displayData.email}</div>
                                  <div className="text-xs text-slate-500 mt-0.5 truncate">{key}</div>
                                </div>
                              </div>
                              <div className="mt-2 text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded inline-block uppercase">
                                Role: {displayData.role === 'pending' ? 'Pending' : displayData.role}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {['app', 'salesman', 'scanner', 'extension', 'desktop', 'inventory_taking', 'scanner_admin', 'loginext'].map((appKey) => {
                                  const isChecked = !!apps[appKey as keyof typeof apps];
                                  const titles: Record<string, string> = {
                                    app: 'Web Admin',
                                    salesman: 'Salesman App',
                                    scanner: 'Scanner App',
                                    extension: 'Sticker Ext.',
                                    desktop: 'Desktop App',
                                    inventory_taking: 'Inventory App',
                                    scanner_admin: 'Scan Admin',
                                    loginext: 'LogiNext Scraper'
                                  };
                                  return (
                                    <label key={appKey} className="flex flex-col items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white shadow-sm cursor-pointer hover:border-green-400 transition-colors">
                                      <span className="text-xs font-medium text-slate-700 text-center">{titles[appKey]}</span>
                                      <div className="relative inline-flex items-center">
                                        <input 
                                          type="checkbox" 
                                          className="sr-only peer" 
                                          checked={isChecked}
                                          onChange={(e) => {
                                            const nextApps = { ...apps, [appKey]: e.target.checked };
                                            let newRole = displayData.role;
                                            if (e.target.checked && newRole === 'pending') {
                                                newRole = appKey === 'salesman' ? 'SALESPERSON' : appKey;
                                            } else if (!e.target.checked && Object.values(nextApps).every(v => !v)) {
                                                newRole = 'pending';
                                            }
                                            handleLocalChange(key, { ...displayData, role: newRole, allowedApps: nextApps });
                                          }}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right align-top">"""
                            
content = content.replace(old_tbody_start, new_tbody_start)

# We also need to remove the inline approval button since they just toggle
old_inline_approve = """                              {displayData.role === 'pending' && (
                                <button
                                  onClick={() => {
                                    handleLocalChange(key, { 
                                      ...displayData, 
                                      role: activeTab === 'salesman' ? 'SALESPERSON' : activeTab,
                                      allowedApps: { [activeTab]: true },
                                      permissions: activeTab === 'app' ? { reports: true, invoices: true, request_forms: true, reminders: true, notes: true, profile: true } : {}
                                    });
                                  }}
                                  className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors mr-2"
                                  title={`Approve for ${activeTab}`}
                                >
                                  <UserCheck className="w-5 h-5" />
                                </button>
                              )}"""
content = content.replace(old_inline_approve, "")

with open('d:/AntiGravity/inventory-web-workspace/frontend/src/pages/AdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
