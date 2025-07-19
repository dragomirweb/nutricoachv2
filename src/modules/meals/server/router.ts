import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc/procedures";
import { meals, foodItems } from "@/server/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { sumBy } from "lodash";

// Schemas for meal operations
const createFoodItemSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(100).optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  // Minerals
  iron: z.number().min(0).optional(),
  magnesium: z.number().min(0).optional(),
  calcium: z.number().min(0).optional(),
  zinc: z.number().min(0).optional(),
  potassium: z.number().min(0).optional(),
});

const createMealSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["breakfast", "brunch", "lunch", "dinner", "snack", "dessert"]).optional(),
  loggedAt: z.date().optional(),
  foodItems: z.array(createFoodItemSchema).default([]),
});

const updateMealSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(["breakfast", "brunch", "lunch", "dinner", "snack", "dessert"]).optional(),
  loggedAt: z.date().optional(),
  foodItems: z.array(createFoodItemSchema).optional(),
});

// Helper function to calculate meal totals
interface FoodItemData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  iron?: number;
  magnesium?: number;
  calcium?: number;
  zinc?: number;
  potassium?: number;
}

function calculateMealTotals(items: Array<FoodItemData>) {
  return {
    totalCalories: sumBy(items, "calories") || 0,
    totalProtein: sumBy(items, "protein") || 0,
    totalCarbs: sumBy(items, "carbs") || 0,
    totalFat: sumBy(items, "fat") || 0,
    totalFiber: sumBy(items, "fiber") || 0,
    totalIron: sumBy(items, "iron") || 0,
    totalMagnesium: sumBy(items, "magnesium") || 0,
    totalCalcium: sumBy(items, "calcium") || 0,
    totalZinc: sumBy(items, "zinc") || 0,
    totalPotassium: sumBy(items, "potassium") || 0,
  };
}

