{activeSubTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* User Enrollment Form */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm self-start">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Enroll Route Salesman</h3>
              <p className="text-xs text-slate-400 mb-4">Register a field salesperson and map their target route zone.</p>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Salesperson Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@sales.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Login Password</label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Territory Beat</label>
                  <select
                    value={newUserTerritory}
                    onChange={(e) => setNewUserTerritory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {territoryOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-green-50/50 border border-green-100/30 rounded-xl">
                  <input
                    type="checkbox"
                    id="allowPriceOverrideCheckbox"
                    checked={newUserAllowPriceOverride}
                    onChange={(e) => setNewUserAllowPriceOverride(e.checked ?? e.target.checked)}
                    className="w-4 h-4 rounded text-green-700 focus:ring-green-600 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="allowPriceOverrideCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    Grant Custom Pricing Permission
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Enroll Sales Representative
                </button>
              </form>
            </div>

            {/* Salespeople List */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Field Sales Representatives beat Registry</h3>
              <p className="text-xs text-slate-400 mb-4 font-normal">Manage field personnel accounts and alter territory routes.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-slate-500 text-xs border border-slate-200">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-left uppercase text-sm tracking-wider">
                      <th className="pb-3 px-4 border border-slate-200">Salesperson</th>
                      <th className="pb-3 px-4 border border-slate-200">Workspace Email</th>
                      <th className="pb-3 px-4 border border-slate-200">Assigned Beat Map</th>
                      <th className="pb-3 px-4 font-semibold border border-slate-200">Custom Pricing Override Permission</th>
                      <th className="pb-3 px-4 text-right border border-slate-200">Settings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === 'SALESPERSON').map(u => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 border border-slate-200">
                          <span className="font-bold text-slate-800 text-sm leading-tight block">{u.name}</span>
                          <span className="text-xs text-slate-400">ID: {u.id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono border border-slate-200">{u.email}</td>
                        <td className="py-3.5 px-4 border border-slate-200">
                          {editingUser?.id === u.id ? (
                            <select
                              value={editingUser.territory}
                              onChange={(e) => setEditingUser({ ...editingUser, territory: e.target.value })}
                              className="p-1 px-2 border rounded text-xs bg-white text-slate-700 focus:outline-none"
                            >
                              {territoryOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          ) : (
                            <span className="px-2.5 py-1 bg-green-50 border border-green-100 text-green-800 text-xs font-bold rounded-lg uppercase">
                              {u.territory || 'Unassigned'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 border border-slate-200">
                          {editingUser?.id === u.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`editPriceOverrideCheckbox-${u.id}`}
                                checked={editingUser.allowPriceOverride || false}
                                onChange={(e) => setEditingUser({ ...editingUser, allowPriceOverride: e.checked ?? e.target.checked })}
                                className="w-4 h-4 rounded text-green-700 border-slate-300 cursor-pointer"
                              />
                              <label htmlFor={`editPriceOverrideCheckbox-${u.id}`} className="text-xs font-semibold text-slate-650 cursor-pointer select-none">
                                Allow Override
                              </label>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onEditUser({ ...u, allowPriceOverride: !u.allowPriceOverride });
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                u.allowPriceOverride 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                              title="Toggles whether salesman can override original prices of itemized stock product details"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${u.allowPriceOverride ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {u.allowPriceOverride ? 'Authorized to Edit Prices' : 'Standard Pricing Only'}
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap border border-slate-200">
                          {editingUser?.id === u.id ? (
                            <>
                              <button
                                onClick={() => {
                                  onEditUser(editingUser);
                                  setEditingUser(null);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                              >
                                Save Beat
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 text-slate-400 hover:text-green-650 rounded-xl hover:bg-slate-50 cursor-pointer"
                                title="Change Territory Beat"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to permanently disable this salesperson account beat?')) {
                                    onDeleteUser(u.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                                title="Delete Representative"
                              >
                                <Trash2 className="w-4 h-4" />
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