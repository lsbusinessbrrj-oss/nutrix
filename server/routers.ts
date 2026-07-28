import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { dietRouter } from "./routers/diet";
import { workoutRouter } from "./routers/workout";
import { profileRouter } from "./routers/profile";
import { paymentRouter } from "./routers/payment";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  diet: dietRouter,
  workout: workoutRouter,
  profile: profileRouter,
  payment: paymentRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
