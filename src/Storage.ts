import { useCallback, useEffect, useState } from 'react';

/** Type-safe offline-first localStorage persistence with an in-memory fallback. */
export function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const raw = window.localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw) as T; }
  catch { return fallback; }
}
export function writeStoredValue<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { console.warn(`Unable to persist ${key}; continuing in memory.`, error); }
}
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, (value: T | ((previous: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readStoredValue(key, typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue));
  useEffect(() => { writeStoredValue(key, value); }, [key, value]);
  const update = useCallback((next: T | ((previous: T) => T)) => setValue(next), []);
  return [value, update];
}
