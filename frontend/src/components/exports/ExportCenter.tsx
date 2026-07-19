
import React, { useState } from 'react';
import ExportTemplateBuilder from './ExportTemplateBuilder';
import { FileSpreadsheet, FileText, Download, Loader2, TableProperties, Users, Package, TrendingUp, Settings2 } from 'lucide-react';
import type { Order, Customer, Product, User } from '../../pages/SalesmanAdmin_V1';
import { 
  generateWholesaleMarketSheet, generateCustomerOrderSheet, generateDailyOrdersReport, 
  generateProductSalesReport, generateCustomerSummaryReport, generateSalesmanPerformanceReport 
} from '../../utils/exports/ExportGenerators';

interface ExportCenterProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
  users: User[];
}

export default function ExportCenter({ orders, customers, products, users }: ExportCenterProps) {
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [dateRange, setDateRange] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState('');

  const reports = [
    { id: 1, title: 'Wholesale Market Sheet', icon: <TableProperties className="w-8 h-8 text-emerald-500"/>, desc: 'Matrix layout of Customers vs Products' },
    { id: 2, title: 'Customer Order Sheet', icon: <FileText className="w-8 h-8 text-blue-500"/>, desc: 'Individual invoices for each order' },
    { id: 3, title: 'Daily Orders Report', icon: <Package className="w-8 h-8 text-amber-500"/>, desc: 'Tabular breakdown of daily transactions' },
    { id: 4, title: 'Product Sales Report', icon: <TrendingUp className="w-8 h-8 text-purple-500"/>, desc: 'Analytics on product performance' },
    { id: 5, title: 'Customer Summary', icon: <Users className="w-8 h-8 text-indigo-500"/>, desc: 'Aggregated metrics per customer' },
    { id: 6, title: 'Salesman Performance', icon: <TrendingUp className="w-8 h-8 text-rose-500"/>, desc: 'KPIs and collections per salesman' }
  ];

  const handleExport = async () => {
    if (!selectedReport) return;
    setIsExporting(true);
    
    // Fake progress steps for UI
    setExportStep('Preparing Report...');
    await new Promise(r => setTimeout(r, 600));
    setExportStep('Collecting Data...');
    await new Promise(r => setTimeout(r, 800));
    setExportStep(`Generating ${format.toUpperCase()}...`);
    await new Promise(r => setTimeout(r, 600));

    // Filter orders by date range
    let filteredOrders = orders;
    const today = new Date().toISOString().split('T')[0];
    if (dateRange === 'today') filteredOrders = orders.filter(o => o.date === today);
    // Add more date filters as needed

    try {
      switch(selectedReport) {
        case 1: await generateWholesaleMarketSheet(filteredOrders, customers, products, format, dateRange); break;
        case 2: await generateCustomerOrderSheet(filteredOrders, format); break;
        case 3: await generateDailyOrdersReport(filteredOrders, format); break;
        case 4: await generateProductSalesReport(filteredOrders, products, format); break;
        case 5: await generateCustomerSummaryReport(filteredOrders, customers, format); break;
        case 6: await generateSalesmanPerformanceReport(filteredOrders, users, format); break;
      }
      setExportStep('Finalizing...');
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.error(e);
      alert("Export failed. Please check the console.");
    }

    setIsExporting(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">Export Center</h1>
        <p className="text-slate-500 mt-2">Generate professional, print-ready reports and sheets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reports.map(r => (
            <div 
              key={r.id} 
              onClick={() => setSelectedReport(r.id)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedReport === r.id ? 'border-blue-500 bg-blue-50/50 shadow-md transform scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}
            >
              <div className="mb-4">{r.icon}</div>
              <h3 className="font-bold text-slate-800 text-lg">{r.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{r.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit sticky top-6">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings2 className="w-5 h-5"/> Export Settings</h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Date Range</label>
              <select value={dateRange} onChange={e=>setDateRange(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Output Format</label>
              <div className="flex gap-3">
                <button onClick={() => setFormat('excel')} className={`flex-1 py-2.5 rounded-lg border-2 flex items-center justify-center gap-2 font-bold text-sm transition-colors ${format === 'excel' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
                <button onClick={() => setFormat('pdf')} className={`flex-1 py-2.5 rounded-lg border-2 flex items-center justify-center gap-2 font-bold text-sm transition-colors ${format === 'pdf' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <FileText className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>

            <button 
              onClick={handleExport}
              disabled={!selectedReport || isExporting}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isExporting ? 'Generating...' : 'Generate Export'}
            </button>
          </div>
        </div>
      </div>

      {isExporting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Exporting Data</h3>
            <p className="text-slate-500 font-medium">{exportStep}</p>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full w-2/3 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      <ExportTemplateBuilder />
    </div>
  );
}
