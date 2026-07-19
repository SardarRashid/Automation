import os
import re

def update_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

# Update AdminConsole.tsx (Inventory Staff/Rooms)
admin_console_path = 'frontend/src/inventory/components/AdminConsole.tsx'
with open(admin_console_path, 'r', encoding='utf-8') as f:
    admin_content = f.read()

if 'exportToCSV' not in admin_content:
    # Add import
    admin_content = admin_content.replace(
        'import type { Storekeeper, StoreRoom } from "../types";',
        'import type { Storekeeper, StoreRoom } from "../types";\nimport { exportToCSV, parseCSV } from "../../utils/csv";'
    )
    # Add UploadIcon
    admin_content = admin_content.replace(
        'Warehouse, Layers, AlertCircle',
        'Warehouse, Layers, AlertCircle, UploadCloud, Download'
    )
    
    # Add CSV handlers to AdminConsole
    handlers = """
  const handleExportStaff = () => {
    const headers = ['name', 'email', 'pin', 'role', 'assignedSection', 'assignedStoreNum'];
    exportToCSV('inventory_staff', localStorekeepers, headers);
  };

  const handleImportStaff = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const data = await parseCSV(e.target.files[0]);
      for (const row of data) {
        if (!row.name && !row.email) continue; // Skip empty rows
        const newSk: Storekeeper = {
          id: 'sk_' + Date.now() + Math.random().toString(36).substr(2, 9),
          name: row.name || '',
          email: row.email || '',
          pin: row.pin || '1234',
          role: row.role || 'storekeeper',
          assignedStoreRooms: [],
          assignedSection: row.assignedSection || 'All',
          assignedStoreNum: row.assignedStoreNum || 'All',
          assignedLocation: 'All'
        };
        await saveStorekeeper(newSk);
      }
      alert('Staff imported successfully!');
      refreshData();
    } catch (err) {
      alert('Failed to import CSV');
      console.error(err);
    }
  };
"""
    # Insert handlers before "return ("
    admin_content = re.sub(r'(  return \()', handlers + r'\1', admin_content)

    # Insert buttons in the UI
    buttons_html = """
            <div className="flex gap-2">
              <button onClick={handleExportStaff} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <label className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 transition-colors cursor-pointer">
                <UploadCloud className="w-4 h-4" /> Import
                <input type="file" accept=".csv" className="hidden" onChange={handleImportStaff} />
              </label>
            </div>
    """
    admin_content = admin_content.replace(
        '<h2 className="text-xl font-black text-slate-800 flex items-center gap-2">',
        '<div className="flex justify-between items-center w-full"><h2 className="text-xl font-black text-slate-800 flex items-center gap-2">'
    )
    admin_content = admin_content.replace(
        'Manage Storekeepers\n              </h2>',
        'Manage Storekeepers\n              </h2>' + buttons_html + '</div>'
    )

    with open(admin_console_path, 'w', encoding='utf-8') as f:
        f.write(admin_content)
    print("Updated AdminConsole.tsx with CSV handlers")

# Update CategoryConsole.tsx (Inventory items/categories)
category_path = 'frontend/src/inventory/components/CategoryConsole.tsx'
with open(category_path, 'r', encoding='utf-8') as f:
    cat_content = f.read()

if 'exportToCSV' not in cat_content:
    cat_content = cat_content.replace(
        'import type { CategoryTemplate } from "../types";',
        'import type { CategoryTemplate } from "../types";\nimport { exportToCSV, parseCSV } from "../../utils/csv";\nimport { UploadCloud, Download } from "lucide-react";'
    )
    # Add Handlers
    cat_handlers = """
  const handleExportItems = () => {
    const headers = ['category', 'name', 'type', 'defaultPrice', 'unit'];
    exportToCSV('inventory_items', categories, headers);
  };

  const handleImportItems = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const data = await parseCSV(e.target.files[0]);
      for (const row of data) {
        if (!row.name && !row.category) continue;
        const newItem: CategoryTemplate = {
          id: 'cat_' + Date.now() + Math.random().toString(36).substr(2, 9),
          category: row.category || 'General',
          name: row.name || 'Unknown',
          type: (row.type as 'fruit' | 'vegetable' | 'packaging') || 'fruit',
          sizes: ['Standard'],
          defaultPrice: Number(row.defaultPrice) || 0,
          unit: row.unit || 'Kg'
        };
        await saveCategory(newItem);
      }
      alert('Items imported successfully!');
      refreshData();
    } catch (err) {
      alert('Failed to import CSV');
      console.error(err);
    }
  };
"""
    cat_content = re.sub(r'(  return \()', cat_handlers + r'\1', cat_content)
    
    cat_buttons = """
            <div className="flex gap-2">
              <button onClick={handleExportItems} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <label className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 transition-colors cursor-pointer">
                <UploadCloud className="w-4 h-4" /> Import
                <input type="file" accept=".csv" className="hidden" onChange={handleImportItems} />
              </label>
            </div>
    """
    cat_content = cat_content.replace(
        '<h2 className="text-xl font-black text-slate-800 flex items-center gap-2">',
        '<div className="flex justify-between items-center w-full"><h2 className="text-xl font-black text-slate-800 flex items-center gap-2">'
    )
    cat_content = cat_content.replace(
        'Product Database\n              </h2>',
        'Product Database\n              </h2>' + cat_buttons + '</div>'
    )
    with open(category_path, 'w', encoding='utf-8') as f:
        f.write(cat_content)
    print("Updated CategoryConsole.tsx with CSV handlers")
