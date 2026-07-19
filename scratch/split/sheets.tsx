{activeSubTab === 'sheets' && (
          <div className="space-y-6">
            {/* Sync panel integration widget */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Google Sheets API Live Integration Pipeline</span>
                </div>
                <p className="text-slate-500 text-xs">
                  Synchronize Products, Customer registries, and Daily Sales Order matrices into designated Google Sheets.
                </p>
                {spreadsheetId ? (
                  <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-sm truncate mt-2">
                    <span className="text-slate-400 select-none">Sheets Key:</span>
                    <span className="text-slate-600 select-all truncate">{spreadsheetId}</span>
                  </div>
                ) : (
                  <span className="inline-block text-sm font-bold text-rose-500 mt-1">
                    ⚠️ Missing active Spreadsheet ID. Input configuration below!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Spreadsheet connector form */}
                <form onSubmit={applySpreadsheetLink} className="flex gap-1.5 items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    required
                    placeholder="Google Spreadsheet ID..."
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    className="px-3 py-1.5 bg-white text-xs rounded-lg w-44 focus:outline-none focus:ring-1 focus:ring-green-700 border border-slate-250 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-green-800 whitespace-nowrap"
                  >
                    Set ID
                  </button>
                </form>

                <button
                  onClick={onManualSync}
                  disabled={isSyncing || !isOnline}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-650/40 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : `Push Sync (${syncPendingCount})`}</span>
                </button>
              </div>
            </div>

            {/* Webhook Push Integration Widget */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm mt-6">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-1">
                <Globe className="w-5 h-5 text-indigo-600" />
                <span>Daily Orders Webhook Push (Zapier/Make/OneDrive)</span>
              </div>
              <p className="text-slate-500 text-xs mb-4">
                Configure a Webhook URL to push daily orders to external services like Microsoft Excel on OneDrive via automation platforms (e.g., Make.com or Zapier).
              </p>
              
              <form onSubmit={saveWebhookUrl} className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hook.make.com/..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm"
                  required
                />
                <button type="submit" className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors">
                  Save Webhook
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500">Push all orders created today ({new Date().toLocaleDateString()})</p>
                <button
                  onClick={handlePushDailyOrders}
                  disabled={pushingOrders}
                  className={`px-6 py-2 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${pushingOrders ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'}`}
                >
                  {pushingOrders ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Push Daily Orders
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center mt-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 mb-2">Native Data Export Hub</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Export your sales orders, customer lists, and product matrix directly to Excel or CSV for offline analysis.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <button
                  onClick={() => exportDailySalesToExcel(new Date().toISOString().split('T')[0], orders.filter(o => o.status === 'Approved' || o.status === 'Delivered'))}
                  className="p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-emerald-600" />
                  <span className="font-semibold text-slate-700 group-hover:text-emerald-700">Export Daily Sales</span>
                  <span className="text-xs text-slate-500">{orders.length} Records</span>
                </button>
                
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "Customer ID,Name,Phone,Address,Balance\n"
                      + customers.map(c => `${c.id},"${c.name}","${c.phone || ''}","${c.address || ''}",${c.remainingBalance || 0}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `customers_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                  }}
                  className="p-6 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <Users className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
                  <span className="font-semibold text-slate-700 group-hover:text-blue-700">Export Customer List</span>
                  <span className="text-xs text-slate-500">{customers.length} Records</span>
                </button>
                
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "Product ID,Name,Category,Original Price\n"
                      + products.map(p => `${p.id},"${p.name}","${p.category || ''}",${p.originalPrice}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `products_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                  }}
                  className="p-6 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-xl transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <Package className="w-8 h-8 text-slate-400 group-hover:text-purple-600" />
                  <span className="font-semibold text-slate-700 group-hover:text-purple-700">Export Product Matrix</span>
                  <span className="text-xs text-slate-500">{products.length} Records</span>
                </button>
              </div>
            </div>
          </div>
        )}