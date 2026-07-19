import os
import re

sales_admin_path = 'frontend/src/pages/SalesmanAdmin.tsx'
with open(sales_admin_path, 'r', encoding='utf-8') as f:
    sales_content = f.read()

# Add imports for CSV if missing
if 'exportToCSV' not in sales_content:
    sales_content = sales_content.replace(
        "import { Customer, OrderItem, PaymentHistoryItem } from '../types';",
        "import { Customer, OrderItem, PaymentHistoryItem } from '../types';\nimport { exportToCSV, parseCSV } from '../utils/csv';"
    )

# Add Handlers
handlers = """
  const handleExportCustomers = () => {
    const headers = ['id', 'name', 'phone', 'address', 'totalDebt', 'remainingBalance', 'creditLimit'];
    exportToCSV('sales_customers', customers, headers);
  };

  const handleImportCustomers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const data = await parseCSV(e.target.files[0]);
      for (const row of data) {
        if (!row.name && !row.phone) continue;
        const newRef = push(ref(database, 'sales_customers'));
        const custData = {
          id: row.id || newRef.key as string,
          name: row.name || 'Unknown',
          phone: row.phone || '',
          address: row.address || '',
          totalDebt: Number(row.totalDebt) || 0,
          remainingBalance: Number(row.remainingBalance) || 0,
          creditLimit: Number(row.creditLimit) || 0
        };
        // Use set to overwrite if id exists, or create new
        await set(ref(database, `sales_customers/${custData.id}`), custData);
      }
      alert('Customers imported successfully!');
    } catch (err) {
      alert('Failed to import CSV');
      console.error(err);
    }
  };

  const handleExportOrders = () => {
    const headers = ['id', 'customerId', 'date', 'time', 'totalAmount', 'status', 'paymentStatus', 'amountPaid'];
    exportToCSV('sales_orders', orders, headers);
  };
"""

# Insert handlers before the first return in SalesmanAdmin
# Usually there is a large return (
sales_content = re.sub(r'(  return \()', handlers + r'\1', sales_content, count=1)

# Now we need to find where to put the buttons.
# There is a tab switch `activeTab === 'customers'` and `activeTab === 'orders'`.
# I will use replace to add the buttons in the Header area of each tab.

customers_btn = """
              <div className="flex gap-2">
                <button onClick={handleExportCustomers} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                  <Download className="w-4 h-4" /> Export
                </button>
                <label className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                  <UploadCloud className="w-4 h-4" /> Import
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportCustomers} />
                </label>
              </div>
"""

orders_btn = """
              <div className="flex gap-2">
                <button onClick={handleExportOrders} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                  <Download className="w-4 h-4" /> Export Orders
                </button>
              </div>
"""

# Find "Manage Customers" header
sales_content = sales_content.replace(
    '<h3 className="text-xl font-black text-slate-800 flex items-center gap-2">',
    '<div className="flex justify-between items-center w-full"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2">'
)
sales_content = sales_content.replace(
    'Manage Customers\n                    </h3>',
    'Manage Customers\n                    </h3>' + customers_btn + '</div>'
)

# Find "All Orders" header
# Note: In SalesmanAdmin, it might be "All Orders"
sales_content = sales_content.replace(
    'All Orders\n                    </h3>',
    'All Orders\n                    </h3>' + orders_btn + '</div>'
)

with open(sales_admin_path, 'w', encoding='utf-8') as f:
    f.write(sales_content)
print("Updated SalesmanAdmin.tsx")
