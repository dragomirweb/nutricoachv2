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
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingDown, TrendingUp, Activity } from "lucide-react";

export function UserGoals() {
  const { data: goals, isLoading } = api.user.getActiveGoals.useQuery();
  const { data: profile } = api.user.getProfile.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Goals</CardTitle>
          <CardDescription>Track your nutrition goals</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const activeGoal = goals?.[0]; // Get the most recent active goal

  if (!activeGoal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Goals</CardTitle>
          <CardDescription>Track your nutrition goals</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            No goals set yet. Start by setting your daily nutrition targets.
          </p>
          <Button asChild className="w-full">
            <Link href="/goals">Set Goals</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const goalTypeIcons = {
    weight_loss: TrendingDown,
    weight_gain: TrendingUp,
    maintain: Activity,
    muscle_gain: Target,
  };

  const Icon = goalTypeIcons[activeGoal.type] || Target;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrition Goals</CardTitle>
        <CardDescription>Your active nutrition targets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium capitalize">
              {activeGoal.type.replace("_", " ")}
            </p>
            {activeGoal.targetDate && (
              <p className="text-sm text-muted-foreground">
                Target: {format(new Date(activeGoal.targetDate), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {activeGoal.dailyCalories && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Daily Calories</span>
                <span className="font-medium">{activeGoal.dailyCalories}</span>
              </div>
            </div>
          )}

          {activeGoal.targetWeight && profile?.profile?.weight && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weight Progress</span>
                <span className="font-medium">
                  {profile.profile.weight} / {activeGoal.targetWeight} kg
                </span>
              </div>
              <Progress
                value={
                  (parseFloat(profile.profile.weight || "0") /
                    parseFloat(activeGoal.targetWeight || "1")) *
                  100
                }
                className="h-2"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-2">
            {activeGoal.dailyProtein && (
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="font-medium">{activeGoal.dailyProtein}g</p>
              </div>
            )}
            {activeGoal.dailyCarbs && (
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="font-medium">{activeGoal.dailyCarbs}g</p>
              </div>
            )}
            {activeGoal.dailyFat && (
              <div className="text-center p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Fat</p>
                <p className="font-medium">{activeGoal.dailyFat}g</p>
              </div>
            )}
          </div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/goals">Manage Goals</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
