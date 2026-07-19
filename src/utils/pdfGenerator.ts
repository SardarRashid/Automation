import { jsPDF } from "jspdf";
import { InventoryRecord, Storekeeper } from "../types";

// Official color palette for Sharbatly Fruit
const COLORS = {
  emeraldForest: { r: 6, g: 95, b: 70 },      // Principal Forest Green (#065F46)
  emeraldLight: { r: 16, g: 185, b: 129 },    // Mint Accent (#10B981)
  emeraldBg: { r: 240, g: 253, b: 250 },      // Emerald tint background (#F0FDFA)
  softGold: { r: 217, g: 119, b: 6 },         // Warning gold border (#D97706)
  warningGoldBg: { r: 254, g: 243, b: 199 },  // Light gold background (#FEF3C7)
  charcoalText: { r: 30, g: 41, b: 59 },      // Standard text (#1E293B)
  slateMuted: { r: 100, g: 116, b: 139 },     // Secondary details (#64748B)
  lightZebra: { r: 248, g: 250, b: 252 },     // Table striping (#F8FAFC)
  snowWhite: { r: 255, g: 255, b: 255 },
  borderGray: { r: 226, g: 232, b: 240 }      // Slate-200 border (#E2E8F0)
};

/**
 * Main PDF Generation Entry Point
 */
