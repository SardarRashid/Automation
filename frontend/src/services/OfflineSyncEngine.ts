import { database } from '../lib/firebase';
import { ref, get, set } from 'firebase/database';
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface SyncItem {
  id?: number;
  action: string;
  payload: any;
  timestamp: number;
}

interface InventoryDB extends DBSchema {
  sync_queue: {
    key: number;
    value: SyncItem;
    indexes: { 'by-timestamp': number };
  };
}

class OfflineSyncEngine {
  private dbPromise: Promise<IDBPDatabase<InventoryDB>>;
  private isSyncing: boolean = false;

  constructor() {
    this.dbPromise = openDB<InventoryDB>('inventory-suit-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });

    
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        if (granted) {
          console.log('[OfflineSync] Storage will not be cleared except by explicit user action');
        } else {
          console.warn('[OfflineSync] Storage may be cleared by the browser under storage pressure.');
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.sync.bind(this));
      // Try to sync periodically in case the online event was missed
      setInterval(this.sync.bind(this), 60000); // every 60 seconds
    }
  }

  async queueAction(action: string, payload: any) {
    const db = await this.dbPromise;
    await db.add('sync_queue', {
      action,
      payload,
      timestamp: Date.now(),
    });
    
    // Automatically try to sync immediately just in case we are actually online
    if (navigator.onLine) {
      this.sync();
    }
  }

  async getQueueCount(): Promise<number> {
    const db = await this.dbPromise;
    return await db.count('sync_queue');
  }

  async sync() {
    if (this.isSyncing || !navigator.onLine) return;
    
    this.isSyncing = true;
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const allItems = await store.index('by-timestamp').getAll();

      if (allItems.length > 0) {
        console.log(`[OfflineSync] Attempting to sync ${allItems.length} actions...`);
      }

      for (const item of allItems) {
        try {
          await this.executeAction(item);
          // If successful, remove from queue
          const deleteTx = db.transaction('sync_queue', 'readwrite');
          await deleteTx.objectStore('sync_queue').delete(item.id!);
          await deleteTx.done;
          console.log(`[OfflineSync] Synced action ${item.action}`);
        } catch (error) {
          console.error(`[OfflineSync] Failed to sync action ${item.action}`, error);
          // If it fails due to network, stop syncing. Otherwise, if it's a hard error, maybe keep it in queue or DLQ.
          if (!navigator.onLine) {
            break; 
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private handlers: Map<string, (payload: any) => Promise<void>> = new Map();

  registerHandler(action: string, handler: (payload: any) => Promise<void>) {
    this.handlers.set(action, handler);
    // On register, try to sync if online
    if (navigator.onLine) {
      this.sync();
    }
  }

  private async executeAction(item: SyncItem) {
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
  }
}

export const offlineSyncEngine = new OfflineSyncEngine();
