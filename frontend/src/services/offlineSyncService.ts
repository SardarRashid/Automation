import { database } from '../lib/firebase';
import { ref, get, set } from 'firebase/database';

export type TransactionPayload = 
  | { type: 'ORDER', data: any }
  | { type: 'PAYMENT', data: any };

export interface SyncTransaction {
  id: string; // UUID
  payload: TransactionPayload;
  timestamp: number;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  error?: string;
}

const STORAGE_KEY = 'sales_mobile_offline_queue';

export const offlineSyncService = {
  /**
   * Generates a simple UUID v4
   */
  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Retrieves the current queue from localStorage
   */
  getQueue(): SyncTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to parse offline queue", e);
      return [];
    }
  },

  /**
   * Saves the queue to localStorage
   */
  saveQueue(queue: SyncTransaction[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  },

  /**
   * Adds a transaction to the offline queue
   */
  enqueueTransaction(payload: TransactionPayload): string {
    const tx: SyncTransaction = {
      id: this.generateId(),
      payload,
      timestamp: Date.now(),
      status: 'PENDING'
    };
    
    const queue = this.getQueue();
    queue.push(tx);
    this.saveQueue(queue);
    
    // Attempt to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
    
    return tx.id;
  },

  /**
   * Clears successfully synced transactions from the queue
   */
  clearSynced() {
    const queue = this.getQueue().filter(tx => tx.status !== 'SYNCED');
    this.saveQueue(queue);
  },

  /**
   * Processes the queue. Needs a callback to actually execute the business logic,
   * which prevents cyclic dependencies with salesService.
   */
  async processQueue(processor?: (tx: SyncTransaction) => Promise<void>) {
    if (!navigator.onLine) return;

    const queue = this.getQueue();
    const pending = queue.filter(tx => tx.status === 'PENDING' || tx.status === 'FAILED');

    if (pending.length === 0) return;

    let hasUpdates = false;

    for (const tx of pending) {
      try {
        // Idempotency check: has this transaction ID already been processed in Firebase?
        const processedRef = ref(database, `processed_transactions/${tx.id}`);
        const snapshot = await get(processedRef);
        
        if (snapshot.exists()) {
          // Already processed (perhaps we lost connection before marking it SYNCED locally)
          tx.status = 'SYNCED';
          hasUpdates = true;
          continue;
        }

        // Execute the actual payload
        if (processor) {
          await processor(tx);
        } else {
          // Fallback if no processor provided yet (this is just for safety)
          console.warn("No processor provided for offline queue");
          break;
        }

        // Mark as processed in Firebase to ensure idempotency
        await set(processedRef, {
          timestamp: Date.now(),
          type: tx.payload.type
        });

        tx.status = 'SYNCED';
        hasUpdates = true;

      } catch (err: any) {
        console.error(`Failed to sync transaction ${tx.id}`, err);
        tx.status = 'FAILED';
        tx.error = err.message;
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      this.saveQueue(queue);
      this.clearSynced();
    }
  },
  
  /**
   * Event listener setup for when device comes back online
   */
  init(processor: (tx: SyncTransaction) => Promise<void>) {
    window.addEventListener('online', () => {
      this.processQueue(processor);
    });
    // Run once on startup
    if (navigator.onLine) {
      this.processQueue(processor);
    }
  }
};
