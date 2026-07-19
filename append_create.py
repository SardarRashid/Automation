import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\inventory\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

create_shipment = '''  async createShipment(shipment: Omit<Shipment, 'id'>): Promise<Shipment> {
    const shipRef = push(ref(database, 'shipments'));
    const id = shipRef.key as string;
    
    const newShipment: Shipment = {
      ...shipment,
      id,
      status: 'Pending'
    };
    
    await set(shipRef, newShipment);
    return newShipment;
  },

  async getShipments(): Promise<Shipment[]> {'''

content = content.replace("  async getShipments(): Promise<Shipment[]> {", create_shipment)
content = content.replace("import { ref, get, push, child, query, orderByChild, equalTo } from 'firebase/database';", "import { ref, get, set, push, child, query, orderByChild, equalTo } from 'firebase/database';")


create_transfer = '''  async createTransfer(transfer: any): Promise<any> {
    const transRef = push(ref(database, 'transfers'));
    const id = transRef.key as string;
    
    const newTransfer = {
      ...transfer,
      id,
      status: 'Pending'
    };
    
    await set(transRef, newTransfer);
    return newTransfer;
  },

  async getTransfers(): Promise<any[]> {'''

content = content.replace("  async getTransfers(): Promise<any[]> {", create_transfer)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
