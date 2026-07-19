{activeSubTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Daily Report PDF Archival Center Section */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fade-in">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-green-700 rounded-lg text-green-100">
                      <Printer className="w-5 h-5" />
                    </span>
                    <h4 className="font-bold text-sm tracking-tight">Daily Summary PDF Archival Center</h4>
                  </div>
                  <p className="text-slate-300 text-xs leading-normal">
                    Select any target date to compile and export a high-fidelity, polished, standard-ready A4 daily sales report PDF. Ideal for printing, archival, or workspace audits.
                  </p>
                  <button 
                    onClick={onClearOrders}
                    className="mt-2 px-3 py-1 bg-red-900/60 hover:bg-red-700 text-red-200 hover:text-white rounded-lg border border-red-500/30 text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Clear All Order History
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Target Sales Date
                    </label>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-green-600 border border-slate-700 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Orders Found
                    </label>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-bold border ${
                      orders.filter(o => o.date === reportDate).length > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {orders.filter(o => o.date === reportDate).length} Orders
                    </span>
                  </div>

                  <button
                    onClick={() => exportDailySalesToExcel(reportDate, orders)}
                    className="mt-1 md:mt-4 px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export to Excel Summary</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Live Sales Orders Transactions Stream</h3>
                  <p className="text-xs text-slate-400 font-normal">Review sales performance, check synchronization metadata, and approve/cancel order statuses.</p>
                </div>

                {/* Batch Action Control */}
                <button
                  type="button"
                  onClick={() => {
                    // @ts-ignore
                    const pendingList = orders.filter(o => o.status === 'Pending' && !o.isPaymentPendingApproval);
                    if (pendingList.length === 0) {
                      alert('No pending orders are waiting for Manager approval right now (or all are waiting for payment verification).');
                      return;
                    }
                    if (window.confirm(`Batch approve all ${pendingList.length} ready pending orders? This automatically updates the Google Sheets and logs in real time.`)) {
                      pendingList.forEach(p => onUpdateOrderStatus(p.id, 'Approved'));
                      alert(`Successfully batch approved ${pendingList.length} orders! Both manager sheets matrix and invoicing ledger updated.`);
                    }
                  }}
                  className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-green-100"
                >
                  <Check className="w-4 h-4 text-green-650" />
                  {/* @ts-ignore */}
                  <span>Batch Approve All ({orders.filter(o => o.status === 'Pending' && !o.isPaymentPendingApproval).length} Ready)</span>
                </button>
              </div>

              {/* Status Filters Bar */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                  {(['All', 'Pending', 'Approved', 'Delivered', 'Cancelled'] as const).map(fState => (
                    <button
                      key={fState}
                      onClick={() => setAdminOrderFilter(fState)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        adminOrderFilter === fState ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                    {fState} Orders ({fState === 'All' ? orders.filter(o => o.status !== 'Draft').length : orders.filter(o => o.status === fState).length})
                    </button>
                  ))}
                </div>

                {/* Orders Filter Controls */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Search Customer / ID</label>
                    <input 
                      type="text" 
                      placeholder="Customer name or Order ID..." 
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter Date</label>
                    <input 
                      type="date" 
                      value={orderFilterDate}
                      onChange={(e) => {
                        setOrderFilterDate(e.target.value);
                        setOrderFilterMonth('');
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter Month</label>
                    <input 
                      type="month" 
                      value={orderFilterMonth}
                      onChange={(e) => {
                        setOrderFilterMonth(e.target.value);
                        setOrderFilterDate('');
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <button 
                    onClick={() => { setOrderSearchQuery(''); setOrderFilterDate(''); setOrderFilterMonth(''); setAdminOrderFilter('All'); }}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
  
                <div className="overflow-x-auto">
                <table className="w-full text-slate-500 text-xs font-sans border border-slate-200">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-left uppercase text-sm tracking-wider">
                      <th className="pb-3 px-4 border border-slate-200">Order details</th>
                      <th className="pb-3 px-4 border border-slate-200">Logged customer</th>
                      <th className="pb-3 px-4 border border-slate-200">On-site representative</th>
                      <th className="pb-3 px-4 text-center border border-slate-200">Amount total</th>
                      <th className="pb-3 px-4 text-center border border-slate-200">Payment state</th>
                      <th className="pb-3 px-4 text-center border border-slate-200">Fulfill Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter(ord => ord.status !== 'Draft')
                      .filter(ord => adminOrderFilter === 'All' || ord.status === adminOrderFilter)
                      .filter(ord => {
                        if (orderSearchQuery) {
                          const q = orderSearchQuery.toLowerCase();
                          return ord.customerName.toLowerCase().includes(q) || ord.id.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .filter(ord => {
                        if (orderFilterDate) {
                          return ord.date === orderFilterDate;
                        }
                        if (orderFilterMonth) {
                          return ord.date.startsWith(orderFilterMonth);
                        }
                        return true;
                      })
                      .reverse()
                      .map(ord => (
                      <tr key={ord.id} className="border border-slate-50 rounded-xl hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-sans text-xs border border-slate-200">
                          <span className="font-bold text-slate-800 text-[13px] block">{ord.id}</span>
                          <span className="text-xs text-slate-400 font-mono block">{ord.date} • {ord.time}</span>
                          <span className={`px-2 py-0.2 rounded-lg text-sm font-bold leading-none inline-block mt-1 ${
                            ord.syncStatus === 'SYNCED' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {ord.syncStatus === 'SYNCED' ? 'Cloud Synced' : 'Offline Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 border border-slate-200">
                          <span className="font-medium text-slate-800 block text-xs">{ord.customerName}</span>
                        </td>
                        <td className="py-3.5 px-4 font-sans text-xs border border-slate-200">{ord.salespersonName}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 text-sm font-semibold border border-slate-200">
                          {ord.totalAmount.toFixed(2)} SAR
                        </td>
                        <td className="py-3.5 px-4 text-center cursor-pointer border border-slate-200" title="Click to process payment" onClick={() => {
                          const balanceDue = ord.totalAmount - (ord.amountPaid || 0);
                          setPaymentModalOrder(ord);
                          setPaymentModalAmount(String(balanceDue.toFixed(2)));
                          setPaymentModalMethod('Cash');
                        }}>
                          {/* @ts-ignore */}
                          {ord.isPaymentPendingApproval ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed" title="Pending Verification in Field Collections">
                              Verifying Payment ⏳
                            </span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase hover:opacity-80 transition-opacity ${
                              ord.paymentStatus === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : ord.paymentStatus === 'Partial' 
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {ord.paymentStatus} ✏️
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-1.5 whitespace-nowrap border border-slate-200">
                          <button
                            onClick={() => setInvoiceModalOrder(ord)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors inline-block align-middle mr-1"
                            title="Generate Invoice PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {/* @ts-ignore */}
                          <select
                            // @ts-ignore
                            disabled={ord.status === 'Delivered' || ord.isPaymentPendingApproval}
                            value={ord.status}
                            onChange={(e: any) => {
                              if (e.target.value === 'Delivered') {
                                setDeliverConfirmOrder(ord);
                              } else {
                                onUpdateOrderStatus(ord.id, e.target.value);
                              }
                            }}
                            className={`p-1 px-2 border rounded-lg text-xs font-bold focus:outline-none ${
                              // @ts-ignore
                              ord.isPaymentPendingApproval
                                ? 'bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed opacity-70'
                                : ord.status === 'Delivered' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : ord.status === 'Cancelled' 
                                    ? 'bg-red-50 text-red-700 border-red-100' 
                                    : 'bg-slate-50 text-slate-700 border-slate-150'
                            }`}
                          >
                            <option value="Pending">💡 Pending Approved</option>
                            <option value="Approved">⚙️ Approved</option>
                            <option value="Delivered">✓ Delivered</option>
                            <option value="Cancelled">✕ Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}