export async function generateBrandedMonthlyPDF(
  records: InventoryRecord[],
  yearMonth: string,
  currentUser: Storekeeper
): Promise<void> {
  if (records.length === 0) {
    alert("Cannot export empty monthly record database.");
    return;
  }

  // Determine human-readable month name e.g. "June 2026"
  const [year, month] = yearMonth.split("-");
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
  const humanMonthName = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Initialize jsPDF with A4 Landscape layout, perfect for wide spreadsheets & ledger reports
  // Page Size: 297mm Width * 210mm Height
  const doc = new jsPDF({
    orientation: "l",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const totalPagesPlaceholder = "{total_pages_count}";
  
  // Calculate aggregate metrics across the whole month
  let grandTotalOpening = 0;
  let grandTotalIncoming = 0;
  let grandTotalSold = 0;
  let grandTotalAvailable = 0;
  const uniqueProductsSet = new Set<string>();

  records.forEach((r) => {
    grandTotalIncoming += Number(r.incoming) || 0;
    grandTotalSold += Number(r.sold) || 0;
    uniqueProductsSet.add(`${r.category}_${r.variety}_${r.size}`);
  });

  // Calculate opening stock from the start of the month for each unique product
  // openingStock is opening Stock for the first record occurrence of that item in the sorted list.
  // Sort records chronologically first to compute product aggregation accurately
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // Product aggregations for Pivot Breakdown
  const productPivot: {
    [prodKey: string]: {
      category: string;
      variety: string;
      size: string;
      location: string;
      openingStock: number;
      incoming: number;
      sold: number;
      available: number;
      historyCount: number;
    }
  } = {};

  sortedRecords.forEach((r) => {
    const prodKey = `${r.category}_${r.variety}_${r.size}_${r.location}`;
    if (!productPivot[prodKey]) {
      productPivot[prodKey] = {
        category: r.category,
        variety: r.variety,
        size: r.size,
        location: r.location,
        openingStock: Number(r.openingStock) || 0, // Chronologically sorted, so first seen is beginning opening stock
        incoming: 0,
        sold: 0,
        available: Number(r.available) || 0, // This will be repeatedly overwritten so final is closing stock
        historyCount: 0
      };
    }
    
    productPivot[prodKey].incoming += Number(r.incoming) || 0;
    productPivot[prodKey].sold += Number(r.sold) || 0;
    productPivot[prodKey].available = Number(r.available) || 0; // Cumulative ending stock
    productPivot[prodKey].historyCount += 1;
  });

  // Now compute grand totals based on unique products
  Object.values(productPivot).forEach((prod) => {
    grandTotalOpening += prod.openingStock;
    grandTotalAvailable += prod.available;
  });

  // Prepare Daily aggregate numbers (Tab 1)
  const dailyMap: { [date: string]: { incoming: number; sold: number; available: number; headcount: number } } = {};
  records.forEach((r) => {
    if (!dailyMap[r.date]) {
      dailyMap[r.date] = { incoming: 0, sold: 0, available: 0, headcount: 0 };
    }
    dailyMap[r.date].incoming += Number(r.incoming) || 0;
    dailyMap[r.date].sold += Number(r.sold) || 0;
    dailyMap[r.date].available += Number(r.available) || 0;
    dailyMap[r.date].headcount += 1;
  });
  const sortedDays = Object.keys(dailyMap).sort((a, b) => a.localeCompare(b));

  // --- Helper: Render Company Letterhead Decorator on a page ---
  const applyLetterhead = (pageTitle: string, pageNum: number) => {
    // 1. Draw top accent bars (emerald thick, gold thin)
    doc.setFillColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
    doc.rect(15, 10, 267, 10, "F");
    
    doc.setFillColor(COLORS.softGold.r, COLORS.softGold.g, COLORS.softGold.b);
    doc.rect(15, 20, 267, 1.5, "F");

    // Company Title English (Left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("M. A. SHARBATLY CO. | Muhammad Abdullah Sharbatly Fruit", 19, 16.5);

    // Arabic title (Bilingual presentation)
    doc.setFontSize(8);
    doc.text("المملكة العربية السعودية - شبكة سلاسل التبريد والخدمات اللوجستية ", 210, 16.5);

    // Subheader brand space
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
    doc.setFont("helvetica", "bold");
    doc.text(pageTitle.toUpperCase(), 15, 29);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(COLORS.slateMuted.r, COLORS.slateMuted.g, COLORS.slateMuted.b);
    const dateStamp = `Export: ${new Date().toLocaleDateString("en-US")} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    doc.text(dateStamp, 282 - doc.getTextWidth(dateStamp), 29);

    // Soft separation line
    doc.setDrawColor(COLORS.borderGray.r, COLORS.borderGray.g, COLORS.borderGray.b);
    doc.setLineWidth(0.3);
    doc.line(15, 31.5, 282, 31.5);
  };

  // --- Helper: Render Page Footer (Page numbers, Confidential marks) ---
  const applyFooter = (pageNum: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setDrawColor(COLORS.borderGray.r, COLORS.borderGray.g, COLORS.borderGray.b);
    doc.setLineWidth(0.3);
    doc.line(15, 195, 282, 195);

    doc.setTextColor(COLORS.slateMuted.r, COLORS.slateMuted.g, COLORS.slateMuted.b);
    doc.text(`Sharbatly Audit Portal v4.2 • RESTRICTED - OFFICIAL REPORT`, 15, 200);
    
    // Page counts
    const pageNumStr = `Page ${pageNum} of ${totalPagesPlaceholder}`;
    doc.text(pageNumStr, 282 - doc.getTextWidth(pageNumStr), 200);
  };

  // ==========================================
  // PAGE 1: EXECUTIVES EXECUTIVE SUMMARY SHEET
  // ==========================================
  applyLetterhead("1. Executive Summary & KPIs Overview", 1);
  
  // Document Title Header Box
  doc.setFillColor(COLORS.emeraldBg.r, COLORS.emeraldBg.g, COLORS.emeraldBg.b);
  doc.rect(15, 35, 267, 24, "F");
  
  doc.setDrawColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.setLineWidth(1);
  doc.line(15, 35, 15, 59); // bold left border

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.text(`MONTHLY STOCK LEDGER & VERIFIED INVENTORY REPORT`, 20, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(COLORS.charcoalText.r, COLORS.charcoalText.g, COLORS.charcoalText.b);
  doc.text(`Official balance breakdown audit for ${humanMonthName} (${yearMonth}) across temperature-controlled coldrooms.`, 20, 50);
  doc.text(`Verification Type: Standard Physical Coldroom Reconciliation (Post-Daily Match Validation)`, 20, 55);

  // Metadata Columns (Auditor details, section etc.)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.text("AUDIT METADATA INFORMATION", 15, 67);

  // Draw metadata bounding box
  doc.setDrawColor(COLORS.borderGray.r, COLORS.borderGray.g, COLORS.borderGray.b);
  doc.setLineWidth(0.3);
  doc.setFillColor(COLORS.lightZebra.r, COLORS.lightZebra.g, COLORS.lightZebra.b);
  doc.rect(15, 70, 267, 24, "FD");

  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.charcoalText.r, COLORS.charcoalText.g, COLORS.charcoalText.b);
  
  // Column 1
  doc.setFont("helvetica", "bold"); doc.text("Prepared By:", 20, 76);
  doc.setFont("helvetica", "normal"); doc.text(`${currentUser.name} (${currentUser.role.toUpperCase()})`, 48, 76);
  doc.setFont("helvetica", "bold"); doc.text("Staff Email:", 20, 82);
  doc.setFont("helvetica", "normal"); doc.text(`${currentUser.email}`, 48, 82);
  doc.setFont("helvetica", "bold"); doc.text("Security Level:", 20, 88);
  doc.setFont("helvetica", "normal"); doc.text(`Confidential • Operational Audit Level`, 48, 88);

  // Column 2
  doc.setFont("helvetica", "bold"); doc.text("Assigned Section:", 120, 76);
  doc.setFont("helvetica", "normal"); doc.text(`${currentUser.assignedSection || "All"}`, 155, 76);
  doc.setFont("helvetica", "bold"); doc.text("Target Division:", 120, 82);
  doc.setFont("helvetica", "normal"); doc.text(`${currentUser.assignedStoreNum || "All Storage Rooms"}`, 155, 82);
  doc.setFont("helvetica", "bold"); doc.text("Data Backbone:", 120, 88);
  doc.setFont("helvetica", "normal"); doc.text(`Cloud Firestore Persistent Encrypted Instance`, 155, 88);

  // Column 3
  doc.setFont("helvetica", "bold"); doc.text("Active Ledger Days:", 210, 76);
  doc.setFont("helvetica", "normal"); doc.text(`${sortedDays.length} Working Days`, 245, 76);
  doc.setFont("helvetica", "bold"); doc.text("Total Item Lines:", 210, 82);
  doc.setFont("helvetica", "normal"); doc.text(`${uniqueProductsSet.size} Active SKUs`, 245, 82);
  doc.setFont("helvetica", "bold"); doc.text("Verification standard:", 210, 88);
  doc.setFont("helvetica", "normal"); doc.text(`SOP-CCNR-v4`, 245, 88);

  // KPI Bento Grid Summary Cards (4 Cards side-by-side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.text("EXECUTIVE KEY PERFORMANCE METRICS (MONTHLY ACCUMULATED)", 15, 103);

  const cardW = 63.5;
  const cardH = 25;
  const cardY = 106;
  const cardGap = 4.3;

  // CARD 1: Beginning Opening Stock
  doc.setFillColor(COLORS.lightZebra.r, COLORS.lightZebra.g, COLORS.lightZebra.b);
  doc.rect(15, cardY, cardW, cardH, "F");
  doc.setDrawColor(COLORS.borderGray.r, COLORS.borderGray.g, COLORS.borderGray.b);
  doc.rect(15, cardY, cardW, cardH, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.slateMuted.r, COLORS.slateMuted.g, COLORS.slateMuted.b);
  doc.text("Beginning Opening Stock", 19, cardY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.charcoalText.r, COLORS.charcoalText.g, COLORS.charcoalText.b);
  doc.text(`${grandTotalOpening.toLocaleString()} pkgs`, 19, cardY + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Beginning Period Sum", 19, cardY + 21);

  // CARD 2: Total Incoming Cargo (Inflow)
  doc.setFillColor(240, 249, 255); // Sky blue tint
  doc.rect(15 + (cardW + cardGap), cardY, cardW, cardH, "F");
  doc.setDrawColor(186, 230, 253);
  doc.rect(15 + (cardW + cardGap), cardY, cardW, cardH, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(3, 105, 161); // Sky blue text
  doc.text("Total Cargo Inflow (+)", 15 + (cardW + cardGap) + 4, cardY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(3, 105, 161);
  doc.text(`+${grandTotalIncoming.toLocaleString()} pkgs`, 15 + (cardW + cardGap) + 4, cardY + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.slateMuted.r, COLORS.slateMuted.g, COLORS.slateMuted.b);
  doc.text("Received cargo receipts", 15 + (cardW + cardGap) + 4, cardY + 21);

  // CARD 3: Total Dispatched Cargo (Outflow)
  doc.setFillColor(254, 243, 199); // Amber tint
  doc.rect(15 + (cardW + cardGap) * 2, cardY, cardW, cardH, "F");
  doc.setDrawColor(253, 230, 138);
  doc.rect(15 + (cardW + cardGap) * 2, cardY, cardW, cardH, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9); // Amber text
  doc.text("Total Dispatched Outflow (-)", 15 + (cardW + cardGap) * 2 + 4, cardY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(180, 83, 9);
  doc.text(`-${grandTotalSold.toLocaleString()} pkgs`, 15 + (cardW + cardGap) * 2 + 4, cardY + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.slateMuted.r, COLORS.slateMuted.g, COLORS.slateMuted.b);
  doc.text("Sold volume dispatches", 15 + (cardW + cardGap) * 2 + 4, cardY + 21);

  // CARD 4: Closing Balance (Ending Stock)
  doc.setFillColor(COLORS.emeraldBg.r, COLORS.emeraldBg.g, COLORS.emeraldBg.b);
  doc.rect(15 + (cardW + cardGap) * 3, cardY, cardW, cardH, "F");
  doc.setDrawColor(COLORS.emeraldLight.r, COLORS.emeraldLight.g, COLORS.emeraldLight.b);
  doc.rect(15 + (cardW + cardGap) * 3, cardY, cardW, cardH, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.text("Closing Book/Physical Stock", 15 + (cardW + cardGap) * 3 + 4, cardY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.text(`${grandTotalAvailable.toLocaleString()} pkgs`, 15 + (cardW + cardGap) * 3 + 4, cardY + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.slateMuted.r, COLORS.slateMuted.g, COLORS.slateMuted.b);
  doc.text("Closing period summary", 15 + (cardW + cardGap) * 3 + 4, cardY + 21);

  // Explanatory Guidelines / Terms
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.text("COMPLIANCE & COLD STORAGE AUDIT PROCEDURE", 15, 140);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.charcoalText.r, COLORS.charcoalText.g, COLORS.charcoalText.b);
  
  const textSOP = [
    "1. PHYSICAL COUNT CHECKS: All storekeepers are assigned to coldrooms and are bound to log daily inventory physical packages. It must be input into the",
    "   handheld smartphone tablet app before 17:00 KSA. Any variance in pallet counts or packages must be accompanied by remarks in the notes box.",
    "2. BOOK VS. PHYSICAL BALANCING: Closing Stock is determined dynamically: (Opening Morning + Cargo Inflow) - Volume Dispatched Outflow.",
    "   The resulting discrepancy calculation is displayed automatically in the Daily Ledger detail. Any value below zero constitutes commercial stock shrinkage.",
    "3. COLD CHAIN LOGISTICS CONTROL: M. A. Sharbatly Co. enforces a strict -18°C / +4°C cold preservation protocol depending on fruit categories.",
    "   Inventory reports are synced via encrypted API and exported live to both CSV, Microsoft Excel and Corporate Executive PDF directories."
  ];
  
  let sopY = 145;
  textSOP.forEach((line) => {
    doc.text(line, 15, sopY);
    sopY += 4.5;
  });

  // Stamp / Signatures Box
  doc.setDrawColor(COLORS.borderGray.r, COLORS.borderGray.g, COLORS.borderGray.b);
  doc.setFillColor(COLORS.lightZebra.r, COLORS.lightZebra.g, COLORS.lightZebra.b);
  doc.rect(15, 175, 267, 16, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(COLORS.slateMuted.r, COLORS.slateMuted.g, COLORS.slateMuted.b);
  doc.text("PREPARED BY (STOREKEEPER SIGNATURE & DATE)", 20, 180);
  doc.line(20, 188, 100, 188); // signature line

  doc.text("VERIFIED BY (LOGISTICS AND COLD CHAIN OPERATIONS HEAD)", 120, 180);
  doc.line(120, 188, 200, 188); // signature line

  // Draw an official looking round badge for Sharbatly
  doc.setDrawColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.setLineWidth(0.8);
  doc.circle(245, 183, 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.text("APPROVED", 240, 183.5);
  doc.setFontSize(4);
  doc.setTextColor(COLORS.softGold.r, COLORS.softGold.g, COLORS.softGold.b);
  doc.text("SA CCN NETWORK", 239.5, 186);

  applyFooter(1);

  // ==========================================
  // PAGE 2: TABULAR DAILY LEDGER SHEET (TAB 1)
  // ==========================================
  doc.addPage();
  applyLetterhead("2. Daily Audit Ledger (Calendar View Summary)", 2);

  // Render Table Header
  const tableYStart = 38;
  doc.setFillColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.rect(15, tableYStart, 267, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  
  // Header Columns Mapping
  doc.text("Audit Date Tab", 20, tableYStart + 6);
  doc.text("Active Fruit Products Count", 80, tableYStart + 6);
  doc.text("Total Cargo Inflow (+)", 130, tableYStart + 6);
  doc.text("Total Cargo Outflow (-)", 175, tableYStart + 6);
  doc.text("Closing Stock Balance", 220, tableYStart + 6);
  doc.text("Traffic Margin", 260, tableYStart + 6);

  let curY = tableYStart + 9;
  let pageNumCounter = 2;

  // Render Rows
  sortedDays.forEach((dayKey, index) => {
    // If we exceed printable height, split page
    if (curY > 185) {
      applyFooter(pageNumCounter);
      doc.addPage();
      pageNumCounter++;
      applyLetterhead("2. Daily Audit Ledger (Calendar View Summary Continued)", pageNumCounter);
      
      // Re-draw Table Header
      doc.setFillColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
      doc.rect(15, tableYStart, 267, 9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("Audit Date Tab", 20, tableYStart + 6);
      doc.text("Active Fruit Products Count", 80, tableYStart + 6);
      doc.text("Total Cargo Inflow (+)", 130, tableYStart + 6);
      doc.text("Total Cargo Outflow (-)", 175, tableYStart + 6);
      doc.text("Closing Stock Balance", 220, tableYStart + 6);
      doc.text("Traffic Margin", 260, tableYStart + 6);
      
      curY = tableYStart + 9;
    }

    const dayMeta = dailyMap[dayKey];
    
    // Zebra background
    if (index % 2 === 1) {
      doc.setFillColor(COLORS.lightZebra.r, COLORS.lightZebra.g, COLORS.lightZebra.b);
      doc.rect(15, curY, 267, 7.5, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.charcoalText.r, COLORS.charcoalText.g, COLORS.charcoalText.b);

    // Format local date e.g. "Thu, Jun 18, 2026"
    const displayDate = new Date(dayKey).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    doc.setFont("helvetica", "bold");
    doc.text(displayDate, 20, curY + 5);
    
    doc.setFont("helvetica", "normal");
    doc.text(`${dayMeta.headcount} items recorded`, 80, curY + 5);
    doc.text(`+${dayMeta.incoming.toLocaleString()} pkgs`, 130, curY + 5);
    doc.text(`-${dayMeta.sold.toLocaleString()} pkgs`, 175, curY + 5);
    doc.text(`${dayMeta.available.toLocaleString()} pkgs`, 220, curY + 5);

    // Margin variance calculation
    const dailyDelta = dayMeta.incoming - dayMeta.sold;
    let deltaText = `${dailyDelta >= 0 ? "+" : ""}${dailyDelta.toLocaleString()} pkgs`;
    if (dailyDelta > 0) {
      doc.setTextColor(3, 105, 161); // sky-600
    } else if (dailyDelta < 0) {
      doc.setTextColor(180, 83, 9); // amber-600
    } else {
      doc.setTextColor(COLORS.slateMuted.r, COLORS.slateMuted.g, COLORS.slateMuted.b);
      deltaText = "Balanced (0)";
    }
    doc.text(deltaText, 260, curY + 5);

    // Separator line
    doc.setDrawColor(COLORS.borderGray.r, COLORS.borderGray.g, COLORS.borderGray.b);
    doc.setLineWidth(0.15);
    doc.line(15, curY + 7.5, 282, curY + 7.5);

    curY += 7.5;
  });

  // Total Summary row at the bottom of Daily sheet
  if (curY > 185) {
    applyFooter(pageNumCounter);
    doc.addPage();
    pageNumCounter++;
    applyLetterhead("2. Daily Audit Ledger (Calendar View Summary Continued)", pageNumCounter);
    curY = tableYStart;
  }

  doc.setFillColor(COLORS.emeraldBg.r, COLORS.emeraldBg.g, COLORS.emeraldBg.b);
  doc.rect(15, curY, 267, 8, "F");
  doc.setDrawColor(COLORS.emeraldLight.r, COLORS.emeraldLight.g, COLORS.emeraldLight.b);
  doc.setLineWidth(0.5);
  doc.rect(15, curY, 267, 8, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.text("CONSOLIDATED LEDGER OVERVIEW", 20, curY + 5);
  doc.text(`${sortedDays.length} Working Days`, 80, curY + 5);
  doc.text(`+${grandTotalIncoming.toLocaleString()} pkgs`, 130, curY + 5);
  doc.text(`-${grandTotalSold.toLocaleString()} pkgs`, 175, curY + 5);
  doc.text(`${grandTotalAvailable.toLocaleString()} pkgs`, 220, curY + 5);

  const finalDelta = grandTotalIncoming - grandTotalSold;
  doc.text(`${finalDelta >= 0 ? "+" : ""}${finalDelta.toLocaleString()} net`, 260, curY + 5);

  applyFooter(pageNumCounter);

  // ==========================================
  // PAGE 3: PRODUCT-WISE LEDGER CONSOLIDATION (TAB 2)
  // ==========================================
  doc.addPage();
  pageNumCounter++;
  applyLetterhead("3. Inventory Product Index (Consolidated SKU Metrics)", pageNumCounter);

  // Prepare table headers
  const skuTableY = 40;
  doc.setFillColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.rect(15, skuTableY, 267, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  
  doc.text("Fruit Category", 20, skuTableY + 6);
  doc.text("Specification / Variety / Size", 60, skuTableY + 6);
  doc.text("Coldroom Room", 125, skuTableY + 6);
  doc.text("Opening Stock", 155, skuTableY + 6);
  doc.text("Incoming (Month)", 185, skuTableY + 6);
  doc.text("Dispatched (Month)", 217, skuTableY + 6);
  doc.text("Closing Inventory (Final)", 250, skuTableY + 6);

  let skuY = skuTableY + 9;
  const sortedSkus = Object.values(productPivot).sort((a,b) => {
    const catComp = a.category.localeCompare(b.category);
    if (catComp !== 0) return catComp;
    return a.variety.localeCompare(b.variety);
  });

  sortedSkus.forEach((sku, index) => {
    // Overflow handler
    if (skuY > 185) {
      applyFooter(pageNumCounter);
      doc.addPage();
      pageNumCounter++;
      applyLetterhead("3. Inventory Product Index (Consolidated SKU Metrics Continued)", pageNumCounter);

      doc.setFillColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
      doc.rect(15, skuTableY, 267, 9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("Fruit Category", 20, skuTableY + 6);
      doc.text("Specification / Variety / Size", 60, skuTableY + 6);
      doc.text("Coldroom Room", 125, skuTableY + 6);
      doc.text("Opening Stock", 155, skuTableY + 6);
      doc.text("Incoming (Month)", 185, skuTableY + 6);
      doc.text("Dispatched (Month)", 217, skuTableY + 6);
      doc.text("Closing Inventory (Final)", 250, skuTableY + 6);

      skuY = skuTableY + 9;
    }

    // Zebra rows
    if (index % 2 === 1) {
      doc.setFillColor(COLORS.lightZebra.r, COLORS.lightZebra.g, COLORS.lightZebra.b);
      doc.rect(15, skuY, 267, 7, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.charcoalText.r, COLORS.charcoalText.g, COLORS.charcoalText.b);

    // Print values
    doc.setFont("helvetica", "bold");
    doc.text(sku.category, 20, skuY + 4.5);
    
    doc.setFont("helvetica", "normal");
    doc.text(`${sku.variety} (${sku.size})`, 60, skuY + 4.5);
    doc.text(sku.location || "N/A", 125, skuY + 4.5);
    doc.text(sku.openingStock.toLocaleString(), 155, skuY + 4.5);
    doc.text(`+${sku.incoming.toLocaleString()}`, 185, skuY + 4.5);
    doc.text(`-${sku.sold.toLocaleString()}`, 217, skuY + 4.5);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
    doc.text(`${sku.available.toLocaleString()} pkgs`, 250, skuY + 4.5);
    doc.setTextColor(COLORS.charcoalText.r, COLORS.charcoalText.g, COLORS.charcoalText.b);

    // Border line separating rows
    doc.setDrawColor(COLORS.borderGray.r, COLORS.borderGray.g, COLORS.borderGray.b);
    doc.setLineWidth(0.15);
    doc.line(15, skuY + 7, 282, skuY + 7);

    skuY += 7;
  });

  // Footer / Final summaries row for Product View
  if (skuY > 185) {
    applyFooter(pageNumCounter);
    doc.addPage();
    pageNumCounter++;
    applyLetterhead("3. Inventory Product Index (Consolidated SKU Metrics Continued)", pageNumCounter);
    skuY = skuTableY;
  }

  doc.setFillColor(COLORS.emeraldBg.r, COLORS.emeraldBg.g, COLORS.emeraldBg.b);
  doc.rect(15, skuY, 267, 8, "F");
  doc.setDrawColor(COLORS.emeraldLight.r, COLORS.emeraldLight.g, COLORS.emeraldLight.b);
  doc.setLineWidth(0.5);
  doc.rect(15, skuY, 267, 8, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.emeraldForest.r, COLORS.emeraldForest.g, COLORS.emeraldForest.b);
  doc.text("TOTAL SKU PILE QUANTITY", 20, skuY + 5);
  doc.text(`${sortedSkus.length} Unique SKUs In Period`, 60, skuY + 5);
  doc.text("-", 125, skuY + 5);
  doc.text(grandTotalOpening.toLocaleString(), 155, skuY + 5);
  doc.text(`+${grandTotalIncoming.toLocaleString()}`, 185, skuY + 5);
  doc.text(`-${grandTotalSold.toLocaleString()}`, 217, skuY + 5);
  doc.text(`${grandTotalAvailable.toLocaleString()} closing pkgs`, 250, skuY + 5);

  applyFooter(pageNumCounter);

  // ==========================================
  // FINAL PASS: Replace Total Pages string in footer blocks
  // ==========================================
  const totalPagesCount = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    // Overprinting or putting the actual pages on top of the placeholder string is handled in jsPDF natively 
    // by manually finding the text block and replacing, or rewriting footer variables dynamically.
    // In our case, we can simply edit target page's text box if we save positions, but standard jspdf allows
    // writing the footer using standard string substitution before downloading, or just using jsPDF's target rendering.
    // In modern jspdf, we can replace the layout directly during write, or we can just render normal values if we want to save complexity. 
    // Let's replace the placeholder directly via string stream or simple output text layer.
    // To be perfectly bulletproof and clear, we can just replace the placeholder "{total_pages_count}" with totalPagesCount!
  }

  // To achieve clean pages, we can just use setPage to redraw the exact text on each page:
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.slateMuted.r, COLORS.slateMuted.g, COLORS.slateMuted.b);
    
    // Position of page text: Width 282 - text length
    const pageNumStr = `Page ${i} of ${totalPagesCount}`;
    // Erase area where placeholder was originally written by drawing a small white rect
    doc.setFillColor(255, 255, 255);
    // Draw white bar over the Page X of placeholder region to prevent double text rendering
    doc.rect(240, 197, 42, 5, "F");
    doc.text(pageNumStr, 282 - doc.getTextWidth(pageNumStr), 200);
  }

  // Save the generated document
  doc.save(`Sharbatly_Monthly_Audit_Report_${yearMonth}.pdf`);
}
