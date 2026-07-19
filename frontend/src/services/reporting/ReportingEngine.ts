import { ref, get, query, orderByChild, startAt, endAt } from 'firebase/database';
import { database } from '../../lib/firebase';
import { ledgerService } from '../ledger';
import type { Order, PaymentHistoryItem, Customer, Product, CustomerLedgerEntry } from '../../types/SalesmanAdmin';
import type { MaterialDocument } from '../inventory';

export type ReportCategory = 'Sales' | 'Inventory' | 'Management';

export interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  room?: string;
  salesman?: string;
  supervisor?: string;
  customer?: string;
  product?: string;
}

export class ReportingEngine {
  
  // ==========================================
  // SALES REPORTS
  // ==========================================

  async getCustomerLedger(filters: ReportFilter) {
    const custSnap = await get(ref(database, 'customers'));
    const ledgersSnap = await get(ref(database, 'customer_ledgers'));
    
    let customers: Customer[] = custSnap.exists() ? Object.values(custSnap.val()) : [];
    const ledgers = ledgersSnap.exists() ? ledgersSnap.val() : {};

    // Apply ledger dynamically to get outstanding balances
    customers = ledgerService.applyDynamicBalances(customers, ledgers);

    if (filters.customer && filters.customer !== 'All') {
      customers = customers.filter(c => c.id === filters.customer || c.name === filters.customer);
    }

    // Flatten ledger entries for the report
    const reportData: any[] = [];
    for (const c of customers) {
      const cLedger = ledgers[c.id] || {};
      const entries: CustomerLedgerEntry[] = Object.values(cLedger);
      
      if (entries.length === 0) {
        reportData.push({
          CustomerID: c.id,
          CustomerName: c.name,
          Date: '-',
          Type: 'Initial Balance',
          Reference: '-',
          Amount: c.openingBalance || 0,
          RunningBalance: c.openingBalance || 0,
          Salesman: c.assignedTo || '-',
        });
      } else {
        entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Filter by date if needed
        const filteredEntries = entries.filter(e => {
          if (filters.dateFrom && e.date < filters.dateFrom) return false;
          if (filters.dateTo && e.date > filters.dateTo) return false;
          return true;
        });

        filteredEntries.forEach(e => {
          reportData.push({
            CustomerID: c.id,
            CustomerName: c.name,
            Date: e.date,
            Type: e.type,
            Reference: e.referenceId || '-',
            Amount: e.amount,
            RunningBalance: e.runningBalance,
            Salesman: c.assignedTo || '-',
          });
        });
      }
    }
    
    return reportData;
  }

  async getOutstanding(filters: ReportFilter) {
    const custSnap = await get(ref(database, 'customers'));
    const ledgersSnap = await get(ref(database, 'customer_ledgers'));
    
    let customers: Customer[] = custSnap.exists() ? Object.values(custSnap.val()) : [];
    const ledgers = ledgersSnap.exists() ? ledgersSnap.val() : {};

    customers = ledgerService.applyDynamicBalances(customers, ledgers);

    if (filters.salesman && filters.salesman !== 'All') {
      customers = customers.filter(c => c.assignedTo === filters.salesman);
    }
    if (filters.customer && filters.customer !== 'All') {
      customers = customers.filter(c => c.id === filters.customer);
    }

    const reportData = customers
      .filter(c => c.outstandingBalance > 0)
      .map(c => ({
        CustomerID: c.id,
        CustomerName: c.name,
        Salesman: c.assignedTo || '-',
        CreditLimit: c.creditLimit || 0,
        OutstandingBalance: c.outstandingBalance,
        AvailableCredit: (c.creditLimit || 0) - c.outstandingBalance,
        Status: c.outstandingBalance >= (c.creditLimit || 0) ? 'Credit Exceeded' : 'Good Standing'
      }))
      .sort((a, b) => b.OutstandingBalance - a.OutstandingBalance);

    return reportData;
  }

  async getCollections(filters: ReportFilter) {
        let paySnapRef: any = ref(database, 'sales_payments');
    if (filters.dateFrom && filters.dateTo) {
      paySnapRef = query(ref(database, 'sales_payments'), orderByChild('date'), startAt(filters.dateFrom), endAt(filters.dateTo));
    } else if (filters.dateFrom) {
      paySnapRef = query(ref(database, 'sales_payments'), orderByChild('date'), startAt(filters.dateFrom));
    } else if (filters.dateTo) {
      paySnapRef = query(ref(database, 'sales_payments'), orderByChild('date'), endAt(filters.dateTo));
    }
    const paySnap = await get(paySnapRef);
    let payments: PaymentHistoryItem[] = paySnap.exists() ? Object.values(paySnap.val()) : [];

    if (filters.dateFrom) payments = payments.filter(p => p.date >= filters.dateFrom!);
    if (filters.dateTo) payments = payments.filter(p => p.date <= filters.dateTo!);
    if (filters.salesman && filters.salesman !== 'All') payments = payments.filter(p => p.salesmanId === filters.salesman);
    if (filters.customer && filters.customer !== 'All') payments = payments.filter(p => p.customerId === filters.customer);

    payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return payments.map(p => ({
      PaymentID: p.id,
      Date: p.date,
      Customer: p.customerName,
      SalesmanID: p.salesmanId,
      Amount: p.amount,
      Method: p.method,
      Reference: p.referenceNumber || '-',
      Status: p.status
    }));
  }

