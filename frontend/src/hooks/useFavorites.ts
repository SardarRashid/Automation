import { useState, useEffect } from 'react';

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
