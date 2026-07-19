import os

reports_code = """import React, { useState } from 'react';
import { FileSpreadsheet, Download, FileText, Printer, Check, X } from 'lucide-react';
import { useSalesmanAdmin } from '../SalesmanAdminContext';
import { exportDailySalesToExcel } from '../../../utils/exportExcel';
import { Order } from '../../../types/SalesmanAdmin';

export default function Reports() {
  const { orders } = useSalesmanAdmin();

  const [reportDate, setReportDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [invoiceModalOrder, setInvoiceModalOrder] = useState<Order | null>(null);
  const [invoiceOptions, setInvoiceOptions] = useState({
    showPrices: true,
    showZakat: true,
    receiptFormat: false
  });

  const generateReport = () => {
    const dailyOrders = orders.filter(o => o.date === reportDate && o.status !== 'Cancelled');
    if (dailyOrders.length === 0) {
      alert(`No active orders found for ${reportDate}`);
      return;
    }
    exportDailySalesToExcel(reportDate, dailyOrders);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm max-w-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Daily End-of-Day Report</h3>
            <p className="text-sm text-slate-500">Generate a consolidated Excel sheet of all field sales, items sold, and collections for a specific date.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Select Date</label>
            <input 
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-700"
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
            />
          </div>
          <button 
            onClick={generateReport}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-green-500/20"
          >
            <Download className="w-5 h-5" />
            <span>Download Excel Report</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800">Invoice / Receipt Generator</h3>
            <p className="text-xs text-slate-400">Generate print-ready thermal receipts or A4 invoices for past orders.</p>
          </div>
          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
            <FileText className="w-3 h-3" />
            <span>Select from Orders</span>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">
            To generate an invoice, please navigate to the <span className="font-bold text-slate-700">Orders Tab</span> and select an order to print, or use the centralized report generator above for aggregate data.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => document.getElementById('orders-tab-btn')?.click()}>
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-700">A4 Tax Invoice</span>
              </div>
              <p className="text-xs text-slate-500">Standard full-page invoice suitable for B2B clients and official tax records.</p>
            </div>
            
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer" onClick={() => document.getElementById('orders-tab-btn')?.click()}>
              <div className="flex items-center space-x-3 mb-2">
                <Printer className="w-5 h-5 text-slate-600" />
                <span className="font-bold text-slate-700">80mm Thermal Receipt</span>
              </div>
              <p className="text-xs text-slate-500">Compact receipt format matching the portable printers used by field agents.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"""

with open(r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\components\Reports.tsx", "w", encoding="utf-8") as f:
    f.write(reports_code)

print("Reports.tsx built")
