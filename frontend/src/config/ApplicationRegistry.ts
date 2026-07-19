import { Shield, Smartphone, Warehouse, Activity, FileText, Puzzle, Settings, Monitor, Bell, StickyNote, FileSignature, Scan } from 'lucide-react';

export interface Application {
  id: string;
  displayName: string;
  icon: any;
  route: string;
  applicationAccessKey: string;
  category: 'admin' | 'sales' | 'inventory' | 'scanner' | 'productivity' | 'extensions';
  visible: boolean;
  description?: string;
  externalUrl?: string;
}

export const APPLICATIONS: Application[] = [
  {
    id: 'job_portal',
    displayName: 'Job Portal',
    icon: Puzzle,
    route: 'job_portal',
    applicationAccessKey: 'jobPortal',
    category: 'extensions',
    visible: true,
    description: 'Recruitment and Job Application Portal',
    externalUrl: 'https://automation-suit-jobortal.web.app'
  },
  {
    id: 'inventory_mobile',
    displayName: 'Inventory Mobile',
    icon: Smartphone,
    route: 'inventory_mobile',
    applicationAccessKey: 'inventoryMobile',
    category: 'inventory',
    visible: false,
    description: 'Mobile interface for inventory stocktaking',
    externalUrl: 'https://automation-suit-inventory.web.app'
  },
  {
    id: 'main_admin',
    displayName: 'Main Admin Panel',
    icon: Shield,
    route: 'admin',
    applicationAccessKey: 'mainAdmin',
    category: 'admin',
    visible: true,
    description: 'Central control center for system administration'
  },
  {
    id: 'sales_admin',
    displayName: 'Sales Admin',
    icon: Smartphone,
    route: 'salesman_admin',
    applicationAccessKey: 'salesAdmin',
    category: 'sales',
    visible: true,
    description: 'Sales management and administration'
  },
  {
    id: 'inventory_admin',
    displayName: 'Inventory Admin',
    icon: Warehouse,
    route: 'inventory_app',
    applicationAccessKey: 'inventoryAdmin',
    category: 'inventory',
    visible: true,
    description: 'Inventory management and control'
  },
  {
    id: 'reports',
    displayName: 'Report Engine',
    icon: FileText,
    route: 'reports',
    applicationAccessKey: 'reports',
    category: 'productivity',
    visible: true,
    description: 'Generate and manage reports'
  },
  {
    id: 'po_invoice',
    displayName: 'PO & Invoices',
    icon: FileText,
    route: 'invoices',
    applicationAccessKey: 'poInvoice',
    category: 'productivity',
    visible: true,
    description: 'Process purchase orders and invoices'
  },
  {
    id: 'request_forms',
    displayName: 'Request Forms',
    icon: FileSignature,
    route: 'request_forms',
    applicationAccessKey: 'requestForms',
    category: 'productivity',
    visible: true,
    description: 'Create and manage request forms'
  },
  {
    id: 'reminders',
    displayName: 'Reminders',
    icon: Bell,
    route: 'reminders',
    applicationAccessKey: 'reminders',
    category: 'productivity',
    visible: true,
    description: 'Task reminders and notifications'
  },
  {
    id: 'notes',
    displayName: 'Notes',
    icon: StickyNote,
    route: 'notes',
    applicationAccessKey: 'notes',
    category: 'productivity',
    visible: true,
    description: 'Important notes and memos'
  },
  {
    id: 'app_hub',
    displayName: 'Apps & Extensions',
    icon: Puzzle,
    route: 'app_hub',
    applicationAccessKey: 'appHub',
    category: 'extensions',
    visible: true,
    description: 'Application hub and extensions'
  },
  {
    id: 'central_reports',
    displayName: 'Central Reports',
    icon: FileText,
    route: 'central_reports',
    applicationAccessKey: 'centralReports',
    category: 'sales',
    visible: false,
    description: 'Centralized reporting hub'
  },
  {
    id: 'profile',
    displayName: 'Profile Settings',
    icon: Settings,
    route: 'profile',
    applicationAccessKey: 'profile',
    category: 'productivity',
    visible: true,
    description: 'User profile and settings'
  },
  // Hidden applications (moved to Apps & Extensions page)
  {
    id: 'salesman_mobile',
    displayName: 'Salesman Mobile',
    icon: Smartphone,
    route: 'salesman_admin',
    applicationAccessKey: 'salesmanMobile',
    category: 'sales',
    visible: false,
    description: 'Mobile sales application for salesmen'
  },
  {
    id: 'storekeeper_mobile',
    displayName: 'Storekeeper Mobile',
    icon: Smartphone,
    route: 'inventory_app',
    applicationAccessKey: 'storekeeperMobile',
    category: 'inventory',
    visible: false,
    description: 'Mobile inventory management for storekeepers'
  },
  {
    id: 'scanner',
    displayName: 'Scanner',
    icon: Activity,
    route: 'scanner_tracking',
    applicationAccessKey: 'scanner',
    category: 'scanner',
    visible: false,
    description: 'Barcode scanner and tracking'
  },
  {
    id: 'scanner_admin',
    displayName: 'Scanner Admin',
    icon: Scan,
    route: 'scanner_tracking',
    applicationAccessKey: 'scannerAdmin',
    category: 'scanner',
    visible: false,
    description: 'Scanner administration and management'
  },
  {
    id: 'scanner_mobile',
    displayName: 'Scanner Mobile',
    icon: Scan,
    route: 'scanner_tracking',
    applicationAccessKey: 'scannerMobile',
    category: 'scanner',
    visible: false,
    description: 'Mobile scanner application'
  },
  {
    id: 'export_hub',
    displayName: 'Export Hub',
    icon: FileText,
    route: 'reports',
    applicationAccessKey: 'exportHub',
    category: 'productivity',
    visible: false,
    description: 'Export data and reports'
  },
  {
    id: 'inventory_app',
    displayName: 'Inventory',
    icon: Warehouse,
    route: 'inventory_app',
    applicationAccessKey: 'inventoryApp',
    category: 'inventory',
    visible: false,
    description: 'Inventory application'
  },
  {
    id: 'extensions',
    displayName: 'Extensions',
    icon: Puzzle,
    route: 'app_hub',
    applicationAccessKey: 'extensions',
    category: 'extensions',
    visible: false,
    description: 'System extensions'
  },
  {
    id: 'python_desktop',
    displayName: 'Python Desktop',
    icon: Monitor,
    route: 'app_hub',
    applicationAccessKey: 'pythonDesktop',
    category: 'extensions',
    visible: false,
    description: 'Python desktop application integration'
  },
  {
    id: 'spreadsheet_workspace',
    displayName: 'Spreadsheet Workspace',
    icon: FileText,
    route: 'reports',
    applicationAccessKey: 'spreadsheetWorkspace',
    category: 'productivity',
    visible: false,
    description: 'Spreadsheet workspace and data analysis'
  },
  {
    id: 'automation_tools',
    displayName: 'Automation Tools',
    icon: Activity,
    route: 'app_hub',
    applicationAccessKey: 'automationTools',
    category: 'extensions',
    visible: false,
    description: 'Automation and workflow tools'
  }
];

// Helper functions
export const getApplicationById = (id: string): Application | undefined => {
  return APPLICATIONS.find(app => app.id === id);
};

export const getApplicationByAccessKey = (accessKey: string): Application | undefined => {
  return APPLICATIONS.find(app => app.applicationAccessKey === accessKey);
};

export const getApplicationsByCategory = (category: Application['category']): Application[] => {
  return APPLICATIONS.filter(app => app.category === category && app.visible);
};

export const getVisibleApplications = (): Application[] => {
  return APPLICATIONS.filter(app => app.visible);
};

export const getApplicationsForUser = (applicationAccess: Record<string, boolean>, isSystemAdmin: boolean = false): Application[] => {
  if (isSystemAdmin) {
    return getVisibleApplications();
  }
  return APPLICATIONS.filter(app => 
    app.visible && applicationAccess[app.applicationAccessKey]
  );
};

export const getApplicationAccessKeys = (): string[] => {
  return APPLICATIONS.map(app => app.applicationAccessKey);
};

export const getDefaultApplicationAccess = (): Record<string, boolean> => {
  const access: Record<string, boolean> = {};
  APPLICATIONS.forEach(app => {
    access[app.applicationAccessKey] = false;
  });
  return access;
};
