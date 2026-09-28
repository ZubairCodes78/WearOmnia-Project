import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapidly changing values (e.g. search input fields).
 * @param value The raw value from input
 * @param delayMs Debounce delay in milliseconds (default 300ms)
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
