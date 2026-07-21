import type { CustomUser } from '../types/User';

export type UserRole = 'IT_ADMIN' | 'SALES_SUPERVISOR' | 'INVENTORY_SUPERVISOR' | 'MANAGER' | 'INVOICE_CLERK' | 'SALESMAN' | 'STOREKEEPER' | 'ADMIN' | 'SALESPERSON' | 'SYSTEM_ADMIN' | 'USER' | 'VIEWER';

export interface UserPermissions {
  [key: string]: boolean;
}

export const getDefaultPermissions = (role: UserRole | string): UserPermissions => {
  const normalizedRole = role ? role.toUpperCase() : '';
  const p: UserPermissions = {
    // Sales permissions
    sales_dashboard: false,
    sales_customers: false,
    sales_orders: false,
    sales_payments: false,
    sales_exportHub: false,
    sales_reports: false,
    sales_customerLedger: false,
    sales_analytics: false,
    sales_invoiceQueue: false,
    sales_history: false,
    
    // Inventory permissions
    inventory_rooms: false,
    inventory_products: false,
    inventory_mobileUi: false,
    inventory_countSheets: false,
    inventory_assignRooms: false,
    inventory_staff: false,
    inventory_settings: false,
    
    // Scanner permissions
    scanner_dashboard: false,
    scanner_tracking: false,
    scanner_reports: false,
    scanner_export: false,
    
    // Main Admin permissions
    admin_users: false,
    admin_roles: false,
    admin_apps: false,
    admin_reports: false,
    admin_settings: false,
    
    // Module-level permissions (for backward compatibility)
    sales: false,
    inventory: false,
    exportHub: false,
    reports: false,
    customerLedger: false,
    analytics: false,
    extensions: false,
    scanner: false,
    settings: false,
    users: false
  };

  if (normalizedRole === 'ADMIN' || normalizedRole === 'IT_ADMIN' || normalizedRole === 'SYSTEM_ADMIN') {
    Object.keys(p).forEach(k => p[k] = true);
  } else if (normalizedRole === 'MANAGER') {
    p.sales = true;
    p.reports = true;
    p.analytics = true;
    p.customerLedger = true;
    p.exportHub = true;
    p.inventory = true;
    
    p.sales_dashboard = true;
    p.sales_reports = true;
    p.sales_analytics = true;
    p.sales_customerLedger = true;
    p.sales_exportHub = true;
  } else if (normalizedRole === 'INVOICE_CLERK') {
    p.sales = true;
    p.exportHub = true;
    p.customerLedger = true;
    
    p.sales_orders = true;
    p.sales_exportHub = true;
    p.sales_customerLedger = true;
    p.sales_invoiceQueue = true;
  } else if (normalizedRole === 'SALES_SUPERVISOR') {
    p.sales = true;
    p.reports = true;
    p.exportHub = true;
    
    p.sales_dashboard = true;
    p.sales_customers = true;
    p.sales_orders = true;
    p.sales_reports = true;
  } else if (normalizedRole === 'SALESMAN' || normalizedRole === 'SALESPERSON') {
    p.sales = true;
    
    p.sales_dashboard = true;
    p.sales_customers = true;
    p.sales_orders = true;
    p.sales_payments = true;
  } else if (normalizedRole === 'INVENTORY_SUPERVISOR' || normalizedRole === 'STOREKEEPER') {
    p.inventory = true;
    p.scanner = true;
  }

  return p;
};

export const hasAccess = (user: CustomUser | null | any, permissionKey: string): boolean => {
  if (!user) return false;
  const perms = user.permissions || getDefaultPermissions(user.role || '');
  
  // Check for flat permission key (new format)
  if (permissionKey.includes('_')) {
    return !!perms[permissionKey];
  }
  
  // Backward compatibility: map old module-level keys to new flat keys
  const moduleToFlatMap: Record<string, string> = {
    'sales': 'sales_dashboard',
    'inventory': 'inventory_products',
    'exportHub': 'sales_exportHub',
    'reports': 'sales_reports',
    'customerLedger': 'sales_customerLedger',
    'analytics': 'sales_analytics',
    'extensions': 'settings',
    'scanner': 'scanner_dashboard',
    'settings': 'admin_settings',
    'users': 'admin_users'
  };
  
  if (moduleToFlatMap[permissionKey]) {
    return !!perms[moduleToFlatMap[permissionKey]];
  }
  
  // Backward compatibility: map old salesTabs keys to new flat keys
  const salesTabToFlatMap: Record<string, string> = {
    'dashboard': 'sales_dashboard',
    'customers': 'sales_customers',
    'orders': 'sales_orders',
    'payments': 'sales_payments',
    'reports': 'sales_reports',
    'exportHub': 'sales_exportHub',
    'customerLedger': 'sales_customerLedger',
    'analytics': 'sales_analytics',
    'history': 'sales_history',
    'invoiceQueue': 'sales_invoiceQueue'
  };
  
  if (salesTabToFlatMap[permissionKey]) {
    return !!perms[salesTabToFlatMap[permissionKey]];
  }
  
  // Default: check the key directly
  return !!perms[permissionKey];
};
