import * as XLSX from 'xlsx';

const getTimestampedFilename = (reportName: string): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `${reportName}_${date}_${time}`;
};

export const exportDailySalesToExcel = (reportDate: string, orders: any[]) => {
  const dailyOrders = orders.filter(o => o.date === reportDate);
  
  if (dailyOrders.length === 0) {
    alert(`No sales data found for ${reportDate}`);
    return;
  }

  const excelData = dailyOrders.map(order => {
    return {
      'Date': order.date,
      'Time': order.time,
      'Order Number': order.id,
      'Salesperson': order.salespersonName,
      'Customer': order.customerName,
      'Items Count': order.items?.length || 0,
      'Total Amount': order.totalAmount,
      'Amount Paid': order.amountPaid,
      'Payment Status': order.paymentStatus,
      'Payment Method': order.paymentMethod || 'N/A',
      'Order Status': order.status
    };
  });

  const totalSales = dailyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCollected = dailyOrders.reduce((sum, o) => sum + o.amountPaid, 0);

  excelData.push({} as any);
  excelData.push({
    'Date': 'SUMMARY',
    'Time': '',
    'Order Number': '',
    'Salesperson': '',
    'Customer': 'Total Orders:',
    'Items Count': dailyOrders.length,
    'Total Amount': totalSales,
    'Amount Paid': totalCollected,
    'Payment Status': '',
    'Payment Method': '',
    'Order Status': ''
  } as any);

  const ws = XLSX.utils.json_to_sheet(excelData);
  
  const wscols = [
    {wch: 12}, {wch: 10}, {wch: 15}, {wch: 20}, {wch: 25}, 
    {wch: 12}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}
  ];
  ws['!cols'] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Sales_${reportDate}`);
  XLSX.writeFile(wb, `${getTimestampedFilename('Daily_Sales_Report')}.xlsx`);
};

export const exportToCSV = (filename: string, data: any[], headers: string[]) => {
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${getTimestampedFilename(filename)}.csv`, { bookType: 'csv' });
};