export const mealsRouter = router({
  /**
   * List meals with pagination and filters
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        type: z.enum(["breakfast", "brunch", "lunch", "dinner", "snack", "dessert"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, startDate, endDate, type } = input;

      const conditions = [eq(meals.userId, ctx.session.user.id)];

      if (startDate) {
        conditions.push(gte(meals.loggedAt, startDate));
      }

      if (endDate) {
        conditions.push(lte(meals.loggedAt, endDate));
      }

      if (type) {
        conditions.push(eq(meals.type, type));
      }

      const items = await ctx.db.query.meals.findMany({
        where: and(...conditions),
        with: {
          foodItems: true,
        },
        orderBy: desc(meals.loggedAt),
        limit: limit + 1,
        offset: cursor ? parseInt(cursor) : 0,
      });

      let nextCursor: string | undefined = undefined;
      if (items.length > limit) {
        items.pop();
        nextCursor = String((cursor ? parseInt(cursor) : 0) + limit);
      }

      return {
        items,
        nextCursor,
      };
    }),

  /**
   * Get a single meal by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const meal = await ctx.db.query.meals.findFirst({
        where: and(
          eq(meals.id, input.id),
          eq(meals.userId, ctx.session.user.id)
        ),
        with: {
          foodItems: true,
        },
      });

      if (!meal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal not found",
        });
      }

      return meal;
    }),

  /**
   * Create a new meal
   */
  create: protectedProcedure
    .input(createMealSchema)
    .mutation(async ({ ctx, input }) => {
      const mealId = nanoid();

      // Calculate totals from food items
      const totals = calculateMealTotals(input.foodItems);

      await ctx.db.transaction(async (tx) => {
        // Insert meal
        await tx.insert(meals).values({
          id: mealId,
          userId: ctx.session.user.id,
          name: input.name,
          type: input.type,
          description: input.description,
          loggedAt: input.loggedAt || new Date(),
          totalCalories: totals.totalCalories,
          totalProtein: totals.totalProtein.toString(),
          totalCarbs: totals.totalCarbs.toString(),
          totalFat: totals.totalFat.toString(),
          totalFiber: totals.totalFiber.toString(),
          totalIron: totals.totalIron.toString(),
          totalMagnesium: totals.totalMagnesium.toString(),
          totalCalcium: totals.totalCalcium.toString(),
          totalZinc: totals.totalZinc.toString(),
          totalPotassium: totals.totalPotassium.toString(),
        });

        // Insert food items
        if (input.foodItems.length > 0) {
          await tx.insert(foodItems).values(
            input.foodItems.map((item) => ({
              id: nanoid(),
              mealId,
              name: item.name,
              brand: item.brand,
              quantity: item.quantity.toString(),
              unit: item.unit,
              calories: item.calories,
              protein: item.protein?.toString(),
              carbs: item.carbs?.toString(),
              fat: item.fat?.toString(),
              fiber: item.fiber?.toString(),
              sodium: item.sodium?.toString(),
              sugar: item.sugar?.toString(),
              iron: item.iron?.toString(),
              magnesium: item.magnesium?.toString(),
              calcium: item.calcium?.toString(),
              zinc: item.zinc?.toString(),
              potassium: item.potassium?.toString(),
            }))
          );
        }
      });

      return { id: mealId };
    }),

  /**
   * Update an existing meal
   */
  update: protectedProcedure
    .input(updateMealSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, foodItems: newFoodItems, ...mealData } = input;

      // Verify ownership
      const existing = await ctx.db.query.meals.findFirst({
        where: and(eq(meals.id, id), eq(meals.userId, ctx.session.user.id)),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal not found",
        });
      }

      await ctx.db.transaction(async (tx) => {
        // Update meal basic info
        if (Object.keys(mealData).length > 0) {
          await tx.update(meals).set(mealData).where(eq(meals.id, id));
        }

        // Update food items if provided
        if (newFoodItems !== undefined) {
          // Delete existing items
          await tx.delete(foodItems).where(eq(foodItems.mealId, id));

          // Calculate new totals
          const totals = calculateMealTotals(newFoodItems);

          // Update meal totals
          await tx
            .update(meals)
            .set({
              totalCalories: totals.totalCalories,
              totalProtein: totals.totalProtein.toString(),
              totalCarbs: totals.totalCarbs.toString(),
              totalFat: totals.totalFat.toString(),
              totalFiber: totals.totalFiber.toString(),
              totalIron: totals.totalIron.toString(),
              totalMagnesium: totals.totalMagnesium.toString(),
              totalCalcium: totals.totalCalcium.toString(),
              totalZinc: totals.totalZinc.toString(),
              totalPotassium: totals.totalPotassium.toString(),
            })
            .where(eq(meals.id, id));

          // Insert new items
          if (newFoodItems.length > 0) {
            await tx.insert(foodItems).values(
              newFoodItems.map((item) => ({
                id: nanoid(),
                mealId: id,
                name: item.name,
                brand: item.brand,
                quantity: item.quantity.toString(),
                unit: item.unit,
                calories: item.calories,
                protein: item.protein?.toString(),
                carbs: item.carbs?.toString(),
                fat: item.fat?.toString(),
                fiber: item.fiber?.toString(),
                sodium: item.sodium?.toString(),
                sugar: item.sugar?.toString(),
                iron: item.iron?.toString(),
                magnesium: item.magnesium?.toString(),
                calcium: item.calcium?.toString(),
                zinc: item.zinc?.toString(),
                potassium: item.potassium?.toString(),
              }))
            );
          }
        }
      });

      return { success: true };
    }),

  /**
   * Delete a meal
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if meal exists first
      const existing = await ctx.db.query.meals.findFirst({
        where: and(
          eq(meals.id, input.id),
          eq(meals.userId, ctx.session.user.id)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal not found",
        });
      }

      await ctx.db
        .delete(meals)
        .where(
          and(eq(meals.id, input.id), eq(meals.userId, ctx.session.user.id))
        );

      return { success: true };
    }),

  /**
   * Get daily nutrition stats
   */
  getDailyStats: protectedProcedure
    .input(
      z.object({
        date: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { startOfDay, endOfDay } = await import("date-fns");

      const dayStart = startOfDay(input.date);
      const dayEnd = endOfDay(input.date);

      const dayMeals = await ctx.db.query.meals.findMany({
        where: and(
          eq(meals.userId, ctx.session.user.id),
          gte(meals.loggedAt, dayStart),
          lte(meals.loggedAt, dayEnd)
        ),
      });

      // Calculate totals
      const stats = dayMeals.reduce(
        (acc, meal) => ({
          totalCalories: acc.totalCalories + (meal.totalCalories || 0),
          totalProtein: acc.totalProtein + parseFloat(meal.totalProtein || "0"),
          totalCarbs: acc.totalCarbs + parseFloat(meal.totalCarbs || "0"),
          totalFat: acc.totalFat + parseFloat(meal.totalFat || "0"),
          totalFiber: acc.totalFiber + parseFloat(meal.totalFiber || "0"),
          totalIron: acc.totalIron + parseFloat(meal.totalIron || "0"),
          totalMagnesium: acc.totalMagnesium + parseFloat(meal.totalMagnesium || "0"),
          totalCalcium: acc.totalCalcium + parseFloat(meal.totalCalcium || "0"),
          totalZinc: acc.totalZinc + parseFloat(meal.totalZinc || "0"),
          totalPotassium: acc.totalPotassium + parseFloat(meal.totalPotassium || "0"),
          mealCount: acc.mealCount + 1,
        }),
        {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          totalIron: 0,
          totalMagnesium: 0,
          totalCalcium: 0,
          totalZinc: 0,
          totalPotassium: 0,
          mealCount: 0,
        }
      );

      return stats;
    }),

  /**
   * Search recent meals for quick add
   */
  searchRecent: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const recentMeals = await ctx.db.query.meals.findMany({
        where: and(
          eq(meals.userId, ctx.session.user.id),
          sql`${meals.name} ILIKE ${`%${input.query}%`}`
        ),
        with: {
          foodItems: true,
        },
        orderBy: desc(meals.loggedAt),
        limit: input.limit,
      });

      return recentMeals;
    }),
});
