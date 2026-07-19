import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useSalesmanAdmin } from '../SalesmanAdminContext';
import { fbService } from '../services/firebaseService';
import type {  Product  } from '../../../types/SalesmanAdmin';

export default function Products() {
  const { products } = useSalesmanAdmin();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Grains');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('Bag');

  const handleAddProduct = async () => {
    if (!newProdName || !newProdPrice) return alert("Fill required fields");
    const p: Product = {
      id: '',
      name: newProdName,
      code: newProdCode,
      category: newProdCategory,
      price: Number(newProdPrice),
      stock: Number(newProdStock),
      unit: newProdUnit
    };
    await fbService.addProduct(p);
    setNewProdName('');
    setNewProdCode('');
    setNewProdPrice('');
    setNewProdStock('');
  };

  const handleEditProduct = async () => {
    if (editingProduct) {
      await fbService.updateProduct(editingProduct);
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure?")) {
      await fbService.deleteProduct(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Product Registration Form */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-3xl shadow-sm self-start">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">Add to Inventory</h3>
        <p className="text-xs text-slate-400 mb-4">Register new SKUs for field sales.</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Product Name</label>
            <input 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. Basmati Rice 5kg"
              value={newProdName} onChange={e => setNewProdName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">SKU Code</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="RICE-001"
                value={newProdCode} onChange={e => setNewProdCode(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Category</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={newProdCategory} onChange={e => setNewProdCategory(e.target.value)}
              >
                <option>Grains</option>
                <option>Spices</option>
                <option>Beverages</option>
                <option>Snacks</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Unit</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={newProdUnit} onChange={e => setNewProdUnit(e.target.value)}
              >
                <option>Bag</option>
                <option>Box</option>
                <option>Piece</option>
                <option>Kg</option>
                <option>Carton</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Price</label>
              <input 
                type="number"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="0.00"
                value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Stock</label>
              <input 
                type="number"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="0"
                value={newProdStock} onChange={e => setNewProdStock(e.target.value)}
              />
            </div>
          </div>
          <button 
            onClick={handleAddProduct}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors mt-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Active Inventory Table */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Master Inventory</h3>
            <p className="text-xs text-slate-400">Available products for field ordering.</p>
          </div>
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
            <Package className="w-3 h-3" />
            <span>{products.length} SKUs</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4">Item Details</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Pricing</th>
                <th className="px-5 py-4">Stock Lvl</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:bg-slate-900/80 transition-colors">
                  <td className="px-5 py-4">
                    {editingProduct?.id === p.id ? (
                      <div className="space-y-1">
                        <input className="border rounded p-1 w-full text-sm" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                        <input className="border rounded p-1 w-full text-sm" value={editingProduct.code} onChange={e => setEditingProduct({...editingProduct, code: e.target.value})} />
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{p.name}</div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">{p.code}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingProduct?.id === p.id ? (
                      <select className="border rounded p-1 w-full text-sm" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                        <option>Grains</option>
                        <option>Spices</option>
                        <option>Beverages</option>
                        <option>Snacks</option>
                        <option>Other</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200">
                        {p.category}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingProduct?.id === p.id ? (
                      <div className="flex space-x-1">
                        <input className="border rounded p-1 w-16 text-sm" type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                        <select className="border rounded p-1 w-16 text-sm" value={editingProduct.unit} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})}>
                          <option>Bag</option><option>Box</option><option>Piece</option><option>Kg</option><option>Carton</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-blue-700">{Number(p.price).toFixed(2)} SAR</div>
                        <div className="text-xs text-slate-400">per {p.unit}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingProduct?.id === p.id ? (
                      <input className="border rounded p-1 w-16 text-sm" type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} />
                    ) : (
                      <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{p.stock}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {editingProduct?.id === p.id ? (
                      <div className="flex justify-end space-x-2">
                        <button onClick={handleEditProduct} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingProduct(null)} className="p-1.5 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => setEditingProduct(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No products added to inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
