'use client';
import { useState, useEffect, useCallback } from 'react';

// A utility to check if we're on the server
const isServer = typeof window === 'undefined';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // We need to delay reading from localStorage until the component has mounted on the client
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (isServer) {
      return initialValue;
    }
    // This part now only runs on the client, once.
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (isServer) {
      console.warn(`Tried to set localStorage key “${key}” on the server.`);
      return;
    }
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  // This effect will synchronize the state if the localStorage is changed in another tab.
  useEffect(() => {
    if(isServer) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}
