<div className="space-y-6">
            {/* Customer Ledger Collections Table */}
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-emerald-600" />
                Customer Ledger
              </h3>
              <p className="text-sm text-slate-500 mb-6">Manage customer balances and collect payments directly from their ledger.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold border-b rounded-tl-xl border border-slate-200">Customer ID</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Name</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Store</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Remaining Balance</th>
                      <th className="py-3 px-4 font-bold border-b text-center rounded-tr-xl border border-slate-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100">
                    {customers.filter(c => Number(c.remainingBalance || 0) > 0).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                          No outstanding balances for any customers!
                        </td>
                      </tr>
                    ) : customers.filter(c => Number(c.remainingBalance || 0) > 0).map(cust => (
                      <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 text-xs border border-slate-200">{cust.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-700 border border-slate-200">{cust.name}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600 border border-slate-200">{cust.storeName}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 border border-slate-200">{Number(cust.remainingBalance || 0).toFixed(2)} SAR</td>
                        <td className="py-3 px-4 text-center border border-slate-200">
                          <button
                            onClick={() => {
                              setPaymentModalCustomer(cust);
                              setPaymentModalAmount(String(Number(cust.remainingBalance || 0).toFixed(2)));
                              setPaymentModalMethod('Cash');
                            }}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                          >
                            Collect Payment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Field Collections Table */}
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm mt-6">
              <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-amber-600" />
                Pending Field Collections
              </h3>
              <p className="text-sm text-slate-500 mb-6">Verify and confirm payments collected by Salesmen in the field.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold border-b rounded-tl-xl border border-slate-200">Date</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Salesman</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Customer</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Amount</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Description</th>
                      <th className="py-3 px-4 font-bold border-b text-center rounded-tr-xl border border-slate-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100">
                    {payments.filter(p => p.status === 'Pending Verification' || p.status === 'Pending').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                          No pending field collections to verify.
                        </td>
                      </tr>
                    ) : payments.filter(p => p.status === 'Pending Verification' || p.status === 'Pending').map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-xs font-mono text-slate-500 border border-slate-200">{new Date(pay.date).toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-slate-700 border border-slate-200">{pay.collectedBy}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600 border border-slate-200">{pay.customerName}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 border border-slate-200">{Number(pay.amountPaid || 0).toFixed(2)} SAR</td>
                        <td className="py-3 px-4 text-xs text-slate-500 border border-slate-200">{pay.description}</td>
                        <td className="py-3 px-4 text-center border border-slate-200">
                          <button
                            onClick={() => onConfirmFieldPayment(pay)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                          >
                            Confirm Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}