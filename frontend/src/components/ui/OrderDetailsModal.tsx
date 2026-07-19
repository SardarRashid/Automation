import React from 'react';
import { X, Printer, FileText, Download, Copy, PackageCheck, Receipt, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface OrderDetailsModalProps {
  order: any;
  onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const subtotal = order.totalAmount || 0;
  const discount = order.discount || 0;
  const tax = order.tax || 0;
  const grandTotal = subtotal - discount + tax;
  const paid = order.amountPaid || 0;
  const remaining = grandTotal - paid;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet((order.items || []).map((item: any) => ({
      'SKU': item.productId,
      'Product': item.productName,
      'Quantity': item.qty,
      'Unit Price': Number(item.price).toFixed(2),
      'Total': (item.qty * item.price).toFixed(2)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, `Invoice_${order.orderNumber || order.id}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Invoice', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Order No: ${order.orderNumber || order.id.substring(0,8)}`, 14, 30);
    doc.text(`Customer: ${order.customerName}`, 14, 35);
    doc.text(`Date: ${order.date} ${order.time}`, 14, 40);
    
    const tableData = (order.items || []).map((item: any) => [
      item.code || item.productId.substring(0,8),
      item.productName,
      item.qty,
      Number(item.price).toFixed(2),
      (item.qty * item.price).toFixed(2)
    ]);
    
    (doc as any).autoTable({
      startY: 50,
      head: [['SKU', 'Product', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.text(`Grand Total: ${grandTotal.toFixed(2)} SAR`, 14, finalY + 10);
    
    doc.save(`Invoice_${order.orderNumber || order.id}.pdf`);
  };

  const handleCustomerOrderSheet = () => {
    const doc = new jsPDF();
    
    // Add Logo
    const logoImg = new Image();
    logoImg.src = '/logo.png';
    doc.addImage(logoImg, 'PNG', 14, 10, 40, 20);
    
    doc.setFontSize(16);
    doc.text('Mohammed Abdallah Sharbatly Co. Ltd.', 60, 20);
    doc.setFontSize(12);
    doc.text('Customer Order Sheet', 60, 28);
    
    doc.setFontSize(10);
    doc.text(`Order No: ${order.orderNumber || order.id.substring(0,8)}`, 14, 45);
    doc.text(`Customer: ${order.customerName}`, 14, 50);
    doc.text(`Salesman: ${order.salespersonName}`, 14, 55);
    doc.text(`Date: ${order.date}`, 14, 60);
    
    const tableData = (order.items || []).map((item: any) => [
      item.code || item.productId.substring(0,8),
      item.productName,
      item.qty,
      Number(item.price).toFixed(2),
      (item.qty * item.price).toFixed(2)
    ]);
    
    (doc as any).autoTable({
      startY: 65,
      head: [['SKU', 'Product', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87] } // Emerald 700
    });
    
    doc.save(`Customer_Order_Sheet_${order.orderNumber || order.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Order #{order.orderNumber || order.id.substring(0,8)}</h2>
              <p className="text-slate-500 text-sm">Invoice #{order.invoiceNumber || 'N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
          
          {/* Top Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Customer</span>
              <span className="font-bold text-slate-800">{order.customerName}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Date</span>
              <span className="font-bold text-slate-800">{order.date} {order.time}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Salesman</span>
              <span className="font-bold text-slate-800">{order.salespersonName}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
              <div className="flex gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {order.paymentStatus}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.status === 'Delivered' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-slate-500" /> Order Items
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                    <th className="px-6 py-3 text-right">Unit Price</th>
                    <th className="px-6 py-3 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-mono text-slate-500">{item.code || item.productId.substring(0,8)}</td>
                      <td className="px-6 py-3 font-medium text-slate-800">{item.productName}</td>
                      <td className="px-6 py-3 text-slate-500">{item.description || '-'}</td>
                      <td className="px-6 py-3 text-center font-bold text-slate-700">{item.qty}</td>
                      <td className="px-6 py-3 text-right font-mono">{Number(item.price).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">{(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">{subtotal.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-rose-500">
                <span>Discount</span>
                <span className="font-mono">-{discount.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span className="font-mono">+{tax.toFixed(2)} SAR</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-lg text-slate-800">
                <span>Grand Total</span>
                <span className="font-mono">{grandTotal.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-emerald-600 pt-3">
                <span className="font-medium">Paid Amount</span>
                <span className="font-mono font-bold">{paid.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-rose-600 pb-1">
                <span className="font-medium">Remaining Balance</span>
                <span className="font-mono font-bold">{remaining.toFixed(2)} SAR</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(order))} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors">
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg font-medium transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
            <button onClick={handleCustomerOrderSheet} className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors">
              <FileText className="w-4 h-4" /> Customer Order Sheet
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg font-medium transition-colors">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-sm shadow-blue-200 transition-colors">
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
