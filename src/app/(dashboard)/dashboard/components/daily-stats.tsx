"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Flame, Apple, Wheat, Droplet, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  useDailyStats,
  useNutritionRecommendations,
} from "@/hooks/use-daily-stats";

export function DailyStats() {
  // Use shared hooks to prevent duplicate queries
  // No need to pass a date - it will default to today
  const { data: stats, isLoading, error } = useDailyStats();
  const { data: recommendations } = useNutritionRecommendations();

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[140px]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Unable to load your daily stats. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Check if user has logged any meals today
  const hasNoMeals = !stats || stats.mealCount === 0;

  if (hasNoMeals) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Empty state cards with CTA */}
        <StatCard
          label="Calories Today"
          value="0"
          icon={Flame}
          progress={0}
          progressColor="warning"
        />
        <StatCard
          label="Protein"
          value="0g"
          icon={Apple}
          progress={0}
        />
        <StatCard
          label="Carbs"
          value="0g"
          icon={Wheat}
          progress={0}
        />
        <StatCard
          label="Fat"
          value="0g"
          icon={Droplet}
          progress={0}
        />
        <div className="col-span-full">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/meals">
              <Plus className="mr-2 h-4 w-4" />
              Log Your First Meal
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Calories Today"
        value={stats.totalCalories.toString()}
        icon={Flame}
        progress={
          recommendations?.daily.calories
            ? (stats.totalCalories / recommendations.daily.calories) * 100
            : 0
        }
        progressColor={
          recommendations?.daily.calories &&
          stats.totalCalories > recommendations.daily.calories
            ? "warning"
            : "default"
        }
      />
      <StatCard
        label="Protein"
        value={`${Math.round(stats.totalProtein)}g`}
        icon={Apple}
        progress={
          recommendations?.daily.protein
            ? (stats.totalProtein / recommendations.daily.protein) * 100
            : 0
        }
      />
      <StatCard
        label="Carbs"
        value={`${Math.round(stats.totalCarbs)}g`}
        icon={Wheat}
        progress={
          recommendations?.daily.carbs
            ? (stats.totalCarbs / recommendations.daily.carbs) * 100
            : 0
        }
      />
      <StatCard
        label="Fat"
        value={`${Math.round(stats.totalFat)}g`}
        icon={Droplet}
        progress={
          recommendations?.daily.fat
            ? (stats.totalFat / recommendations.daily.fat) * 100
            : 0
        }
      />
    </div>
  );
}