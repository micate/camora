type Procedure = (...args: any[]) => void;

/**
 * Creates a debounced version of a function that delays its execution
 * until after `wait` milliseconds have elapsed since the last time it was invoked.
 *
 * @param func - The function to debounce.
 * @param wait - The number of milliseconds to delay.
 * @returns A debounced version of the original function.
 */
export function debounce<T extends Procedure>(func: T, wait: number): T {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFunction = (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };

  return debouncedFunction as T;
}
