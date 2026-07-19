import os

# 1. Update SalesmanAdmin.tsx
sa_file = "frontend/src/pages/SalesmanAdmin.tsx"
with open(sa_file, "r", encoding="utf-8") as f:
    content = f.read()

# Add the Customer Ledger Modal
customer_modal = """
        {/* CUSTOMER PAYMENT MODAL */}
        {paymentModalCustomer && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Ledger Collection</h2>
                  <p className="text-sm text-slate-500 font-medium">Customer: {paymentModalCustomer.name}</p>
                </div>
                <button onClick={() => setPaymentModalCustomer(null)} className="p-2 bg-white hover:bg-slate-100 text-slate-400 rounded-full transition-colors border border-slate-200 shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Amount Collected ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentModalAmount}
                    onChange={(e) => setPaymentModalAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-white">
                <button
                  onClick={() => {
                    const amt = parseFloat(paymentModalAmount);
                    if (isNaN(amt) || amt <= 0) {
                      alert('Invalid payment amount entered.');
                      return;
                    }
                    onCollectCustomerPayment(paymentModalCustomer, amt, paymentModalMethod, "Manual ledger collection by Supervisor");
                    setPaymentModalCustomer(null);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex justify-center items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Check className="w-5 h-5" /> Confirm Payment Receipt
                </button>
              </div>
            </div>
          </div>
        )}
"""

if "paymentModalCustomer && (" not in content:
    content = content.replace('{/* CUSTOM INVOICE GENERATOR MODAL */}', customer_modal + '\n        {/* CUSTOM INVOICE GENERATOR MODAL */}')

# Ensure onCollectCustomerPayment correctly updates customer balance directly since it's admin
content = content.replace("""
  const onCollectCustomerPayment = async (customer: Customer, amount: number, method: string, note: string) => {
    const newPaymentRef = push(ref(database, 'sales_payments'));
    const paymentRecord = {
      id: newPaymentRef.key as string,
      customerId: customer.id,
      customerName: customer.name,
      date: new Date().toISOString(),
      amountPaid: amount,
      description: note,
      collectedBy: currentUser?.email || 'Admin',
      status: 'Confirmed'
    };
    await set(newPaymentRef, paymentRecord);
  };
""", """
  const onCollectCustomerPayment = async (customer: Customer, amount: number, method: string, note: string) => {
    const newPaymentRef = push(ref(database, 'sales_payments'));
    const paymentRecord = {
      id: newPaymentRef.key as string,
      customerId: customer.id,
      customerName: customer.name,
      date: new Date().toISOString(),
      amountPaid: amount,
      description: note,
      collectedBy: currentUser?.email || 'Admin',
      status: 'Confirmed'
    };
    await set(newPaymentRef, paymentRecord);
    const newBalance = Number(customer.remainingBalance || 0) - Number(amount);
    await set(ref(database, `customers/${customer.id}/remainingBalance`), newBalance);
  };
""")

# Fix Pending Collections Table to look for both "Pending" and "Pending Verification" just in case.
content = content.replace("payments.filter(p => p.status === 'Pending Verification')", "payments.filter(p => p.status === 'Pending Verification' || p.status === 'Pending')")

with open(sa_file, "w", encoding="utf-8") as f:
    f.write(content)

print("SalesmanAdmin updated.")
