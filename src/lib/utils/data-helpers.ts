import { cloneDeep, debounce, isEmpty, merge, throttle } from "lodash";

/**
 * Deep clone an object to avoid mutations
 * Useful for state management and form handling
 */
export function deepClone<T>(obj: T): T {
  return cloneDeep(obj);
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmptyValue(value: unknown): boolean {
  return isEmpty(value);
}

/**
 * Deep merge objects - useful for settings and configurations
 */
export function deepMerge<T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T {
  return merge(cloneDeep(target), ...sources);
}

/**
 * Create a debounced version of a function
 * Useful for search inputs, API calls, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300,
  options?: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  }
) {
  return debounce(func, wait, options);
}

/**
 * Create a throttled version of a function
 * Useful for scroll events, resize events, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createThrottledFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 100,
  options?: {
    leading?: boolean;
    trailing?: boolean;
  }
) {
  return throttle(func, wait, options);
}

/**
 * Safe parse JSON with fallback
 */
export function safeParseJSON<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json);
    return isEmpty(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

/**
 * Format nutrition data with default values
 */
export function formatNutritionData(
  data: Partial<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    sugar: number;
  }>
) {
  const defaults = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
    sugar: 0,
  };

  return deepMerge(defaults, data);
}
