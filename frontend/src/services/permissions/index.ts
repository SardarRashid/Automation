import { database } from '../../lib/firebase';
import { ref } from 'firebase/database';
import { eventBus } from '../core/EventBus';
import { BusinessEventType, BusinessEvent } from '../core/EventTypes';

export const permissionService = {
  async updateUser(userKey: string, updatedUserData: any, executorId: string): Promise<void> {
    await eventBus.dispatch(BusinessEventType.USER_UPDATED as any, { userKey, updatedUserData }, executorId);
  }
};

eventBus.subscribe(BusinessEventType.USER_UPDATED as any, async (event: BusinessEvent) => {
  const { userKey, updatedUserData } = event.payload;
  const updates: Record<string, any> = {};

  updates[`users/${userKey}`] = updatedUserData;

  // Support for Barcode Sticker Printer Extension's comma-formatted keys
  if (updatedUserData.allowedApps?.extension && updatedUserData.email) {
    const extensionKey = updatedUserData.email.toLowerCase().replace(/\./g, ',');
    if (extensionKey !== userKey) {
      updates[`users/${extensionKey}`] = updatedUserData;
    }
  }

  return updates;
});
