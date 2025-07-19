import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = session.user as {
    id: string;
    email: string;
    name?: string | null;
    emailVerified: boolean;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}!
        </p>
      </div>

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
                <span className="font-medium">Name:</span> {user.name || "Not set"}
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

        <Card>
          <CardHeader>
            <CardTitle>Nutrition Goals</CardTitle>
            <CardDescription>
              Track your nutrition goals
            </CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Meals</CardTitle>
            <CardDescription>
              Your meal history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              No meals logged yet. Start tracking your meals to see insights.
            </p>
            <Button asChild className="w-full">
              <Link href="/meals">Log Meal</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your account security
            </CardDescription>
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