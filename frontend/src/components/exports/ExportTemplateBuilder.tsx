
import React, { useState, useEffect } from 'react';
import { Save, LayoutTemplate, X, Check, FileText } from 'lucide-react';
import { database } from '../../lib/firebase';
import { ref, set, push, onValue } from 'firebase/database';

export default function ExportTemplateBuilder() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState('Landscape');
  const [showTotals, setShowTotals] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [groupBy, setGroupBy] = useState('Customer');

  useEffect(() => {
    const unsub = onValue(ref(database, 'export_templates'), (snap) => {
      setTemplates(snap.exists() ? Object.values(snap.val()) : []);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!templateName.trim()) return;
    const newRef = push(ref(database, 'export_templates'));
    const tpl = {
      id: newRef.key,
      name: templateName,
      paperSize,
      orientation,
      showTotals,
      showPrices,
      showBalances,
      groupBy,
      createdAt: new Date().toISOString()
    };
    await set(newRef, tpl);
    setIsCreating(false);
    setTemplateName('');
  };

  return (
    <div className="mt-10 pt-10 border-t border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-indigo-500" />
            Custom Export Templates
          </h2>
          <p className="text-slate-500 text-sm mt-1">Design and save reusable custom report layouts.</p>
        </div>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="bg-indigo-50 text-indigo-600 font-bold px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
            + New Template
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800">Create New Template</h3>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Template Name</label>
              <input type="text" value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="e.g., Monthly Tax Report" className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Group By</label>
              <select value={groupBy} onChange={e=>setGroupBy(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500">
                <option>Customer</option>
                <option>Product</option>
                <option>Salesman</option>
                <option>Date</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Paper Configuration (PDF)</label>
              <div className="flex gap-2">
                <select value={paperSize} onChange={e=>setPaperSize(e.target.value)} className="w-1/2 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500">
                  <option>A4</option>
                  <option>A3</option>
                </select>
                <select value={orientation} onChange={e=>setOrientation(e.target.value)} className="w-1/2 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500">
                  <option>Landscape</option>
                  <option>Portrait</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Visibility Options</label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${showTotals ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {showTotals && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Include Subtotals & Grand Totals</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${showPrices ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {showPrices && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Show Prices & Values</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${showBalances ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {showBalances && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Show Customer Outstanding Balances</span>
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button onClick={handleSave} disabled={!templateName.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md">
              <Save className="w-4 h-4" /> Save Template
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-start gap-3">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 leading-tight">{t.name}</h4>
              <p className="text-xs text-slate-500 mt-1">Grouped by {t.groupBy} ? {t.paperSize} {t.orientation}</p>
            </div>
          </div>
        ))}
        {templates.length === 0 && !isCreating && (
          <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No custom templates created yet.
          </div>
        )}
      </div>
    </div>
  );
}
