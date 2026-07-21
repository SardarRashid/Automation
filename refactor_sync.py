import re

filepath = "frontend/src/services/OfflineSyncEngine.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add firebase imports if not present
if "firebase/database" not in content:
    imports = "import { database } from '../lib/firebase';\nimport { ref, get, set } from 'firebase/database';\n"
    content = imports + content

# Change registerHandler
old_handler = """  // This will dynamically resolve actions without importing WorkflowEngine directly 
  // to avoid circular dependencies. WorkflowEngine will register its executor.
  private actionHandler: ((action: string, payload: any) => Promise<void>) | null = null;

  registerHandler(handler: (action: string, payload: any) => Promise<void>) {
    this.actionHandler = handler;
    // On register, try to sync if online
    if (navigator.onLine) {
      this.sync();
    }
  }"""
new_handler = """  private handlers: Map<string, (payload: any) => Promise<void>> = new Map();

  registerHandler(action: string, handler: (payload: any) => Promise<void>) {
    this.handlers.set(action, handler);
    // On register, try to sync if online
    if (navigator.onLine) {
      this.sync();
    }
  }"""
content = content.replace(old_handler, new_handler)

# Modify executeAction to check idempotency and route by action map
old_execute = """  private async executeAction(item: SyncItem) {
    if (!this.actionHandler) {
      console.warn('[OfflineSync] No handler registered for execution.');
      return;
    }
    await this.actionHandler(item.action, item.payload);
  }"""
new_execute = """  private async executeAction(item: SyncItem) {
    const handler = this.handlers.get(item.action);
    if (!handler) {
      console.warn(`[OfflineSync] No handler registered for action ${item.action}`);
      return;
    }

    const processedRef = ref(database, `processed_transactions/${item.id}`);
    const snapshot = await get(processedRef);
    if (snapshot.exists()) {
      return; // Already processed
    }

    await handler(item.payload);

    // Mark processed
    await set(processedRef, {
      timestamp: Date.now(),
      action: item.action
    });
  }"""
content = content.replace(old_execute, new_execute)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("OfflineSyncEngine rewritten.")
