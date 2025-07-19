import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

export default function GoalsPage() {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold">Goals</h1>
        <p className="text-muted-foreground">
          Set and track your nutrition goals
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            Goal tracking and management features are under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Soon you&apos;ll be able to:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li>Set weight loss/gain goals</li>
            <li>Define daily nutrition targets</li>
            <li>Track progress over time</li>
            <li>Get personalized recommendations</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}