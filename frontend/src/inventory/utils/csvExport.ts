import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { InventoryRecord } from "../types";

export function exportRecordsToCSV(records: InventoryRecord[], filename: string) {
  if (records.length === 0) {
    alert("No records to export!");
    return;
  }

  // Official Company Policy Header rows
  const companyHeader = [
    ["M. A. SHARBATLY CO. - COLD CHAIN LOGISTICS NETWORK"],
    ["COMMERCIAL FRUIT & GENERAL FOOD STOCKS INVENTORY SHEET"],
    [`REPORT FOR DATE (UTC/LOCAL):, ${records[0]?.date || "N/A"}`],
    ["CLASSIFICATION:, RESTRICTED / COMPANY CONFIDENTIAL"],
    ["AUDIT STANDARDS:, SHARBATLY INTERNAL SYSTEM VERIFICATION POLICY v3.2"],
    [""], // spacer
  ];

  // Define headers
  const headers = [
    "Date",
    "Category",
    "Variety",
    "Size",
    "Cold Store / Room / Location",
    "Arrival Date",
    "Opening Morning Stock (Pkgs)",
    "Incoming Received Today (Pkgs)",
    "Sold Dispatched Today (Pkgs)",
    "Calculated Book Stock (Pkgs)",
    "Physical Counted Stock (Pkgs)",
    "Pallet Discrepancy Margin",
    "Remarks / Pallet Notes"
  ];

  // Map records to rows with calculated discrepancies to ensure accurate accounting
  const rows = records.map((rec) => {
    const calculatedBook = (Number(rec.openingStock) || 0) + (Number(rec.incoming) || 0) - (Number(rec.sold) || 0);
    const discrepancy = (Number(rec.available) || 0) - calculatedBook;
    
    return [
      rec.date,
      `"${rec.category.replace(/"/g, '""')}"`,
      `"${rec.variety.replace(/"/g, '""')}"`,
      `"${rec.size.replace(/"/g, '""')}"`,
      `"${rec.location.replace(/"/g, '""')}"`,
      rec.arrivalDate || "N/A",
      rec.openingStock.toString(),
      rec.incoming.toString(),
      rec.sold.toString(),
      calculatedBook.toString(),
      rec.available.toString(),
      discrepancy >= 0 ? `+${discrepancy}` : discrepancy.toString(),
      rec.notes ? `"${rec.notes.replace(/"/g, '""')}"` : ""
    ];
  });

  // Join everything into standard CSV format with headers
  const csvContent = [
    ...companyHeader.map(row => row.join(",")),
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\n");

  // Create downloadable file blob (UTF-8 with BOM for pure Excel compatibility)
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportMonthlySummaryCSV(records: InventoryRecord[], yearMonth: string) {
  if (records.length === 0) {
    alert("No records found for this month!");
    return;
  }

  // Official Company Policy Header rows
  const companyHeader = [
    ["M. A. SHARBATLY CO. - COLD CHAIN LOGISTICS NETWORK"],
    [`MONTHLY CONSOLIDATED AUDIT LEDGER - ${yearMonth}`],
    ["CLASSIFICATION:, OFFICIAL OFFICE EXCEL LEDGER - RESTRICTED"],
    ["SYSTEM STATUS:, DATA INTEGRITY SECURED"],
    [""], // spacer
  ];

  // Generate aggregate totals for audit reports
  // Group by Date
  const dateMap: { [date: string]: { incoming: number; sold: number; available: number; itemsCount: number } } = {};
  
  records.forEach((rec) => {
    if (!dateMap[rec.date]) {
      dateMap[rec.date] = { incoming: 0, sold: 0, available: 0, itemsCount: 0 };
    }
    dateMap[rec.date].incoming += Number(rec.incoming) || 0;
    dateMap[rec.date].sold += Number(rec.sold) || 0;
    dateMap[rec.date].available += Number(rec.available) || 0;
    dateMap[rec.date].itemsCount += 1;
  });

  const headers = [
    "Calendar Date",
    "Unique Fruit Lines Tracked",
    "Total Cargo Inflow (Pkgs)",
    "Total Volume Dispatched (Pkgs)",
    "Physically Available Closing Stock (Pkgs)",
    "Cold Store Operating Margin"
  ];

  const rows = Object.entries(dateMap).sort((a, b) => a[0].localeCompare(b[0])).map(([date, stats]) => [
    date,
    stats.itemsCount.toString(),
    stats.incoming.toString(),
    stats.sold.toString(),
    stats.available.toString(),
    (stats.incoming - stats.sold).toString()
  ]);

  const csvContent = [
    ...companyHeader.map(row => row.join(",")),
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `monthly-summary-${yearMonth}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
