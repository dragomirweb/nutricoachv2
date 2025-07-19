import { router } from "./procedures";
import { authRouter } from "@/modules/auth/server/router";
import { userRouter } from "@/modules/user/server/router";
import { mealsRouter } from "@/modules/meals/server/router";
import { nutritionRouter } from "@/modules/nutrition/server/router";
import { summariesRouter } from "@/modules/summaries/server/router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /modules/{feature}/server/router.ts should be manually added here.
 */
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  meals: mealsRouter,
  nutrition: nutritionRouter,
  summaries: summariesRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