  // ==========================================
  // INVENTORY REPORTS
  // ==========================================

  async getMovementHistory(filters: ReportFilter) {
        let mdocSnapRef: any = ref(database, 'material_documents');
    if (filters.dateFrom && filters.dateTo) {
      mdocSnapRef = query(ref(database, 'material_documents'), orderByChild('date'), startAt(filters.dateFrom), endAt(filters.dateTo));
    } else if (filters.dateFrom) {
      mdocSnapRef = query(ref(database, 'material_documents'), orderByChild('date'), startAt(filters.dateFrom));
    } else if (filters.dateTo) {
      mdocSnapRef = query(ref(database, 'material_documents'), orderByChild('date'), endAt(filters.dateTo));
    }
    const mdocSnap = await get(mdocSnapRef);
    let docs: MaterialDocument[] = mdocSnap.exists() ? Object.values(mdocSnap.val()) : [];

    if (filters.dateFrom) docs = docs.filter(d => d.date >= filters.dateFrom!);
    if (filters.dateTo) docs = docs.filter(d => d.date <= filters.dateTo!);
    if (filters.product && filters.product !== 'All') docs = docs.filter(d => d.items.some(i => i.materialId === filters.product || i.materialDesc.includes(filters.product!)));

    docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const reportData: any[] = [];
    docs.forEach(d => {
      d.items.forEach(item => {
        if (filters.product && filters.product !== 'All' && item.materialId !== filters.product && !item.materialDesc.includes(filters.product)) {
          return; // skip if doesn't match filter
        }
        reportData.push({
          DocID: d.id,
          Date: d.date,
          Type: d.type,
          Material: item.materialId,
          Description: item.materialDesc,
          Quantity: item.quantity,
          UoM: item.uom,
          Batch: item.batch || '-',
          FromSLoc: item.fromSloc || '-',
          ToSLoc: item.toSloc || '-',
          CreatedBy: d.createdBy
        });
      });
    });

    return reportData;
  }

  async getDamage(filters: ReportFilter) {
    const docs = await this.getMovementHistory(filters);
    // Filter to just docs where type is 'Damage' or 'Scrap' or 'Return' (assuming Damage type exists)
    return docs.filter((d: any) => d.Type === 'Damage' || d.Type === 'Scrap');
  }

  async getTransfers(filters: ReportFilter) {
    const docs = await this.getMovementHistory(filters);
    return docs.filter((d: any) => d.Type === 'Transfer' || d.Type === 'Dispatch');
  }

  async getDailyCount(filters: ReportFilter) {
    const invSnap = await get(ref(database, 'inventory'));
    const inventory = invSnap.exists() ? Object.values(invSnap.val()) : [];
    
    // Group by material
    const reportData = inventory.map((i: any) => ({
      Material: i.id || i.materialId,
      Description: i.description || i.materialDesc,
      SLoc: i.sloc || i.plant,
      Batch: i.batch || '-',
      Quantity: i.quantity,
      UoM: i.uom,
      Status: i.status || 'Unrestricted'
    }));
    return reportData;
  }

  async getShipments(filters: ReportFilter) {
    // Return Dispatched/Delivered sales orders
        let ordSnapRef: any = ref(database, 'sales_orders');
    if (filters.dateFrom && filters.dateTo) {
      ordSnapRef = query(ref(database, 'sales_orders'), orderByChild('date'), startAt(filters.dateFrom), endAt(filters.dateTo));
    } else if (filters.dateFrom) {
      ordSnapRef = query(ref(database, 'sales_orders'), orderByChild('date'), startAt(filters.dateFrom));
    } else if (filters.dateTo) {
      ordSnapRef = query(ref(database, 'sales_orders'), orderByChild('date'), endAt(filters.dateTo));
    }
    const ordSnap = await get(ordSnapRef);
    let orders: Order[] = ordSnap.exists() ? Object.values(ordSnap.val()) : [];

    orders = orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered');

    if (filters.dateFrom) orders = orders.filter(o => o.date >= filters.dateFrom!);
    if (filters.dateTo) orders = orders.filter(o => o.date <= filters.dateTo!);
    if (filters.salesman && filters.salesman !== 'All') orders = orders.filter(o => o.salesmanId === filters.salesman);

    orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return orders.map(o => ({
      OrderID: o.id,
      Date: o.date,
      Customer: o.customerName,
      SalesmanID: o.salesmanId,
      Status: o.status,
      TotalAmount: o.totalAmount,
      ItemsCount: o.items?.length || 0,
      PaymentStatus: o.paymentStatus || 'Unpaid'
    }));
  }

