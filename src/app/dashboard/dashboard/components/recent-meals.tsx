"use client";

import { api } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Utensils } from "lucide-react";
import { formatTime, getRelativeTime } from "@/lib/utils/date-helpers";
import { generateSkeletons } from "@/lib/utils/ui-helpers";

export function RecentMeals() {
  const { data: meals, isLoading } = api.meals.list.useQuery({
    limit: 5,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Meals</CardTitle>
          <CardDescription>Your meal history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {generateSkeletons(3, (i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Meals</CardTitle>
        <CardDescription>Your meal history</CardDescription>
      </CardHeader>
      <CardContent>
        {!meals?.items.length ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              No meals logged yet. Start tracking your meals to see insights.
            </p>
            <Button asChild className="w-full">
              <Link href="/meals">Log Meal</Link>
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            {meals.items.map((meal) => (
              <div
                key={meal.id}
                className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{meal.name}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span
                      className="flex items-center gap-1"
                      title={getRelativeTime(meal.loggedAt)}
                    >
                      <Clock className="h-3 w-3" />
                      {formatTime(meal.loggedAt)}
                    </span>
                    {meal.type && (
                      <span className="capitalize">{meal.type}</span>
                    )}
                    <span>{meal.totalCalories} cal</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/meals/${meal.id}`}>View</Link>
                </Button>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link href="/meals">View All Meals</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
