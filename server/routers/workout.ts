import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";

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
      const locationLabel = input.location === "gym" ? "Academia" : "Casa";
      const levelLabel = { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" }[input.level];

      const prompt = `Você é um personal trainer especializado. Crie um plano de treino completo em JSON para:
- Local: ${locationLabel}
- Nível: ${levelLabel}
- Dias por semana: ${input.daysPerWeek}
- Grupos musculares: ${input.muscleGroups.join(", ")}
- Objetivo: ${input.workoutGoal}
Retorne APENAS JSON válido (sem markdown) com estrutura:
{"summary":"Treino de ${input.daysPerWeek}x por semana","days":[{"day":"Segunda-feira","focus":"Peito e Tríceps","exercises":[{"name":"Supino reto","sets":4,"reps":"10-12","rest":"60s","notes":"Controle a descida"}]}]}
Crie ${input.daysPerWeek} dias de treino com 4-6 exercícios cada.`;

      const response = await invokeLLM({ messages: [{ role: "user", content: prompt }], model: "gpt-4o-mini", max_tokens: 3000 });
      const content = (response.choices[0]?.message?.content as string) ?? "{}";
      let planData: any;
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        planData = JSON.parse(cleaned);
      } catch {
        planData = { days: [] };
      }

      await db.createWorkoutPlan(ctx.user.id, { ...input, planData });
      return { success: true, plan: planData };
    }),
});

