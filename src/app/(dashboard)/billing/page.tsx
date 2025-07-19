import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Free Plan
          </CardTitle>
          <CardDescription>
            You&apos;re currently on the free plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Current Plan</span>
              <span className="text-sm font-medium">Free</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Status</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              Enjoy unlimited meal tracking and basic nutrition insights with your free account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}