import os

path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\types.ts"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

new_types = """
// --- NEW ROOM-CENTRIC ARCHITECTURE TYPES ---

export type ProductLifecycleStatus = 
  | 'Incoming' 
  | 'Received' 
  | 'Stored' 
  | 'Allocated' 
  | 'Picked' 
  | 'Transferred' 
  | 'Damaged' 
  | 'Expired';

export interface StockLot {
  id: string;
  categoryId: string; // Refers to CategoryTemplate.name typically
  variety: string;
  size: string;
  originCountry?: string;
  grade?: string;
  batchNumber?: string;
  expiryDate?: string;
  status: ProductLifecycleStatus;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 
  | 'RECEIPT'
  | 'SALE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'SPOILAGE';

export interface InventoryMovement {
  id: string;
  timestamp: string;
  roomId: string;
  stockLotId: string;
  quantity: number; // Positive for incoming, negative for outgoing
  type: MovementType;
  referenceId?: string; // Shipment ID, Transfer ID, etc.
  notes?: string;
  createdBy?: string;
}

export interface Shipment {
  id: string;
  supplier: string;
  expectedDate: string;
  receivedDate?: string;
  status: 'Pending' | 'Received' | 'Cancelled';
  destinationRoomId: string;
  notes?: string;
}

export interface Transfer {
  id: string;
  sourceRoomId: string;
  destinationRoomId: string;
  requestedDate: string;
  completedDate?: string;
  status: 'Pending' | 'In Transit' | 'Completed' | 'Cancelled';
  notes?: string;
}

// Ensure StoreRoom has metrics support
export interface StoreRoomMetrics {
  capacity?: number; // Maximum pallets or boxes
  currentUtilization?: number; // Calculated field (percentage)
}
"""

# Check if new types are already added
if "ProductLifecycleStatus" not in content:
    with open(path, "a", encoding="utf-8") as f:
        f.write(new_types)
    print("Added new types to types.ts")
else:
    print("New types already exist in types.ts")
