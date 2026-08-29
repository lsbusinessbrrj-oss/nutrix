import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { gerarTreino } from "../lib/workout/engine";

export const workoutRouter = router({
  getActivePlan: protectedProcedure.query(async ({ ctx }) => {
    return db.getActiveWorkoutPlan(ctx.user.id);
  }),

  generatePlan: protectedProcedure
    .input(z.object({
      location: z.enum(["gym", "home"]),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      daysPerWeek: z.number().min(1).max(7),
      muscleGroups: z.array(z.string()),
      workoutGoal: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Geração determinística (sem IA): monta o split a partir das escolhas.
      const planData = gerarTreino(input);
      await db.createWorkoutPlan(ctx.user.id, { ...input, planData });
      return { success: true, plan: planData };
    }),
});

