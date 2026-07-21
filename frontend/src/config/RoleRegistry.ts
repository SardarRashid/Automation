import { getDefaultApplicationAccess } from './ApplicationRegistry';

export const ROLE_TEMPLATES: Record<string, Record<string, boolean>> = {
  system_admin: {
    // Has full access dynamically evaluated in App.tsx
  },
  it_admin: {
    // Has full access dynamically evaluated in App.tsx
  },
  admin: {
    // General Admin gets access to all standard management apps
    mainAdmin: true,
    salesAdmin: true,
    inventoryAdmin: true,
    reports: true,
    poInvoice: true,
    requestForms: true,
    reminders: true,
    notes: true,
    profile: true,
    appHub: true,
    centralReports: true,
    inventoryApp: true,
    extensions: true,
    pythonDesktop: true,
    salesmanMobile: false,
    scannerAdmin: true,
    scannerMobile: false,
    scanner: true,
    spreadsheetWorkspace: true,
    automationTools: true,
    jobPortal: true
  },
  manager: {
    mainAdmin: false,
    salesAdmin: true,
    inventoryAdmin: true,
    reports: true,
    poInvoice: true,
    requestForms: true,
    reminders: true,
    notes: true,
    profile: true,
    appHub: true,
    centralReports: true,
    inventoryApp: true,
    extensions: false,
    pythonDesktop: false,
    salesmanMobile: false,
    scannerAdmin: true,
    scannerMobile: false,
    scanner: true,
    spreadsheetWorkspace: true,
    automationTools: false,
    jobPortal: false
  },
  supervisor: {
    mainAdmin: false,
    salesAdmin: false,
    inventoryAdmin: true,
    reports: true,
    poInvoice: false,
    requestForms: true,
    reminders: true,
    notes: true,
    profile: true,
    appHub: false,
    centralReports: false,
    inventoryApp: true,
    extensions: false,
    pythonDesktop: false,
    salesmanMobile: false,
    scannerAdmin: false,
    scannerMobile: false,
    scanner: true,
    spreadsheetWorkspace: false,
    automationTools: false,
    jobPortal: false
  },
  salesperson: {
    mainAdmin: false,
    salesAdmin: false,
    inventoryAdmin: false,
    reports: false,
    poInvoice: false,
    requestForms: true,
    reminders: true,
    notes: true,
    profile: true,
    appHub: false,
    centralReports: false,
    inventoryApp: false,
    extensions: false,
    pythonDesktop: false,
    salesmanMobile: true,
    scannerAdmin: false,
    scannerMobile: false,
    scanner: false,
    spreadsheetWorkspace: false,
    automationTools: false,
    jobPortal: false
  },
  storekeeper: {
    mainAdmin: false,
    salesAdmin: false,
    inventoryAdmin: false,
    reports: false,
    poInvoice: false,
    requestForms: true,
    reminders: true,
    notes: true,
    profile: true,
    appHub: false,
    centralReports: false,
    inventoryApp: true,
    extensions: false,
    pythonDesktop: false,
    salesmanMobile: false,
    scannerAdmin: false,
    scannerMobile: true,
    scanner: true,
    spreadsheetWorkspace: false,
    automationTools: false,
    jobPortal: false
  },
  user: {
    // Standard unprivileged user
    mainAdmin: false,
    salesAdmin: false,
    inventoryAdmin: false,
    reports: false,
    poInvoice: false,
    requestForms: true,
    reminders: true,
    notes: true,
    profile: true,
    appHub: false,
    centralReports: false,
    inventoryApp: false,
    extensions: false,
    pythonDesktop: false,
    salesmanMobile: false,
    scannerAdmin: false,
    scannerMobile: false,
    scanner: false,
    spreadsheetWorkspace: false,
    automationTools: false,
    jobPortal: false
  },
  viewer: {
    mainAdmin: false,
    salesAdmin: false,
    inventoryAdmin: false,
    reports: true,
    poInvoice: false,
    requestForms: false,
    reminders: false,
    notes: true,
    profile: true,
    appHub: false,
    centralReports: true,
    inventoryApp: false,
    extensions: false,
    pythonDesktop: false,
    salesmanMobile: false,
    scannerAdmin: false,
    scannerMobile: false,
    scanner: false,
    spreadsheetWorkspace: false,
    automationTools: false,
    jobPortal: false
  }
};

export const getTemplateForRole = (role: string): Record<string, boolean> => {
  const normalizedRole = role.toLowerCase();
  const template = ROLE_TEMPLATES[normalizedRole];
  
  if (!template) {
    return getDefaultApplicationAccess();
  }
  
  // Merge with default access to ensure all keys are present
  return {
    ...getDefaultApplicationAccess(),
    ...template
  };
};
