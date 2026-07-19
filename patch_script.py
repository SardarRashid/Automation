import re

path = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\pages\SalesmanAdmin_V1.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
if 'import ExportCenter' not in content:
    content = content.replace(
        "import { SpreadsheetGrid, ColumnDef } from '../components/ui/SpreadsheetGrid';",
        "import { SpreadsheetGrid, ColumnDef } from '../components/ui/SpreadsheetGrid';\nimport ExportCenter from '../components/exports/ExportCenter';"
    )

# 2. State definition
old_state = "const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'users' | 'inventory' | 'customers' | 'orders' | 'finance' | 'sheets' | 'firebase'>('dashboard');"
new_state = "const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'users' | 'inventory' | 'customers' | 'orders' | 'finance' | 'sheets' | 'firebase' | 'exportCenter' | 'customerLedger' | 'orderHistory'>('dashboard');"
content = content.replace(old_state, new_state)

# 3. Sidebar buttons in Overview tab
if "setActiveSubTab('customerLedger')" not in content:
    dashboard_button = """                <button
                  onClick={() => setActiveSubTab('dashboard')}
                  className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                    activeSubTab === 'dashboard' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <BarChart2 className="w-4.5 h-4.5" /> Dashboard
                </button>"""
    
    content = content.replace(dashboard_button, dashboard_button + """
                <button
                  onClick={() => setActiveSubTab('customerLedger')}
                  className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                    activeSubTab === 'customerLedger' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="w-4.5 h-4.5" /> Customer Ledger
                </button>
                <button
                  onClick={() => setActiveSubTab('orderHistory')}
                  className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                    activeSubTab === 'orderHistory' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <TrendingUp className="w-4.5 h-4.5" /> Order History
                </button>
                <button
                  onClick={() => setActiveSubTab('exportCenter')}
                  className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                    activeSubTab === 'exportCenter' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Download className="w-4.5 h-4.5 text-amber-500" /> Export Center
                </button>""")

# 4. Render blocks at the end
render_blocks = """
          {/* CUSTOMER LEDGER */}
          {activeSubTab === 'customerLedger' && (
            <div className="h-[600px] bg-white rounded-2xl p-4 shadow-sm">
              <SpreadsheetGrid 
                title="Customer Ledger" 
                data={processedCustomerData} 
                columns={customerColumns} 
                rowKey={r=>r.id} 
                searchable={true} 
                searchKeys={['name','shopName']} 
              />
            </div>
          )}

          {/* ORDER HISTORY */}
          {activeSubTab === 'orderHistory' && (
            <div className="h-[600px] bg-white rounded-2xl p-4 shadow-sm">
              <SpreadsheetGrid 
                title="Order History" 
                data={orders} 
                columns={orderColumns} 
                rowKey={r=>r.id} 
                onRowDoubleClick={setSelectedOrder} 
                searchable={true} 
                searchKeys={['orderNumber','customerName','salespersonName','status']} 
              />
            </div>
          )}

          {/* EXPORT CENTER */}
          {activeSubTab === 'exportCenter' && (
            <ExportCenter />
          )}
"""

if "activeSubTab === 'exportCenter'" not in content:
    idx = content.rfind('        </main>')
    content = content[:idx] + render_blocks + '\n        </main>'

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
