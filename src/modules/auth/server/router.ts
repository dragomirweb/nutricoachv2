import { z } from "zod";
import {
  router,
  publicProcedure,
  protectedProcedure,
} from "@/server/trpc/procedures";
import { TRPCError } from "@trpc/server";
import {
  userProfiles,
  goals,
  meals,
  foodItems,
  weightEntries,
} from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";

export const authRouter = router({
  /**
   * Get current session
   */
  getSession: publicProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),

  /**
   * Sign out
   */
  signOut: protectedProcedure.mutation(async () => {
    try {
      // Better Auth handles sign out through its own endpoints
      // This is just a wrapper for consistency
      return { success: true };
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to sign out",
      });
    }
  }),

  /**
   * Delete account
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        confirmation: z.literal("DELETE MY ACCOUNT"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.confirmation !== "DELETE MY ACCOUNT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid confirmation",
        });
      }

      try {
        // Delete user data in correct order to respect foreign key constraints
        await ctx.db.transaction(async (tx) => {
          const userId = ctx.session.user.id;

          // Delete in order: dependent data first
          await tx
            .delete(weightEntries)
            .where(eq(weightEntries.userId, userId));
          await tx
            .delete(foodItems)
            .where(
              eq(
                foodItems.mealId,
                sql`(SELECT id FROM ${meals} WHERE user_id = ${userId})`
              )
            );
          await tx.delete(meals).where(eq(meals.userId, userId));
          await tx.delete(goals).where(eq(goals.userId, userId));
          await tx.delete(userProfiles).where(eq(userProfiles.userId, userId));

          // Finally delete the user account (Better Auth will handle this)
          // await tx.delete(users).where(eq(users.id, userId));
        });

        return { success: true };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete account",
        });
      }
    }),

  /**
   * Update email
   */
  updateEmail: protectedProcedure
    .input(
      z.object({
        newEmail: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async () => {
      // TODO: Verify current password and update email through Better Auth
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Email update not yet implemented",
      });
    }),

  /**
   * Update password
   */
  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async () => {
      // TODO: Verify current password and update through Better Auth
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Password update not yet implemented",
      });
    }),

  /**
   * Get auth providers
   */
  getProviders: publicProcedure.query(async () => {
    // Return available auth providers
    return {
      providers: ["google"], // Based on auth.ts configuration
      passwordEnabled: true,
    };
  }),

  /**
   * Check if email is available
   */
  checkEmailAvailability: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const existingUser = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, input.email),
      });

      return {
        available: !existingUser,
      };
    }),
});
