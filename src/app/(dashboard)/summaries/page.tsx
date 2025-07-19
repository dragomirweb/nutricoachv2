"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, TrendingUp, BarChart3 } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function SummariesPage() {
  const { data: summaries, isLoading } = api.summaries.list.useQuery({
    limit: 7,
  });

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold">Daily Summaries</h1>
        <p className="text-muted-foreground">
          Review your daily nutrition summaries and insights
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : summaries?.items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              No Summaries Yet
            </CardTitle>
            <CardDescription>
              Start logging meals to see your daily summaries
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {summaries?.items.map((summary) => (
            <Card key={summary.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {format(new Date(summary.date), "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    {summary.mealCount} meals
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium">Calories</p>
                    <p className="text-2xl font-bold">{summary.totalCalories}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Protein</p>
                    <p className="text-2xl font-bold">{Math.round(parseFloat(summary.totalProtein))}g</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Carbs</p>
                    <p className="text-2xl font-bold">{Math.round(parseFloat(summary.totalCarbs))}g</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fat</p>
                    <p className="text-2xl font-bold">{Math.round(parseFloat(summary.totalFat))}g</p>
                  </div>
                </div>
                {summary.summary && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{summary.summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Weekly Stats Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Insights
          </CardTitle>
          <CardDescription>
            Coming soon: Weekly trends and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track your progress with weekly averages and insights about your nutrition patterns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}