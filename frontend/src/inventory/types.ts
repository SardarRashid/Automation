export interface CategoryTemplate {
  id: string; // e.g. "apple"
  name: string; // e.g. "Apple"
  varieties: string[]; // e.g. ["Golden Apple", "Green Apple", "Red Apple", "Fuji Apple", "Gala Apple"]
  sizes: string[]; // e.g. ["100", "113", "125", "Standard"]
  subVarieties?: string[]; // e.g. ["Extra Fancy", "Fancy", "Standard"]
  origins?: string[]; // e.g. ["Spain", "USA", "Egypt", "Chile", "South Africa"]
  grades?: string[]; // e.g. ["Extra Fancy", "Class 1", "Class 2"]
  subGrades?: string[]; 
  skus?: string[]; 
}

export interface StoreRoom {
  id: string; // e.g. "store-1"
  name: string; // e.g. "Store 1"
  description?: string;
  allowedCategories?: string[]; // IDs of assigned categories
}

export interface InventoryRecord {
  id?: string;
  date: string; // YYYY-MM-DD
  category: string;
  variety: string;
  size: string;
  location: string; // e.g. Container Number
  arrivalDate: string; // YYYY-MM-DD
  openingStock: number; // Opening stock in morning
  incoming: number; // What came today
  sold: number; // What sold today
  available: number; // Available in store (ending count/physical count)
  notes?: string;
  updatedAt: string;
  // Optional detailed custom options:
  originCountry?: string; // Country of origin, e.g. "SA", "USA", "Egypt", "Chile"
  grade?: string; // Grade, e.g. "Fancy", "Extra Fancy"
  subVariety?: string; // Sub-variety / additional details
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'carry_forward' | 'bulk_add';
  description: string;
  details?: string;
}

export interface Storekeeper {
  id: string;
  name: string;
  email: string;
  pin: string; // Password / PIN to log in
  assignedSection: string; // e.g. "Apple", "Citrus", "All" or comma-separated e.g. "Apple,Banana"
  assignedStoreNum: string; // e.g. "Store 1", "All" or comma-separated e.g. "Store 1,Store 2"
  role: 'supervisor' | 'storekeeper';
  hasMobileAccess?: boolean; // Can use the mobile app
}


