import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc/procedures";
import { dailySummaries, meals } from "@/server/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

// Schema for summary operations
const upsertSummarySchema = z.object({
  date: z.date(),
  summary: z.string().max(5000).optional(), // AI-generated feedback
});

const getSummarySchema = z.object({
  date: z.date(),
});

export const summariesRouter = router({
  /**
   * Get summary for a specific date
   */
  getByDate: protectedProcedure
    .input(getSummarySchema)
    .query(async ({ ctx, input }) => {
      const dateStr = input.date.toISOString().split('T')[0];
      
      const summary = await ctx.db.query.dailySummaries.findFirst({
        where: and(
          eq(dailySummaries.userId, ctx.session.user.id),
          eq(dailySummaries.date, dateStr)
        ),
      });

      return summary;
    }),

  /**
   * List summaries with pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(30),
        cursor: z.string().nullish(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, startDate, endDate } = input;

      const conditions = [eq(dailySummaries.userId, ctx.session.user.id)];

      if (startDate) {
        conditions.push(gte(dailySummaries.date, startDate.toISOString().split('T')[0]));
      }

      if (endDate) {
        conditions.push(lte(dailySummaries.date, endDate.toISOString().split('T')[0]));
      }

      const items = await ctx.db.query.dailySummaries.findMany({
        where: and(...conditions),
        orderBy: (summaries, { desc }) => desc(summaries.date),
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
   * Create or update summary for a date
   * This will aggregate all meals for the given date
   */
  upsert: protectedProcedure
    .input(upsertSummarySchema)
    .mutation(async ({ ctx, input }) => {
      const dateStr = input.date.toISOString().split('T')[0];
      const { startOfDay, endOfDay } = await import("date-fns");

      const dayStart = startOfDay(input.date);
      const dayEnd = endOfDay(input.date);

      // Get all meals for this date
      const dayMeals = await ctx.db.query.meals.findMany({
        where: and(
          eq(meals.userId, ctx.session.user.id),
          gte(meals.loggedAt, dayStart),
          lte(meals.loggedAt, dayEnd)
        ),
      });

      // Calculate aggregated totals
      const totals = dayMeals.reduce(
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

      // Check if summary already exists
      const existing = await ctx.db.query.dailySummaries.findFirst({
        where: and(
          eq(dailySummaries.userId, ctx.session.user.id),
          eq(dailySummaries.date, dateStr)
        ),
      });

      if (existing) {
        // Update existing summary
        await ctx.db
          .update(dailySummaries)
          .set({
            ...totals,
            totalProtein: totals.totalProtein.toString(),
            totalCarbs: totals.totalCarbs.toString(),
            totalFat: totals.totalFat.toString(),
            totalFiber: totals.totalFiber.toString(),
            totalIron: totals.totalIron.toString(),
            totalMagnesium: totals.totalMagnesium.toString(),
            totalCalcium: totals.totalCalcium.toString(),
            totalZinc: totals.totalZinc.toString(),
            totalPotassium: totals.totalPotassium.toString(),
            summary: input.summary || existing.summary,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(dailySummaries.id, existing.id),
              eq(dailySummaries.userId, ctx.session.user.id)
            )
          );

        return { id: existing.id, action: "updated" as const };
      } else {
        // Create new summary
        const summaryId = nanoid();
        
        await ctx.db.insert(dailySummaries).values({
          id: summaryId,
          userId: ctx.session.user.id,
          date: dateStr,
          ...totals,
          totalProtein: totals.totalProtein.toString(),
          totalCarbs: totals.totalCarbs.toString(),
          totalFat: totals.totalFat.toString(),
          totalFiber: totals.totalFiber.toString(),
          totalIron: totals.totalIron.toString(),
          totalMagnesium: totals.totalMagnesium.toString(),
          totalCalcium: totals.totalCalcium.toString(),
          totalZinc: totals.totalZinc.toString(),
          totalPotassium: totals.totalPotassium.toString(),
          summary: input.summary,
        });

        return { id: summaryId, action: "created" as const };
      }
    }),

  /**
   * Update only the AI summary text for a date
   */
  updateSummaryText: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        summary: z.string().max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dateStr = input.date.toISOString().split('T')[0];

      const existing = await ctx.db.query.dailySummaries.findFirst({
        where: and(
          eq(dailySummaries.userId, ctx.session.user.id),
          eq(dailySummaries.date, dateStr)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Summary not found for this date",
        });
      }

      await ctx.db
        .update(dailySummaries)
        .set({
          summary: input.summary,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(dailySummaries.id, existing.id),
            eq(dailySummaries.userId, ctx.session.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Delete a summary
   */
  delete: protectedProcedure
    .input(z.object({ date: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const dateStr = input.date.toISOString().split('T')[0];

      const existing = await ctx.db.query.dailySummaries.findFirst({
        where: and(
          eq(dailySummaries.userId, ctx.session.user.id),
          eq(dailySummaries.date, dateStr)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Summary not found",
        });
      }

      await ctx.db
        .delete(dailySummaries)
        .where(
          and(
            eq(dailySummaries.id, existing.id),
            eq(dailySummaries.userId, ctx.session.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Get summaries for a date range with statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startStr = input.startDate.toISOString().split('T')[0];
      const endStr = input.endDate.toISOString().split('T')[0];

      const summaries = await ctx.db.query.dailySummaries.findMany({
        where: and(
          eq(dailySummaries.userId, ctx.session.user.id),
          gte(dailySummaries.date, startStr),
          lte(dailySummaries.date, endStr)
        ),
        orderBy: (summaries, { asc }) => asc(summaries.date),
      });

      // Calculate averages
      const count = summaries.length;
      if (count === 0) {
        return {
          summaries: [],
          averages: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            iron: 0,
            magnesium: 0,
            calcium: 0,
            zinc: 0,
            potassium: 0,
          },
          totalDays: 0,
        };
      }

      const totals = summaries.reduce(
        (acc, summary) => ({
          calories: acc.calories + (summary.totalCalories || 0),
          protein: acc.protein + parseFloat(summary.totalProtein || "0"),
          carbs: acc.carbs + parseFloat(summary.totalCarbs || "0"),
          fat: acc.fat + parseFloat(summary.totalFat || "0"),
          fiber: acc.fiber + parseFloat(summary.totalFiber || "0"),
          iron: acc.iron + parseFloat(summary.totalIron || "0"),
          magnesium: acc.magnesium + parseFloat(summary.totalMagnesium || "0"),
          calcium: acc.calcium + parseFloat(summary.totalCalcium || "0"),
          zinc: acc.zinc + parseFloat(summary.totalZinc || "0"),
          potassium: acc.potassium + parseFloat(summary.totalPotassium || "0"),
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          iron: 0,
          magnesium: 0,
          calcium: 0,
          zinc: 0,
          potassium: 0,
        }
      );

      const averages = {
        calories: Math.round(totals.calories / count),
        protein: Math.round((totals.protein / count) * 10) / 10,
        carbs: Math.round((totals.carbs / count) * 10) / 10,
        fat: Math.round((totals.fat / count) * 10) / 10,
        fiber: Math.round((totals.fiber / count) * 10) / 10,
        iron: Math.round((totals.iron / count) * 10) / 10,
        magnesium: Math.round((totals.magnesium / count) * 10) / 10,
        calcium: Math.round((totals.calcium / count) * 10) / 10,
        zinc: Math.round((totals.zinc / count) * 10) / 10,
        potassium: Math.round((totals.potassium / count) * 10) / 10,
      };

      return {
        summaries,
        averages,
        totalDays: count,
      };
    }),
});