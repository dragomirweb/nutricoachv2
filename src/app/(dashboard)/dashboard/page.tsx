import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DailyStats } from "./components/daily-stats";
import { RecentMeals } from "./components/recent-meals";
import { UserGoals } from "./components/user-goals";
import { MacroDistribution } from "./components/macro-distribution";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}! 👋
        </p>
      </div>

      {/* Stats Grid - Now powered by tRPC */}
      <DailyStats />

      {/* Macro Distribution - Now powered by tRPC */}
      <MacroDistribution />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Manage your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">Name:</span>{" "}
                {user.name || "Not set"}
              </p>
              <p>
                <span className="font-medium">Verified:</span>{" "}
                {user.emailVerified ? "Yes" : "No"}
              </p>
            </div>
            <Button asChild className="w-full mt-4">
              <Link href="/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Nutrition Goals - Now powered by tRPC */}
        <UserGoals />

        {/* Recent Meals - Now powered by tRPC */}
        <RecentMeals />

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Sessions:</span> 1 active
              </p>
              <p>
                <span className="font-medium">2FA:</span> Not enabled
              </p>
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/settings/security">Security Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}