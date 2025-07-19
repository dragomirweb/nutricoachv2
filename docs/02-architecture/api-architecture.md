# API Architecture with tRPC

This document outlines the tRPC-based API architecture for NutriCoach v2, implementing type-safe, end-to-end APIs with proper authentication and authorization.

## Overview

NutriCoach uses tRPC v11 for building type-safe APIs that seamlessly integrate with Next.js. The architecture provides:
- End-to-end type safety without code generation
- Automatic type inference
- Built-in error handling
- Context-based authentication
- Composable middleware

## Core Setup

### tRPC Context

The context provides shared data to all procedures:

```typescript
// src/server/trpc/context.ts
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  });

  return {
    db,
    session,
    req: opts.req,
    res: opts.res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### Base Procedures

Define reusable procedures with authentication:

```typescript
// src/server/trpc/procedures.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";

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

// Public procedure - no authentication required
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
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
      session: ctx.session,
    },
  });
});

// Admin procedure - requires admin role
export const adminProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;
  
  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({ 
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource",
    });
  }
  
  return opts.next({ ctx });
});

export const router = t.router;
export const middleware = t.middleware;
```

## Router Structure

### Root Router

Combine feature routers into the main app router:

```typescript
// src/server/trpc/router.ts
import { router } from "./procedures";
import { authRouter } from "@/modules/auth/server/router";
import { mealsRouter } from "@/modules/meals/server/router";
import { nutritionRouter } from "@/modules/nutrition/server/router";
import { userRouter } from "@/modules/user/server/router";

export const appRouter = router({
  auth: authRouter,
  meals: mealsRouter,
  nutrition: nutritionRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

### Feature Router Example

Example meals router with CRUD operations:

```typescript
// src/modules/meals/server/router.ts
import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc/procedures";
import { meals, foodItems } from "@/server/db/schema";
import { createMealSchema, updateMealSchema } from "../schemas";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const mealsRouter = router({
  // List meals with pagination
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().nullish(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor, startDate, endDate } = input;
      
      const conditions = [eq(meals.userId, ctx.session.user.id)];
      
      if (startDate) {
        conditions.push(gte(meals.loggedAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(meals.loggedAt, endDate));
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

  // Get single meal
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

  // Create meal
  create: protectedProcedure
    .input(createMealSchema)
    .mutation(async ({ ctx, input }) => {
      const mealId = createId();
      
      // Calculate totals
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
          ...totals,
          aiParsed: input.aiParsed || false,
        });
        
        // Insert food items
        if (input.foodItems.length > 0) {
          await tx.insert(foodItems).values(
            input.foodItems.map(item => ({
              id: createId(),
              mealId,
              ...item,
            }))
          );
        }
      });
      
      return { id: mealId };
    }),

  // Update meal
  update: protectedProcedure
    .input(updateMealSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Verify ownership
      const existing = await ctx.db.query.meals.findFirst({
        where: and(
          eq(meals.id, id),
          eq(meals.userId, ctx.session.user.id)
        ),
      });
      
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal not found",
        });
      }
      
      // Recalculate totals if food items changed
      const totals = data.foodItems 
        ? calculateMealTotals(data.foodItems)
        : {};
      
      await ctx.db.transaction(async (tx) => {
        // Update meal
        await tx.update(meals)
          .set({
            ...data,
            ...totals,
            updatedAt: new Date(),
          })
          .where(eq(meals.id, id));
        
        // Update food items if provided
        if (data.foodItems) {
          // Delete existing items
          await tx.delete(foodItems).where(eq(foodItems.mealId, id));
          
          // Insert new items
          if (data.foodItems.length > 0) {
            await tx.insert(foodItems).values(
              data.foodItems.map(item => ({
                id: createId(),
                mealId: id,
                ...item,
              }))
            );
          }
        }
      });
      
      return { success: true };
    }),

  // Delete meal
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.delete(meals)
        .where(and(
          eq(meals.id, input.id),
          eq(meals.userId, ctx.session.user.id)
        ));
      
      if (result.rowCount === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal not found",
        });
      }
      
      return { success: true };
    }),

  // AI parse meal description
  parseWithAI: protectedProcedure
    .input(z.object({
      description: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Call OpenAI to parse meal
      const parsedMeal = await parseMealWithAI(input.description);
      
      return parsedMeal;
    }),
});
```

## Error Handling

Consistent error handling across the API:

```typescript
// Common error patterns
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Resource not found",
});

throw new TRPCError({
  code: "FORBIDDEN",
  message: "You don't have permission to access this resource",
});

throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid input data",
  cause: error, // Original error for debugging
});

// Custom error handling in procedures
.mutation(async ({ ctx, input }) => {
  try {
    // Operation that might fail
    const result = await riskyOperation();
    return result;
  } catch (error) {
    // Log for monitoring
    console.error("Operation failed:", error);
    
    // Return user-friendly error
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
});
```

## Middleware Patterns

### Rate Limiting

```typescript
const rateLimitMiddleware = middleware(async (opts) => {
  const { ctx, next, type } = opts;
  
  if (type === "mutation" && ctx.session) {
    const key = `rate_limit:${ctx.session.user.id}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 60); // 1 minute window
    }
    
    if (count > 10) { // 10 requests per minute
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please try again later.",
      });
    }
  }
  
  return next();
});

// Apply to specific procedures
export const rateLimitedProcedure = protectedProcedure
  .use(rateLimitMiddleware);
```

### Logging

```typescript
const loggingMiddleware = middleware(async (opts) => {
  const start = Date.now();
  const { path, type, ctx } = opts;
  
  const result = await opts.next();
  
  const duration = Date.now() - start;
  const userId = ctx.session?.user.id || "anonymous";
  
  console.log({
    path,
    type,
    userId,
    duration,
    ok: result.ok,
  });
  
  return result;
});
```

## Client Integration

### Type-Safe Client

```typescript
// src/lib/trpc-client.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/trpc/router";

export const trpc = createTRPCReact<AppRouter>();
```

### Next.js App Router Setup

```typescript
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/router";
import { createContext } from "@/server/trpc/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

### React Query Provider

```typescript
// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/lib/trpc-client";
import superjson from "superjson";

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```