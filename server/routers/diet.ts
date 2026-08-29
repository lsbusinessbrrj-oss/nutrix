import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { gerarPlano } from "../lib/diet/generatePlan";
import type { Atividade, Objetivo, Sexo } from "../lib/diet/engine";

export const dietRouter = router({
  getActivePlan: protectedProcedure.query(async ({ ctx }) => {
    return db.getActiveDietPlan(ctx.user.id);
  }),

  saveFormData: protectedProcedure
    .input(z.object({
      weight: z.number().optional(),
      height: z.number().optional(),
      age: z.number().optional(),
      sex: z.enum(["male", "female"]).optional(),
      goal: z.string().optional(),
      dailyCalories: z.string().optional(),
      mealTimes: z.string().optional(),
      routineType: z.string().optional(),
      activityLevel: z.string().optional(),
      wantsWorkout: z.boolean().optional(),
      wantsChocolate: z.boolean().optional(),
      phone: z.string().optional(),
      healthConditions: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  saveFoodSelections: protectedProcedure
    .input(z.object({
      selections: z.array(z.object({
        mealType: z.string(),
        foods: z.array(z.string()),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      for (const sel of input.selections) {
        await db.upsertFoodSelection(ctx.user.id, sel.mealType, sel.foods);
      }
      return { success: true };
    }),

  generatePlan: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) throw new Error("Usuário não encontrado");
    if (!user.hasPaidPlan) throw new Error("Pagamento necessário para gerar o plano");

    // Dados obrigatórios para um cálculo correto.
    if (user.weight == null || user.height == null || user.age == null || !user.sex) {
      throw new Error(
        "Complete seu perfil (peso, altura, idade e sexo) para gerar o plano com precisão.",
      );
    }

    // Escolhas de alimentos do cliente (por refeição), para o plano respeitá-las.
    const foodSels = await db.getUserFoodSelections(ctx.user.id);
    const selecoes: Record<string, string[]> = {};
    for (const s of foodSels) selecoes[s.mealType] = (s.foods as string[]) ?? [];

    // Geração DETERMINÍSTICA: calorias (Mifflin-St Jeor) e proteína exata por kg,
    // respeitando as escolhas e sempre com carboidrato + proteína por refeição.
    const planData = gerarPlano(
      {
        sexo: user.sex as Sexo,
        peso: Number(user.weight),
        altura: Number(user.height),
        idade: Number(user.age),
        objetivo: (user.goal ?? "maintenance") as Objetivo,
        atividade: (user.activityLevel ?? "moderado") as Atividade,
      },
      (user as any).healthConditions,
      selecoes,
    );

    await db.createDietPlan(ctx.user.id, planData.totalCalories, planData);
    await db.recordStreakDay(ctx.user.id);
    return { success: true, plan: planData };
  }),
});
