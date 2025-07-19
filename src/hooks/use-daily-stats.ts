import { api } from "@/lib/trpc/client";
import { useMemo } from "react";
import { startOfDay, startOfToday } from "date-fns";

/**
 * Shared hook for fetching daily stats
 * This prevents multiple components from making the same query
 */
export function useDailyStats(date?: Date) {
  // Use a consistent date object across all components
  const queryDate = useMemo(() => {
    if (date) {
      // If a specific date is provided, normalize it to start of day
      return startOfDay(date);
    }
    // Default to start of today
    return startOfToday();
  }, [date]); // Use date directly in dependency array

  return api.meals.getDailyStats.useQuery(
    { date: queryDate },
    {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    }
  );
}

/**
 * Shared hook for fetching nutrition recommendations
 */
export function useNutritionRecommendations() {
  return api.nutrition.getRecommendations.useQuery(undefined, {
    staleTime: 30 * 60 * 1000, // Recommendations don't change often
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });
}
