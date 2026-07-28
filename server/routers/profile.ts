import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserById(ctx.user.id);
  }),

  update: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      weight: z.number().optional(),
      height: z.number().optional(),
      age: z.number().optional(),
      sex: z.enum(["male", "female"]).optional(),
      goal: z.string().optional(),
      avatarUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  getStreak: protectedProcedure.query(async ({ ctx }) => {
    return db.getStreakDays(ctx.user.id);
  }),

  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserAchievements(ctx.user.id);
  }),

  getSupportMessages: protectedProcedure.query(async ({ ctx }) => {
    return db.getSupportMessages(ctx.user.id);
  }),

  sendSupportMessage: protectedProcedure
    .input(z.object({ message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db.addSupportMessage(ctx.user.id, input.message, false);
      return { success: true };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return db.getUnreadCount(ctx.user.id);
  }),
});

