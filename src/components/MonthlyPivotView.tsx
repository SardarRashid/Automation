import React, { useState, useEffect } from "react";
import { InventoryRecord } from "../types";
import { getRecordsByMonth } from "../services/dbService";
import { exportMonthlySummaryCSV, exportRecordsToCSV } from "../utils/csvExport";
import { FileSpreadsheet, Download, Calendar, ArrowRight, Table, FileText } from "lucide-react";
import { generateBrandedMonthlyPDF } from "../utils/pdfGenerator";

import { CategoryTemplate, Storekeeper } from "../types";

interface MonthlyPivotViewProps {
  onSelectDate: (date: string) => void;
  onNavigateToTab: (tab: string) => void;
  currentUser: Storekeeper;
}

export function MonthlyPivotView({ onSelectDate, onNavigateToTab, currentUser }: MonthlyPivotViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Default to current year-month (e.g., "2026-06")
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMonthData() {
      setLoading(true);
      try {
        const data = await getRecordsByMonth(selectedMonth);
        setRecords(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMonthData();
  }, [selectedMonth]);

  // Filter records based on role credentials
  const permittedRecords = records.filter(r => {
    const matchSection = currentUser.role === 'it_admin' || currentUser.role === 'manager' || currentUser.assignedSection === "All" ||
      currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(r.category.toLowerCase().trim());
    
    const matchStore = currentUser.role === 'it_admin' || currentUser.role === 'manager' || currentUser.assignedStoreNum === "All" ||
      currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(r.location.toLowerCase().trim()) ||
      currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).some(store => r.location.toLowerCase().includes(store));

    return matchSection && matchStore;
  });

  // Aggregate by Date matching filtered records
  const dateAggregations: { 
    [date: string]: { 
      incoming: number; 
      sold: number; 
      available: number; 
      items: InventoryRecord[] 
    } 
  } = {};

  permittedRecords.forEach((rec) => {
    if (!dateAggregations[rec.date]) {
      dateAggregations[rec.date] = { incoming: 0, sold: 0, available: 0, items: [] };
    }
    dateAggregations[rec.date].incoming += rec.incoming;
    dateAggregations[rec.date].sold += rec.sold;
    dateAggregations[rec.date].available += rec.available;
    dateAggregations[rec.date].items.push(rec);
  });

  const datesList = Object.keys(dateAggregations).sort((a, b) => b.localeCompare(a)); // Newest first

  const handleExportAll = () => {
    if (permittedRecords.length === 0) {
      alert("No records to export!");
      return;
    }
    exportRecordsToCSV(permittedRecords, `monthly-records-all-${selectedMonth}.csv`);
  };

  const handleExportSummary = () => {
    exportMonthlySummaryCSV(permittedRecords, selectedMonth);
  };

  const [exportingPDF, setExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    if (permittedRecords.length === 0) {
      alert("No records found to build Branded PDF!");
      return;
    }
    setExportingPDF(true);
    try {
      await generateBrandedMonthlyPDF(permittedRecords, selectedMonth, currentUser);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Encountered unexpected error generating PDF report.");
    } finally {
      setExportingPDF(false);
    }
  };

  const handleSelectDay = (date: string) => {
    onSelectDate(date);
    onNavigateToTab("daily");
  };

  // Human month styling
  const getHumanMonth = (ym: string) => {
    const [year, month] = ym.split("-");
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    return dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5.5 h-5.5 text-green-705" />
            Monthly Audit Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Simulates your multi-sheet Excel file. View daily tabs automatically stored in the database.
          </p>
        </div>

        {/* Month Picker / Dynamic Field */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none font-sans"
            />
          </div>

          <button
            onClick={handleExportPDF}
            disabled={permittedRecords.length === 0 || loading || exportingPDF}
            className="bg-emerald-850 hover:bg-emerald-900 border border-emerald-950 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-40 shadow-sm hover:translate-y-[-1px] active:translate-y-[0px] cursor-pointer"
          >
            {exportingPDF ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-4 h-4 text-emerald-300" />
            )}
            {exportingPDF ? "Building PDF..." : "Export Official PDF"}
          </button>

          <button
            onClick={handleExportSummary}
            disabled={permittedRecords.length === 0 || loading}
            className="bg-green-50 text-green-850 hover:bg-green-100 border border-green-200/60 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export Monthly Summary
          </button>

          <button
            onClick={handleExportAll}
            disabled={permittedRecords.length === 0 || loading}
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export Raw Ledger (CSV)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-500">Retrieving ledger details for {getHumanMonth(selectedMonth)}...</p>
        </div>
      ) : datesList.length > 0 ? (
        <div className="space-y-6">
          
          {/* Monthly Aggregated Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-55/80 border-b border-slate-100 text-slate-500 font-mono text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date Tab</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4 text-sky-700">Total Came (Inflow)</th>
                  <th className="py-3 px-4 text-amber-700">Total Sale (Outflow)</th>
                  <th className="py-3 px-4 text-green-800">Total Available Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {datesList.map((dateStr) => {
                  const dayStats = dateAggregations[dateStr];
                  const formattedDate = new Date(dateStr).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });

                  return (
                    <tr key={dateStr} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {formattedDate}
                        {dateStr === new Date().toISOString().split('T')[0] && (
                          <span className="ml-2 bg-yellow-400 text-green-950 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                            Today
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        {dayStats.items.length} products
                      </td>
                      <td className="py-3.5 px-4 text-sky-600 font-bold font-mono">
                        +{dayStats.incoming}
                      </td>
                      <td className="py-3.5 px-4 text-amber-600 font-bold font-mono">
                        -{dayStats.sold}
                      </td>
                      <td className="py-3.5 px-4 text-green-700 font-bold font-mono">
                        {dayStats.available}
                      </td>
                      <td className="py-3.5 px-4 text-right flex gap-2 justify-end">
                        <button
                          onClick={() => exportRecordsToCSV(dayStats.items, `inventory-audit-${dateStr}.csv`)}
                          className="text-xs text-slate-500 hover:text-green-800 border border-slate-200 hover:border-green-200 px-2 py-1 rounded-lg font-medium transition-colors"
                        >
                          Export CSV
                        </button>
                        <button
                          onClick={() => handleSelectDay(dateStr)}
                          className="bg-green-50 hover:bg-green-100 text-green-850 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                        >
                          Open Sheet
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Informational card */}
          <div className="bg-green-50/50 rounded-xl p-4 border border-green-150 flex items-start gap-3">
            <Table className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-green-900">How to automate June worksheets</h4>
              <p className="text-xs text-green-800 mt-1 leading-relaxed">
                Rather than creating a separate file for each month and manual sheet tabs per date inside Microsoft Excel, the Sharbatly Cold Storage portal stores every record securely in Firestore. You can query any calendar day, adjust quantities with low clicks on a desktop, and download individual files as compliant CSV models.
              </p>
            </div>
          </div>

        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 max-w-xl mx-auto">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 font-sans">No Data recorded for {getHumanMonth(selectedMonth)}</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You can start entering stock values inside the "Daily Summary Sheet" tab to auto-build databases.
          </p>
          <button
            onClick={() => onNavigateToTab("daily")}
            className="mt-4 bg-green-750 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-semibold"
          >
            Open Daily Count Sheet
          </button>
        </div>
      )}

    </div>
  );
}
