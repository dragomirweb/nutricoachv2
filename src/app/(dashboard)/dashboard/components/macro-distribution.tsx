"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MacroRing, MacroLegend } from "@/components/ui/macro-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyStats } from "@/hooks/use-daily-stats";

export function MacroDistribution() {
  // Use shared hook to prevent duplicate queries
  // No need to pass a date - it will default to today
  const { data: stats, isLoading } = useDailyStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Macros</CardTitle>
          <CardDescription>Your macronutrient distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <Skeleton className="h-48 w-48 rounded-full" />
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const macroData = {
    protein: Math.round(stats?.totalProtein || 0),
    carbs: Math.round(stats?.totalCarbs || 0),
    fat: Math.round(stats?.totalFat || 0),
  };

  const hasData =
    macroData.protein > 0 || macroData.carbs > 0 || macroData.fat > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Macros</CardTitle>
        <CardDescription>Your macronutrient distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          {hasData ? (
            <>
              <MacroRing
                data={macroData}
                totalCalories={stats?.totalCalories || 0}
                size="md"
              />
              <MacroLegend data={macroData} />
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No meals logged today. Start tracking to see your macro
                distribution.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}