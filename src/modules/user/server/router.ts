import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc/procedures";
import { users, userProfiles, goals, weightEntries } from "@/server/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { pickBy, mapValues } from "lodash";

export const userRouter = router({
  /**
   * Get current user's profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, ctx.session.user.id),
    });

    return {
      user: ctx.session.user,
      profile,
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        age: z.number().min(1).max(150).optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        height: z.number().min(50).max(300).optional(), // in cm
        weight: z.number().min(20).max(500).optional(), // in kg
        activityLevel: z
          .enum([
            "sedentary",
            "lightly_active",
            "moderately_active",
            "very_active",
            "extra_active",
          ])
          .optional(),
        dietaryRestrictions: z.array(z.string()).optional(),
        timezone: z.string().optional(),
        locale: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, ...profileData } = input;

      // Update user name if provided
      if (name !== undefined) {
        await ctx.db
          .update(users)
          .set({ name })
          .where(eq(users.id, ctx.session.user.id));
      }

      // Check if profile exists
      const existingProfile = await ctx.db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, ctx.session.user.id),
      });

      if (existingProfile) {
        // Update existing profile
        // Filter out undefined values and transform numeric fields to strings
        const filteredData = pickBy(
          profileData,
          (value) => value !== undefined
        );
        const updateData = mapValues(filteredData, (value, key) => {
          // Convert height and weight to strings for database storage
          if (
            (key === "height" || key === "weight") &&
            typeof value === "number"
          ) {
            return value.toString();
          }
          return value;
        });

        await ctx.db
          .update(userProfiles)
          .set(updateData)
          .where(eq(userProfiles.userId, ctx.session.user.id));
      } else {
        // Create new profile
        await ctx.db.insert(userProfiles).values({
          id: nanoid(),
          userId: ctx.session.user.id,
          age: profileData.age,
          gender: profileData.gender,
          height: profileData.height?.toString(),
          weight: profileData.weight?.toString(),
          activityLevel: profileData.activityLevel,
          dietaryRestrictions: profileData.dietaryRestrictions,
          timezone: profileData.timezone,
          locale: profileData.locale,
        });
      }

      return { success: true };
    }),

  /**
   * Get user's active goals
   */
  getActiveGoals: protectedProcedure.query(async ({ ctx }) => {
    const activeGoals = await ctx.db.query.goals.findMany({
      where: and(eq(goals.userId, ctx.session.user.id), eq(goals.active, true)),
      orderBy: desc(goals.createdAt),
    });

    return activeGoals;
  }),

  /**
   * Create a new goal
   */
  createGoal: protectedProcedure
    .input(
      z.object({
        type: z.enum(["weight_loss", "weight_gain", "maintain", "muscle_gain"]),
        targetWeight: z.number().min(20).max(500).optional(),
        targetDate: z.date().optional(),
        dailyCalories: z.number().min(500).max(10000).optional(),
        dailyProtein: z.number().min(0).max(1000).optional(),
        dailyCarbs: z.number().min(0).max(1000).optional(),
        dailyFat: z.number().min(0).max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Deactivate other goals if this is the primary goal
      await ctx.db
        .update(goals)
        .set({ active: false })
        .where(eq(goals.userId, ctx.session.user.id));

      // Create new goal
      const goalId = nanoid();
      await ctx.db.insert(goals).values({
        id: goalId,
        userId: ctx.session.user.id,
        type: input.type,
        targetWeight: input.targetWeight?.toString(),
        targetDate: input.targetDate,
        dailyCalories: input.dailyCalories,
        dailyProtein: input.dailyProtein,
        dailyCarbs: input.dailyCarbs,
        dailyFat: input.dailyFat,
        active: true,
      });

      return { id: goalId };
    }),

  /**
   * Log weight entry
   */
  logWeight: protectedProcedure
    .input(
      z.object({
        weight: z.number().min(20).max(500),
        notes: z.string().max(500).optional(),
        loggedAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const entryId = nanoid();

      await ctx.db.insert(weightEntries).values({
        id: entryId,
        userId: ctx.session.user.id,
        weight: input.weight.toString(),
        notes: input.notes,
        loggedAt: input.loggedAt || new Date(),
      });

      // Update user profile weight
      await ctx.db
        .update(userProfiles)
        .set({ weight: input.weight.toString() })
        .where(eq(userProfiles.userId, ctx.session.user.id));

      return { id: entryId };
    }),

  /**
   * Get weight history
   */
  getWeightHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(30),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db.query.weightEntries.findMany({
        where: eq(weightEntries.userId, ctx.session.user.id),
        orderBy: desc(weightEntries.loggedAt),
        limit: input.limit,
      });

      return entries.map((entry) => ({
        ...entry,
        weight: parseFloat(entry.weight),
      }));
    }),

  /**
   * Complete onboarding
   */
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(userProfiles)
      .set({ onboardingCompleted: true })
      .where(eq(userProfiles.userId, ctx.session.user.id));

    return { success: true };
  }),
});
