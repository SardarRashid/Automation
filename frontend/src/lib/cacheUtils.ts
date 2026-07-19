/**
 * cacheUtils.ts
 * Provides a lightweight wrapper around localStorage for offline persistence of key database nodes.
 * Used to instantly hydrate React Contexts while Firebase connects in the background.
 */

export const cacheUtils = {
  set(key: string, data: any) {
    try {
      const serialized = JSON.stringify({
        timestamp: Date.now(),
        data: data
      });
      localStorage.setItem(`inventory_suit_cache_${key}`, serialized);
    } catch (err) {
      console.warn(`Failed to cache ${key}:`, err);
    }
  },

  get(key: string, maxAgeMs = 7 * 24 * 60 * 60 * 1000) { // Default 7 days
    try {
      const item = localStorage.getItem(`inventory_suit_cache_${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const isExpired = (Date.now() - parsed.timestamp) > maxAgeMs;

      if (isExpired) {
        this.remove(key);
        return null;
      }

      return parsed.data;
    } catch (err) {
      console.warn(`Failed to retrieve cache for ${key}:`, err);
      return null;
    }
  },

  remove(key: string) {
    localStorage.removeItem(`inventory_suit_cache_${key}`);
  },

  clearAll() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('inventory_suit_cache_')) {
        localStorage.removeItem(k);
      }
    });
  }
};
