"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { MealInput } from "@/components/ui/meal-input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AIProcessing } from "@/components/ui/ai-processing";
import { getMealPeriod } from "@/lib/utils/date-helpers";

export function QuickAddMeal() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();

  // Use tRPC mutations
  const analyzeMutation = api.nutrition.analyzeNutrition.useMutation();
  const createMealMutation = api.meals.create.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      utils.meals.list.invalidate();
      utils.meals.getDailyStats.invalidate();
      toast.success("Meal logged successfully!");
      setInput("");
      router.push("/meals");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log meal");
    },
  });

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error("Please describe your meal");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Analyze the meal description
      const analysis = await analyzeMutation.mutateAsync({
        text: input,
        mealType: getMealType(),
      });

      if (!analysis.recognized) {
        toast.error("Could not understand the meal description");
        setIsProcessing(false);
        return;
      }

      // Step 2: Create the meal with analyzed data
      await createMealMutation.mutateAsync({
        name: input,
        description: `AI analyzed: ${analysis.items.map((i) => i.name).join(", ")}`,
        type: getMealType(),
        foodItems: analysis.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.nutrients.calories,
          protein: item.nutrients.protein,
          carbs: item.nutrients.carbs,
          fat: item.nutrients.fat,
        })),
        aiParsed: true,
      });
    } catch (error) {
      console.error("Error processing meal:", error);
      toast.error("Failed to process meal");
    } finally {
      setIsProcessing(false);
    }
  };

  const getMealType = () => {
    return getMealPeriod(new Date());
  };

  if (isProcessing) {
    return (
      <AIProcessing
        status="processing"
        message="Analyzing your meal..."
        confidence={85}
      />
    );
  }

  return (
    <div className="space-y-4">
      <MealInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe what you ate..."
      />
      <Button
        onClick={handleSubmit}
        disabled={!input.trim() || createMealMutation.isPending}
        className="w-full"
      >
        {createMealMutation.isPending ? "Logging..." : "Log Meal"}
      </Button>
    </div>
  );
}
