import os

payments_code = """import React from 'react';
import { DollarSign, Check, Eye } from 'lucide-react';
import { useSalesmanAdmin } from '../SalesmanAdminContext';
import { fbService } from '../services/firebaseService';

export default function Payments() {
  const { payments, orders } = useSalesmanAdmin();

  const handleConfirmFieldPayment = async (payment: any) => {
    if (confirm(`Confirm receipt of ${payment.amountPaid} SAR from ${payment.collectedBy}?`)) {
      await fbService.confirmFieldPayment(payment, orders);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800">Field Collections (Payments)</h3>
          <p className="text-xs text-slate-400">Review and verify payments collected by sales reps in the field.</p>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <DollarSign className="w-3 h-3" />
          <span>{payments.filter(p => p.status !== 'Confirmed').length} Pending</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-5 py-4">Date / Time</th>
              <th className="px-5 py-4">Client</th>
              <th className="px-5 py-4">Collected By</th>
              <th className="px-5 py-4">Amount</th>
              <th className="px-5 py-4">Notes</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">HQ Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.slice().reverse().map(p => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="text-slate-800 font-medium">{new Date(p.date).toLocaleDateString()}</div>
                  <div className="text-xs text-slate-400">{new Date(p.date).toLocaleTimeString()}</div>
                </td>
                <td className="px-5 py-4 font-bold text-blue-900">{p.customerName}</td>
                <td className="px-5 py-4 text-slate-600">{p.collectedBy}</td>
                <td className="px-5 py-4 font-bold text-emerald-600">{Number(p.amountPaid).toFixed(2)} SAR</td>
                <td className="px-5 py-4 text-xs text-slate-500 truncate max-w-[150px]" title={p.description}>{p.description}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    p.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {p.status || 'Pending Verification'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {p.status !== 'Confirmed' ? (
                    <button 
                      onClick={() => handleConfirmFieldPayment(p)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium text-xs border border-emerald-100"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify Receipt</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Verified</span>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                  No payment collections recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"""

with open(r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\components\Payments.tsx", "w", encoding="utf-8") as f:
    f.write(payments_code)

print("Payments.tsx built")
