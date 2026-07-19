{activeSubTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* New Product Form */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm self-start">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Add Product SKU</h3>
              <p className="text-xs text-slate-400 mb-4">Insert new items and prices to feed route salesman terminals.</p>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. P011"
                      value={newProdCode}
                      onChange={(e) => setNewProdCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 font-normal">Pack Unit</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bag, Box"
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Red Lentils 5kg"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category Group</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 font-sans">Standard Price (SAR)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      placeholder="12.50"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Stock</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="150"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Insert Active SKU
                </button>
              </form>
            </div>

            {/* Product Grid Table */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Standard Products & Prices Inventory Sheet</h3>
              <p className="text-xs text-slate-400 mb-4">Edit pricing and stock levels globally mapped to on-site catalogs.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-slate-500 text-xs border border-slate-200">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-left uppercase text-sm tracking-wider">
                      <th className="pb-3 px-4 border border-slate-200">Code</th>
                      <th className="pb-3 px-4 border border-slate-200">Product Name / Description</th>
                      <th className="pb-3 px-4 border border-slate-200">Category Group</th>
                      <th className="pb-3 px-4 text-right border border-slate-200">Standard Price</th>
                      <th className="pb-3 px-4 text-center border border-slate-200">In-Stock Qty</th>
                      <th className="pb-3 px-4 text-right border border-slate-200">Settings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(prod => (
                      <tr key={prod.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-400 border border-slate-200">{prod.code}</td>
                        <td className="py-3.5 px-4 border border-slate-200">
                          <span className="font-bold text-slate-800 text-sm block">{prod.name}</span>
                          <span className="text-xs text-slate-400">Inventory Unit: {prod.unit}</span>
                        </td>
                        <td className="py-3.5 px-4 border border-slate-200">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded uppercase">
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 border border-slate-200">
                          {editingProduct?.id === prod.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="w-16 p-1 text-right border rounded bg-white text-xs font-mono"
                              value={editingProduct.price}
                              onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                            />
                          ) : (
                            `${prod.price.toFixed(2)} SAR`
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center border border-slate-200">
                          {editingProduct?.id === prod.id ? (
                            <input
                              type="number"
                              className="w-14 p-1 text-center border rounded bg-white text-xs font-mono"
                              value={editingProduct.stock}
                              onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                            />
                          ) : (
                            <span className={prod.stock < 20 ? 'text-rose-600 font-bold font-mono' : 'font-mono'}>
                              {prod.stock} {prod.unit}s
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap border border-slate-200">
                          {editingProduct?.id === prod.id ? (
                            <>
                              <button
                                onClick={() => {
                                  onEditProduct(editingProduct);
                                  setEditingProduct(null);
                                }}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingProduct(null)}
                                className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs cursor-pointer"
                              >
                                X
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingProduct(prod)}
                                className="p-1.5 text-slate-400 hover:text-green-650 rounded-xl hover:bg-slate-50 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete this product? It will delete referencing catalog items.')) {
                                    onDeleteProduct(prod.id);
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