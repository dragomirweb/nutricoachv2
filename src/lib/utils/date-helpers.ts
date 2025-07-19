import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  parseISO,
  isValid,
} from "date-fns";

/**
 * Format a date for display in the UI
 */
export function formatDate(
  date: Date | string,
  pattern: string = "PPP"
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, pattern) : "Invalid date";
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, "h:mm a") : "Invalid time";
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isValid(dateObj)
    ? formatDistanceToNow(dateObj, { addSuffix: true })
    : "Invalid date";
}

/**
 * Get human-friendly date label
 */
export function getDateLabel(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) return "Invalid date";

  if (isToday(dateObj)) return "Today";
  if (isYesterday(dateObj)) return "Yesterday";

  return formatDate(dateObj, "EEEE, MMMM d");
}

/**
 * Get date range for different periods
 */
export function getDateRange(
  period: "day" | "week" | "month",
  date: Date = new Date()
) {
  switch (period) {
    case "day":
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
    case "week":
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
  }
}

/**
 * Get dates for navigation (previous/next)
 */
export function getNavigationDates(
  currentDate: Date,
  period: "day" | "week" | "month"
) {
  const amount = 1;

  switch (period) {
    case "day":
      return {
        previous: subDays(currentDate, amount),
        next: addDays(currentDate, amount),
      };
    case "week":
      return {
        previous: subDays(currentDate, 7),
        next: addDays(currentDate, 7),
      };
    case "month":
      return {
        previous: subDays(currentDate, 30),
        next: addDays(currentDate, 30),
      };
  }
}

/**
 * Check if two dates are on the same day
 */
export function areDatesOnSameDay(
  date1: Date | string,
  date2: Date | string
): boolean {
  const dateObj1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const dateObj2 = typeof date2 === "string" ? parseISO(date2) : date2;

  return (
    isValid(dateObj1) && isValid(dateObj2) && isSameDay(dateObj1, dateObj2)
  );
}

/**
 * Format date for API requests (ISO string)
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString();
}

/**
 * Get meal time period based on hour
 */
export function getMealPeriod(
  date: Date
): "breakfast" | "lunch" | "dinner" | "snack" {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 20) return "dinner";
  return "snack";
}
