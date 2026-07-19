{activeSubTab === 'customers' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* New Customer registry */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm self-start">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Add Retail Client Profile</h3>
              <p className="text-xs text-slate-400 mb-4">Enroll retail profiles with initial balances mapped to route territories.</p>

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sardar Rashid"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Shop / Outlet Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rashid General Store"
                    value={newCustShop}
                    onChange={(e) => setNewCustShop(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl mt-1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +92-300-1234567"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Outlet Address</label>
                  <textarea
                    rows={2}
                    placeholder="Sector / Area description..."
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 font-sans">Initial Outstanding Debt (SAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newCustBalance}
                    onChange={(e) => setNewCustBalance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Enroll Retail Client
                </button>
              </form>
            </div>

            {/* Customers Master Ledger Table */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Customers Accounts Master Ledger Beat Registry</h3>
              <p className="text-xs text-slate-400 mb-4 font-normal">Check contact info, outstanding dues, and trace payments.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-slate-500 text-xs border border-slate-200">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-left uppercase text-sm tracking-wider">
                      <th className="pb-3 px-4 border border-slate-200">Shop details</th>
                      <th className="pb-3 px-4 border border-slate-200">Contact</th>
                      <th className="pb-3 px-4 text-right border border-slate-200">Debit Balance</th>
                      <th className="pb-3 px-4 text-right border border-slate-200">Settings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(cust => (
                      <tr key={cust.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-sans text-xs border border-slate-200">
                          {editingCustomer?.id === cust.id ? (
                            <input
                              type="text"
                              className="font-bold text-slate-800 border p-1"
                              value={editingCustomer.shopName}
                              onChange={(e) => setEditingCustomer({ ...editingCustomer, shopName: e.target.value })}
                            />
                          ) : (
                            <span className="font-bold text-slate-800 text-sm block leading-tight">{cust.shopName}</span>
                          )}
                          <span className="text-xs text-green-700 font-medium font-sans">Prop: {cust.name}</span>
                          <span className="text-xs text-slate-400 block max-w-xs truncate">{cust.address}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono border border-slate-200">{cust.phone}</td>
                        <td className="py-3.5 px-4 text-right border border-slate-200">
                          {editingCustomer?.id === cust.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="w-16 text-right border font-mono"
                              value={editingCustomer.remainingBalance}
                              onChange={(e) => setEditingCustomer({ ...editingCustomer, remainingBalance: parseFloat(e.target.value) || 0 })}
                            />
                          ) : (
                            <span className={`font-mono font-bold text-xs ${(cust.remainingBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {(cust.remainingBalance || 0).toFixed(2)} SAR
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap border border-slate-200">
                          {editingCustomer?.id === cust.id ? (
                            <>
                              <button
                                onClick={() => {
                                  onEditCustomer(editingCustomer);
                                  setEditingCustomer(null);
                                }}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCustomer(null)}
                                className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs"
                              >
                                X
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingCustomer(cust)}
                                className="p-1.5 text-slate-400 hover:text-green-650 rounded-xl hover:bg-slate-50 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete this customer? It will wipe off active route ledgers.')) {
                                    onDeleteCustomer(cust.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}