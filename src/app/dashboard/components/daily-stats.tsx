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
          progressColor="success"
        />
        <StatCard
          label="Protein"
          value="0g"
          icon={Apple}
          progress={0}
          progressColor="primary"
        />
        <StatCard
          label="Carbs"
          value="0g"
          icon={Wheat}
          progress={0}
          progressColor="warning"
        />
        <StatCard
          label="Fat"
          value="0g"
          icon={Droplet}
          progress={0}
          progressColor="secondary"
        />

        {/* Call to action overlay */}
        <div className="col-span-full text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">
            No meals logged today. Start tracking to see your nutrition stats!
          </p>
          <Button asChild>
            <Link href="/meals/new">
              <Plus className="mr-2 h-4 w-4" /> Log Your First Meal
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const calorieProgress =
    stats && recommendations
      ? (stats.totalCalories / recommendations.daily.calories) * 100
      : 0;

  const proteinProgress =
    stats && recommendations
      ? (stats.totalProtein / recommendations.daily.protein) * 100
      : 0;

  const carbsProgress =
    stats && recommendations
      ? (stats.totalCarbs / recommendations.daily.carbs) * 100
      : 0;

  const fatProgress =
    stats && recommendations
      ? (stats.totalFat / recommendations.daily.fat) * 100
      : 0;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Calories Today"
        value={stats?.totalCalories.toLocaleString() || "0"}
        icon={Flame}
        progress={calorieProgress}
        progressColor={calorieProgress > 100 ? "destructive" : "success"}
        trend={
          recommendations
            ? {
                value:
                  recommendations.daily.calories - (stats?.totalCalories || 0),
                isPositive: false,
                label: "remaining",
              }
            : undefined
        }
      />
      <StatCard
        label="Protein"
        value={`${Math.round(stats?.totalProtein || 0)}g`}
        icon={Apple}
        progress={proteinProgress}
        progressColor="primary"
        trend={
          recommendations
            ? {
                value: Math.round(
                  recommendations.daily.protein - (stats?.totalProtein || 0)
                ),
                label: "g remaining",
              }
            : undefined
        }
      />
      <StatCard
        label="Carbs"
        value={`${Math.round(stats?.totalCarbs || 0)}g`}
        icon={Wheat}
        progress={carbsProgress}
        progressColor="warning"
      />
      <StatCard
        label="Fat"
        value={`${Math.round(stats?.totalFat || 0)}g`}
        icon={Droplet}
        progress={fatProgress}
        progressColor="secondary"
      />
    </div>
  );
}
