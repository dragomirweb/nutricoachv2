import { useState, useCallback, useEffect } from "react";
import { createDebouncedFunction } from "@/lib/utils/data-helpers";

/**
 * Hook for debounced search functionality
 * Useful for search inputs that trigger API calls
 */
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create debounced search function
  const debouncedSearch = useCallback(() => {
    return createDebouncedFunction(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(null);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const data = await searchFunction(searchQuery);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Search failed"));
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    }, delay);
  }, [searchFunction, delay])();

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearSearch: () => {
      setQuery("");
      setResults(null);
      setError(null);
      debouncedSearch.cancel();
    },
  };
}

/**
 * Hook for throttled window events
 * Useful for scroll, resize events
 */
export function useThrottledEvent(
  eventName: keyof WindowEventMap,
  handler: (event: Event) => void,
  delay: number = 100
) {
  useEffect(() => {
    const throttledHandler = createDebouncedFunction(handler, delay, {
      leading: true,
      trailing: true,
    });

    window.addEventListener(eventName, throttledHandler);

    return () => {
      window.removeEventListener(eventName, throttledHandler);
      throttledHandler.cancel();
    };
  }, [eventName, handler, delay]);
}
