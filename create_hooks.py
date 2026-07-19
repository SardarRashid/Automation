import os

hooks_dir = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\hooks"
os.makedirs(hooks_dir, exist_ok=True)

# 1. useNetworkStatus.ts
with open(os.path.join(hooks_dir, "useNetworkStatus.ts"), "w", encoding="utf-8") as f:
    f.write("""import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
""")

# 2. useDraft.ts
with open(os.path.join(hooks_dir, "useDraft.ts"), "w", encoding="utf-8") as f:
    f.write("""import { useState, useEffect } from 'react';

export function useDraft<T>(key: string, initialValue: T) {
  const [draft, setDraft] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn('Error reading localStorage', error);
      return initialValue;
    }
  });

  const saveDraft = (value: T) => {
    try {
      setDraft(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Error saving to localStorage', error);
    }
  };

  const clearDraft = () => {
    try {
      setDraft(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('Error clearing localStorage', error);
    }
  };

  return { draft, saveDraft, clearDraft };
}
""")

# 3. useFavorites.ts
with open(os.path.join(hooks_dir, "useFavorites.ts"), "w", encoding="utf-8") as f:
    f.write("""import { useState, useEffect } from 'react';

export function useFavorites(key: string) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const item = window.localStorage.getItem(key + '_favorites');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      return [];
    }
  });

  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const item = window.localStorage.getItem(key + '_recent');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      return [];
    }
  });

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id) 
      ? favorites.filter(fId => fId !== id)
      : [...favorites, id];
    setFavorites(updated);
    window.localStorage.setItem(key + '_favorites', JSON.stringify(updated));
  };

  const addRecent = (id: string) => {
    const updated = [id, ...recent.filter(rId => rId !== id)].slice(0, 10); // Keep last 10
    setRecent(updated);
    window.localStorage.setItem(key + '_recent', JSON.stringify(updated));
  };

  return { favorites, toggleFavorite, recent, addRecent };
}
""")

print("Hooks created.")
