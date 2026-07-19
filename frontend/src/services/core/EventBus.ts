import { database } from '../../lib/firebase';
import { ref, update } from 'firebase/database';
import { BusinessEventType } from './EventTypes';
import type { BusinessEvent } from './EventTypes';

export type EventListener = (event: BusinessEvent) => Promise<Record<string, any> | void>;

class BusinessEventBus {
  private listeners: Map<BusinessEventType, EventListener[]> = new Map();

  /**
   * Register a listener for a specific event type.
   * Listeners should return an object containing the Firebase paths and values they wish to update,
   * OR void if they perform side-effects that do not require transactional database updates.
   */
  subscribe(eventType: BusinessEventType, listener: EventListener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
  }

  /**
   * Dispatch an event. This will collect all intended database updates from the listeners
   * and commit them atomically as a single Firebase multi-path update.
   */
  async dispatch(eventType: BusinessEventType, payload: any, userId: string): Promise<void> {
    const event: BusinessEvent = {
      type: eventType,
      payload,
      userId,
      timestamp: Date.now()
    };

    console.log(`[EventBus] Dispatching ${eventType}`, event);

    let aggregatedUpdates: Record<string, any> = {};
    const handlers = this.listeners.get(eventType) || [];

    for (const listener of handlers) {
      try {
        const partialUpdates = await listener(event);
        if (partialUpdates) {
          // Merge partial updates into the aggregate
          aggregatedUpdates = { ...aggregatedUpdates, ...partialUpdates };
        }
      } catch (error) {
        console.error(`[EventBus] Error in listener for ${eventType}:`, error);
        throw new Error(`Event propagation failed for ${eventType}: ${error}`);
      }
    }

    // If there are updates to commit, execute the atomic transaction
    if (Object.keys(aggregatedUpdates).length > 0) {
      console.log(`[EventBus] Committing ${Object.keys(aggregatedUpdates).length} updates for ${eventType}`);
      await update(ref(database), aggregatedUpdates);
    } else {
      console.log(`[EventBus] No database updates returned for ${eventType}`);
    }
  }
}

// Export a singleton instance of the EventBus
export const eventBus = new BusinessEventBus();
