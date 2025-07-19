import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * Initialize tRPC with context and plugins
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Public procedure - no authentication required
 * Use for public endpoints like health checks
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 * Throws UNAUTHORIZED if no session exists
 */
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return opts.next({
    ctx: {
      ...ctx,
      // Infers non-nullable session
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Admin procedure - requires admin role
 * Throws FORBIDDEN if user is not an admin
 */
export const adminProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.session.user.role || ctx.session.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource",
    });
  }

  return opts.next({ ctx });
});

/**
 * Rate limited procedure - adds rate limiting to mutations
 * TODO: Implement actual rate limiting with Redis or in-memory store
 */
export const rateLimitedProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, type } = opts;

  if (type === "mutation") {
    // TODO: Implement rate limiting logic
    // For now, just pass through
  }

  return opts.next({ ctx });
});

// Export router and middleware creators
export const router = t.router;
export const middleware = t.middleware;

// Export the tRPC instance for custom use
export { t };
