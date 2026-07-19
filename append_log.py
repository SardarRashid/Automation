import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\inventory\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add logMovement to inventoryService
log_movement_method = '''  async logMovement(movement: any): Promise<void> {
    await eventBus.dispatch(BusinessEventType.INVENTORY_ADJUSTED, movement, movement.createdBy || 'unknown');
  },
'''

content = content.replace("  async getMovementsByRoom(roomId: string): Promise<InventoryMovement[]> {", log_movement_method + "\n  async getMovementsByRoom(roomId: string): Promise<InventoryMovement[]> {")

# Add INVENTORY_ADJUSTED listener
adjusted_listener = '''
eventBus.subscribe(BusinessEventType.INVENTORY_ADJUSTED, async (event: BusinessEvent) => {
  const movement = event.payload;
  const updates: Record<string, any> = {};
  
  const movRef = push(ref(database, 'inventory_movements'));
  updates[inventory_movements/] = {
    ...movement,
    id: movRef.key,
    timestamp: new Date().toISOString()
  };

  return updates;
});
'''

content += "\n" + adjusted_listener

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
