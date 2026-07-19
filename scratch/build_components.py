import os
import re

out_dir = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\scratch\split"
dest_dir = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\components"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

imports = """import React, { useState, useMemo } from 'react';
import { 
  Users, Package, TrendingUp, ShoppingBag, Plus, Edit2, Trash2, Check, X, FileSpreadsheet, 
  MapPin, Phone, AlertCircle, Database, RefreshCw, BarChart2, ShieldAlert, DollarSign, ArrowRight,
  Printer, FileText, FileDown, Sun, Moon, Eye, Download, LogOut, Globe, Send, ShoppingCart, UserIcon, UploadCloud
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Legend
} from 'recharts';
import { useSalesmanAdmin } from '../SalesmanAdminContext';
import { fbService } from '../services/firebaseService';
import { exportDailySalesToExcel, exportToCSV } from '../../../utils/exportExcel';
import { User, Product, Customer, Order, PaymentHistoryItem, SyncLog } from '../../../types/SalesmanAdmin';
"""

# For dashboard we need to inject the useMemos
dashboard_extras = """
  const { orders, customers, users } = useSalesmanAdmin();
  
  const kpis = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'Cancelled');
    const revenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderCount = orders.length;
    const clientCount = customers.length;
    const salesmanCount = users.filter(u => u.role === 'SALESPERSON').length;
    return { revenue, orderCount, clientCount, salesmanCount };
  }, [orders, customers, users]);

  const chartsData = useMemo(() => {
    const dailyMap: { [date: string]: number } = {};
    orders.filter(o => o.status !== 'Cancelled').forEach(o => {
      dailyMap[o.date] = (dailyMap[o.date] || 0) + o.totalAmount;
    });
    const dailyTrend = Object.entries(dailyMap)
      .map(([date, revenue]) => ({ date, Sales: parseFloat(revenue.toFixed(2)) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const salesmanMap: { [name: string]: number } = {};
    orders.filter(o => o.status !== 'Cancelled').forEach(o => {
      salesmanMap[o.salespersonName] = (salesmanMap[o.salespersonName] || 0) + o.totalAmount;
    });
    const salesmanPerformance = Object.entries(salesmanMap)
      .map(([name, revenue]) => ({ name, Sales: parseFloat(revenue.toFixed(2)) }))
      .sort((a, b) => b.Sales - a.Sales)
      .slice(0, 5);

    return { dailyTrend, salesmanPerformance };
  }, [orders]);
  
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
"""

files = ["dashboard.tsx", "users.tsx", "inventory.tsx", "customers.tsx", "orders.tsx", "finance.tsx", "sheets.tsx"]

for f in files:
    comp_name = f.replace(".tsx", "").capitalize()
    if comp_name == "Inventory": comp_name = "Products"
    if comp_name == "Finance": comp_name = "Payments"
    if comp_name == "Sheets": comp_name = "Reports"
    
    with open(os.path.join(out_dir, f), 'r', encoding='utf-8') as src:
        content = src.read()
        
    content = re.sub(r"^\{activeSubTab === '[a-z]+' && \(\s*", "", content)
    content = re.sub(r"\)\}\s*$", "", content)
    
    res = f"{imports}\n\nexport default function {comp_name}() {{\n"
    if comp_name == "Dashboard":
        res += dashboard_extras
    else:
        res += "  const { users, products, customers, orders, payments } = useSalesmanAdmin();\n"
        
    res += f"  return (\n    {content}\n  );\n}}\n"
    
    with open(os.path.join(dest_dir, f"{comp_name}.tsx"), 'w', encoding='utf-8') as dest:
        dest.write(res)

print("Component generation complete.")
