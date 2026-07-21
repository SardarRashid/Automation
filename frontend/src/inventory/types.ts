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

// --- Lot-based inventory model ---
// Used by services/inventory/index.ts, inventory/services/movementService.ts,
// inventory/services/productService.ts, and the mobile worksheet components.
// These were referenced across the codebase but never declared, which broke
// every import of them (services/inventory/index.ts, InventoryCountWorksheet.tsx,
// stockCountService.ts).

export interface StockLot {
  id: string;
  categoryId: string; // matches CategoryTemplate.name as currently created (e.g. "Apple")
  variety: string;
  size: string;
  originCountry?: string;
  grade?: string;
  subVariety?: string;
  status: 'Pending' | 'Received' | 'Verified' | 'Closed' | 'Expired' | 'Damaged';
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
  lastPalletSize?: number; // units-per-pallet last used when counting this lot, remembered as a default for next time
}

// One row in a pallet-based count: N pallets of X units each.
// A single lot can be counted across several pallet sizes in one session
// (e.g. 5 pallets of 120 + 10 pallets of 100 for the same item).
export interface PalletBatch {
  pallets: number;
  unitsPerPallet: number;
}

export interface Transfer {
  id: string;
  sourceRoomId: string;
  destinationRoomId: string;
  status: 'Pending' | 'In Transit' | 'Completed' | 'Cancelled';
  items?: { stockLotId: string; quantity: number }[];
  requestedBy?: string;
  createdAt?: string;
  completedDate?: string;
}

export interface InventoryMovement {
  id: string;
  roomId: string;
  stockLotId: string;
  quantity: number; // positive = stock added to the room, negative = stock removed
  type: 'RECEIPT' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'DISPATCH' | 'ADJUSTMENT';
  referenceId?: string; // id of the shipment / transfer / order that caused this movement
  notes?: string;
  createdBy: string; // user id
  timestamp: string; // ISO date-time
}

export interface Shipment {
  id: string;
  status: 'Pending' | 'Received' | 'Verified' | 'Closed';
  destinationRoomId: string;
  supplierName?: string;
  receivedDate?: string; // ISO date-time, set when status becomes 'Received'
  createdAt?: string;
}

export interface StockCountSessionItem {
  stockLotId: string;
  categoryId: string;
  variety: string;
  size: string;
  expectedQty: number;
  numberQty: number; // units entered directly by number
  palletBreakdown: PalletBatch[]; // pallet rows entered; each row's pallets*unitsPerPallet adds to the counted subtotal
  destructionQty: number; // units removed today via destruction — subtracted from the counted subtotal
  auctionQty: number; // units removed today via auction — subtracted from the counted subtotal
  actualQty: number; // final total = numberQty + sum(palletBreakdown) - destructionQty - auctionQty
  difference: number; // actualQty - expectedQty
  reason?: string; // required in the UI when difference !== 0
  isManualEntry?: boolean; // true when this lot was added on the fly via "Add item not listed" rather than pre-existing in the room
}

export interface StockCountSession {
  id?: string;
  date: string; // YYYY-MM-DD
  storeRoomId: string;
  storekeeperId: string;
  storekeeperName: string;
  status: 'Pending Verification' | 'Approved' | 'Rejected';
  timestamp: string; // ISO date-time
  items: StockCountSessionItem[];
}


