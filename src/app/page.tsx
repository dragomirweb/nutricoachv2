import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Welcome to NutriCoach
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personal nutrition companion. Track meals, set goals, and
            achieve your health objectives with AI-powered insights.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Track Nutrition</h3>
            <p className="text-sm text-muted-foreground">
              Log meals easily with AI-powered food recognition and get detailed
              nutritional breakdowns.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Set Goals</h3>
            <p className="text-sm text-muted-foreground">
              Define personalized nutrition goals based on your health
              objectives and dietary preferences.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your progress with detailed analytics and insights to stay
              on track.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
