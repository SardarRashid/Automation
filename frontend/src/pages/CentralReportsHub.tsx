import { safeDateStr } from '../utils/exports/ExportGenerators';
import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Table, RefreshCcw, Calendar, Users, Package, TrendingUp, Search } from 'lucide-react';
import { reportingEngine } from '../services/reporting/ReportingEngine';
import type { ReportFilter, ReportCategory } from '../services/reporting/ReportingEngine';
import { motion } from 'motion/react';
import { exportToCSV, exportToExcel, exportToPDF } from '../lib/exportUtils';
import { useSalesmanAdmin } from './salesman-admin/SalesmanAdminContext';

type ReportName = 
  | 'Customer Ledger' | 'Outstanding' | 'Collections' 
  | 'Movement History' | 'Damage' | 'Transfers' | 'Daily Count' | 'Shipments'
  | 'Profit' | 'Activity' | 'Performance';

export default function CentralReportsHub() {
  const { customers, users, products } = useSalesmanAdmin(); // We use the existing context to populate dropdowns

  const [category, setCategory] = useState<ReportCategory>('Sales');
  const [activeReport, setActiveReport] = useState<ReportName>('Customer Ledger');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<ReportFilter>({
    dateFrom: '',
    dateTo: '',
    customer: 'All',
    salesman: 'All',
    product: 'All'
  });

  const generateReport = async () => {
    setLoading(true);
    try {
      let result: any[] = [];
      switch (activeReport) {
        case 'Customer Ledger': result = await reportingEngine.getCustomerLedger(filters); break;
        case 'Outstanding': result = await reportingEngine.getOutstanding(filters); break;
        case 'Collections': result = await reportingEngine.getCollections(filters); break;
        case 'Movement History': result = await reportingEngine.getMovementHistory(filters); break;
        case 'Damage': result = await reportingEngine.getDamage(filters); break;
        case 'Transfers': result = await reportingEngine.getTransfers(filters); break;
        case 'Daily Count': result = await reportingEngine.getDailyCount(filters); break;
        case 'Shipments': result = await reportingEngine.getShipments(filters); break;
        case 'Profit': result = await reportingEngine.getProfit(filters); break;
        case 'Activity': result = await reportingEngine.getActivity(filters); break;
      }
      setData(result);
    } catch (err) {
      console.error(err);
      alert("Error generating report");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate when report type changes
  useEffect(() => {
    generateReport();
  }, [activeReport]);

  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    if (data.length === 0) return alert("No data to export!");
    const filename = `${activeReport.replace(/\s+/g, '_')}_${safeDateStr()}`;
    if (type === 'csv') exportToCSV(data, filename);
    if (type === 'excel') exportToExcel(data, filename);
    if (type === 'pdf') exportToPDF(data, filename, activeReport);
  };

  const salesReports: ReportName[] = ['Customer Ledger', 'Outstanding', 'Collections'];
  const inventoryReports: ReportName[] = ['Movement History', 'Damage', 'Transfers', 'Daily Count', 'Shipments'];
  const managementReports: ReportName[] = ['Profit', 'Activity']; // simplified

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar Filters */}
      <div className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-5 flex flex-col h-full overflow-y-auto z-10 shadow-sm">
        <div className="flex items-center space-x-2 mb-8 text-indigo-700 dark:text-indigo-400">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-xl font-bold">HQ Reports</h2>
        </div>

        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
          <Filter className="w-3.5 h-3.5 mr-1" /> Filters
        </h3>

        <div className="space-y-5 flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Date Range</label>
            <div className="flex space-x-2">
              <input type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-400 transition-colors" />
              <input type="date" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-400 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Salesman / User</label>
            <select value={filters.salesman} onChange={e => setFilters({...filters, salesman: e.target.value})} className="w-full text-sm p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-400 transition-colors">
              <option value="All">All Users</option>
              {users?.map(u => (
                <option key={u.uid} value={u.uid}>{u.name || u.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Customer</label>
            <select value={filters.customer} onChange={e => setFilters({...filters, customer: e.target.value})} className="w-full text-sm p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-400 transition-colors">
              <option value="All">All Customers</option>
              {customers?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Product</label>
            <select value={filters.product} onChange={e => setFilters({...filters, product: e.target.value})} className="w-full text-sm p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-400 transition-colors">
              <option value="All">All Products</option>
              {products?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button onClick={generateReport} className="w-full bg-indigo-600 dark:bg-indigo-50 dark:bg-indigo-900/300 hover:bg-indigo-700 dark:bg-indigo-600 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center space-x-2 mt-4">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Apply & Generate</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        
        {/* Top Header / Categories */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm z-0">
          <div className="flex space-x-6">
            {(['Sales', 'Inventory', 'Management'] as ReportCategory[]).map(cat => (
              <button 
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setActiveReport(
                    cat === 'Sales' ? 'Customer Ledger' : 
                    cat === 'Inventory' ? 'Movement History' : 'Profit'
                  );
                }}
                className={`pb-3 border-b-2 font-bold transition-all px-2 ${category === cat ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
              >
                {cat} Reports
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {(category === 'Sales' ? salesReports : category === 'Inventory' ? inventoryReports : managementReports).map(report => (
              <button
                key={report}
                onClick={() => setActiveReport(report)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                  activeReport === report 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900'
                }`}
              >
                {report}
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeReport}</h2>
          
          <div className="flex space-x-2">
            <button onClick={() => handleExport('csv')} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold flex items-center transition-colors">
              <Download className="w-4 h-4 mr-1.5" /> CSV
            </button>
            <button onClick={() => handleExport('excel')} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold flex items-center transition-colors">
              <Download className="w-4 h-4 mr-1.5" /> Excel
            </button>
            <button onClick={() => handleExport('pdf')} className="px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg text-sm font-bold flex items-center transition-colors">
              <Download className="w-4 h-4 mr-1.5" /> PDF
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 p-5 pt-0 overflow-hidden flex flex-col">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex-1 overflow-auto shadow-sm">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <RefreshCcw className="w-8 h-8 animate-spin mb-4" />
                <p>Generating Report Data...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Table className="w-12 h-12 mb-4 opacity-20" />
                <p>No data found for the selected filters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 shadow-sm">
                  <tr>
                    {Object.keys(data[0]).map(key => (
                      <th key={key} className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:bg-slate-900 transition-colors">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="p-3 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {typeof val === 'number' && keyContainsAmount(Object.keys(row)[j]) ? val.toFixed(2) : (val as string)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to format currency
function keyContainsAmount(key: string) {
  const k = key.toLowerCase();
  return k.includes('amount') || k.includes('balance') || k.includes('revenue') || k.includes('limit');
}