  // ==========================================
  // MANAGEMENT REPORTS
  // ==========================================

  async getProfit(filters: ReportFilter) {
        let ordersSnapRef: any = ref(database, 'sales_orders');
    if (filters.dateFrom && filters.dateTo) {
      ordersSnapRef = query(ref(database, 'sales_orders'), orderByChild('date'), startAt(filters.dateFrom), endAt(filters.dateTo));
    } else if (filters.dateFrom) {
      ordersSnapRef = query(ref(database, 'sales_orders'), orderByChild('date'), startAt(filters.dateFrom));
    } else if (filters.dateTo) {
      ordersSnapRef = query(ref(database, 'sales_orders'), orderByChild('date'), endAt(filters.dateTo));
    }
    const ordersSnap = await get(ordersSnapRef);
    let orders: Order[] = ordersSnap.exists() ? Object.values(ordersSnap.val()) : [];

    // Assuming cost prices aren't strictly maintained in this subset, we'll approximate a margin report or use total revenue
    // Profit = Delivered orders total
    orders = orders.filter(o => o.status === 'Delivered' || o.status === 'Approved');

    if (filters.dateFrom) orders = orders.filter(o => o.date >= filters.dateFrom!);
    if (filters.dateTo) orders = orders.filter(o => o.date <= filters.dateTo!);
    if (filters.salesman && filters.salesman !== 'All') orders = orders.filter(o => o.salesmanId === filters.salesman);

    return orders.map(o => ({
      OrderID: o.id,
      Date: o.date,
      Customer: o.customerName,
      SalesmanID: o.salesmanId,
      Revenue: o.totalAmount,
      Status: o.status
    }));
  }

  async getActivity(filters: ReportFilter) {
    // Activity combines order count and payment count per salesman
        let ordersSnapRef: any = ref(database, 'sales_orders');
    if (filters.dateFrom && filters.dateTo) {
      ordersSnapRef = query(ref(database, 'sales_orders'), orderByChild('date'), startAt(filters.dateFrom), endAt(filters.dateTo));
    } else if (filters.dateFrom) {
      ordersSnapRef = query(ref(database, 'sales_orders'), orderByChild('date'), startAt(filters.dateFrom));
    } else if (filters.dateTo) {
      ordersSnapRef = query(ref(database, 'sales_orders'), orderByChild('date'), endAt(filters.dateTo));
    }
    const ordersSnap = await get(ordersSnapRef);
        let paymentsSnapRef: any = ref(database, 'sales_payments');
    if (filters.dateFrom && filters.dateTo) {
      paymentsSnapRef = query(ref(database, 'sales_payments'), orderByChild('date'), startAt(filters.dateFrom), endAt(filters.dateTo));
    } else if (filters.dateFrom) {
      paymentsSnapRef = query(ref(database, 'sales_payments'), orderByChild('date'), startAt(filters.dateFrom));
    } else if (filters.dateTo) {
      paymentsSnapRef = query(ref(database, 'sales_payments'), orderByChild('date'), endAt(filters.dateTo));
    }
    const paymentsSnap = await get(paymentsSnapRef);
    
    let orders: Order[] = ordersSnap.exists() ? Object.values(ordersSnap.val()) : [];
    let payments: PaymentHistoryItem[] = paymentsSnap.exists() ? Object.values(paymentsSnap.val()) : [];

    if (filters.dateFrom) {
      orders = orders.filter(o => o.date >= filters.dateFrom!);
      payments = payments.filter(p => p.date >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      orders = orders.filter(o => o.date <= filters.dateTo!);
      payments = payments.filter(p => p.date <= filters.dateTo!);
    }

    const activityBySalesman: Record<string, any> = {};

    orders.forEach(o => {
      if (!activityBySalesman[o.salesmanId]) activityBySalesman[o.salesmanId] = { Salesman: o.salesmanId, OrdersCreated: 0, PaymentsCollected: 0, Revenue: 0 };
      activityBySalesman[o.salesmanId].OrdersCreated++;
      activityBySalesman[o.salesmanId].Revenue += Number(o.totalAmount || 0);
    });

    payments.forEach(p => {
      if (!activityBySalesman[p.salesmanId]) activityBySalesman[p.salesmanId] = { Salesman: p.salesmanId, OrdersCreated: 0, PaymentsCollected: 0, Revenue: 0 };
      activityBySalesman[p.salesmanId].PaymentsCollected++;
    });

    return Object.values(activityBySalesman);
  }
}

export const reportingEngine = new ReportingEngine();
