import { useState, useEffect } from 'react';

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
