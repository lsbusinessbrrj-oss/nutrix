import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, payments, dietPlans, workoutPlans, adminMessages } from "../../drizzle/schema";
import { desc, eq, like, or, count, sql, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ── Estatísticas gerais ──────────────────────────────────────────────────
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const preco = Number(process.env.PRECO_DIETA ?? "9.99");

    const [totalUsers] = await db.select({ count: count() }).from(users);
    // Compras concluídas (pagamentos "completed").
    const [totalPayments] = await db.select({ count: count() }).from(payments).where(eq(payments.status, "completed"));
    // Assinaturas ativas (clientes com plano pago liberado).
    const [assinantes] = await db.select({ count: count() }).from(users).where(eq(users.hasPaidPlan, true));
    const [totalDietPlans] = await db.select({ count: count() }).from(dietPlans);
    const [totalWorkoutPlans] = await db.select({ count: count() }).from(workoutPlans);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [newUsersWeek] = await db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= ${sevenDaysAgo}`);
    const [comprasWeek] = await db.select({ count: count() }).from(payments)
      .where(and(eq(payments.status, "completed"), sql`${payments.createdAt} >= ${sevenDaysAgo}`));

    // Série dos últimos 14 dias: cadastros e compras por dia.
    // Agrupamos em JS (e não via DATE()/GROUP BY no SQL) para evitar incompatibilidades do TiDB.
    const catorzeDias = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const bucketDia = (rows: { createdAt: Date | string | null }[]) => {
      const m: Record<string, number> = {};
      for (const r of rows) {
        if (!r.createdAt) continue;
        const dia = new Date(r.createdAt).toISOString().slice(0, 10);
        m[dia] = (m[dia] ?? 0) + 1;
      }
      return Object.entries(m).map(([dia, c]) => ({ dia, c }));
    };
    let cadastrosDia: { dia: string; c: number }[] = [];
    let comprasDia: { dia: string; c: number }[] = [];
    try {
      const cadRows = await db.select({ createdAt: users.createdAt }).from(users).where(sql`${users.createdAt} >= ${catorzeDias}`);
      const compRows = await db.select({ createdAt: payments.createdAt }).from(payments)
        .where(and(eq(payments.status, "completed"), sql`${payments.createdAt} >= ${catorzeDias}`));
      cadastrosDia = bucketDia(cadRows);
      comprasDia = bucketDia(compRows);
    } catch { /* série é opcional — não derruba o dashboard */ }

    const compras = totalPayments?.count ?? 0;
    const totUsers = totalUsers?.count ?? 0;
    const ativos = assinantes?.count ?? 0;
    return {
      totalUsers: totUsers,
      totalPayments: compras,                 // compras concluídas
      assinantes: ativos,                     // assinaturas ativas
      receita: Math.round(compras * preco * 100) / 100,
      precoUnitario: preco,
      conversao: totUsers ? Math.round((ativos / totUsers) * 1000) / 10 : 0, // % de conversão
      newUsersWeek: newUsersWeek?.count ?? 0,
      comprasWeek: comprasWeek?.count ?? 0,
      totalDietPlans: totalDietPlans?.count ?? 0,
      totalWorkoutPlans: totalWorkoutPlans?.count ?? 0,
      serie: { cadastros: cadastrosDia, compras: comprasDia },
    };
  }),

  // ── Listagem de usuários ─────────────────────────────────────────────────
  listUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const offset = (input.page - 1) * input.limit;
      const cols = {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        loginMethod: users.loginMethod,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
        hasPaidPlan: users.hasPaidPlan,
        weight: users.weight,
        height: users.height,
        goal: users.goal,
      };

      const rows = input.search
        ? await db.select(cols).from(users)
            .where(or(like(users.name, `%${input.search}%`), like(users.email, `%${input.search}%`)))
            .orderBy(desc(users.createdAt)).limit(input.limit).offset(offset)
        : await db.select(cols).from(users)
            .orderBy(desc(users.createdAt)).limit(input.limit).offset(offset);

      const [totalRow] = input.search
        ? await db.select({ count: count() }).from(users)
            .where(or(like(users.name, `%${input.search}%`), like(users.email, `%${input.search}%`)))
        : await db.select({ count: count() }).from(users);

      return { rows, total: totalRow?.count ?? 0, page: input.page, limit: input.limit };
    }),

  // ── Detalhes de um usuário ───────────────────────────────────────────────
  getUserDetail: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const userPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.userId, input.userId))
        .orderBy(desc(payments.createdAt));

      const userDietPlans = await db
        .select({ id: dietPlans.id, totalCalories: dietPlans.totalCalories, createdAt: dietPlans.createdAt, isActive: dietPlans.isActive })
        .from(dietPlans)
        .where(eq(dietPlans.userId, input.userId))
        .orderBy(desc(dietPlans.createdAt));

      return { user, payments: userPayments, dietPlans: userDietPlans };
    }),

  // ── Alterar role do usuário ──────────────────────────────────────────────
  setUserRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode alterar sua própria role." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ── Listagem de pagamentos ───────────────────────────────────────────────
  listPayments: adminProcedure
    .input(z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const offset = (input.page - 1) * input.limit;
      const paymentCols = {
        id: payments.id,
        userId: payments.userId,
        userName: users.name,
        userEmail: users.email,
        stripeSessionId: payments.stripeSessionId,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        status: payments.status,
        planType: sql<string>`'básico'`,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
      };

      const rows = !input.status
        ? await db.select(paymentCols).from(payments)
            .leftJoin(users, eq(payments.userId, users.id))
            .orderBy(desc(payments.createdAt)).limit(input.limit).offset(offset)
        : await db.select(paymentCols).from(payments)
            .leftJoin(users, eq(payments.userId, users.id))
            .where(eq(payments.status, input.status as any))
            .orderBy(desc(payments.createdAt)).limit(input.limit).offset(offset);

      const [totalRow] = !input.status
        ? await db.select({ count: count() }).from(payments)
        : await db.select({ count: count() }).from(payments).where(eq(payments.status, input.status as any));

      return { rows, total: totalRow?.count ?? 0, page: input.page, limit: input.limit };
    }),

  // ── Detalhes do plano alimentar de um usuário ────────────────────────────
  getDietPlanDetail: adminProcedure
    .input(z.object({ dietPlanId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [plan] = await db
        .select({ id: dietPlans.id, userId: dietPlans.userId, totalCalories: dietPlans.totalCalories, planData: dietPlans.planData, isActive: dietPlans.isActive, createdAt: dietPlans.createdAt })
        .from(dietPlans).where(eq(dietPlans.id, input.dietPlanId)).limit(1);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND" });
      const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, plan.userId)).limit(1);
      return { ...plan, user };
    }),

  // ── Mensagens admin → usuário ────────────────────────────────────────────
  sendMessage: adminProcedure
    .input(z.object({ toUserId: z.number(), subject: z.string().min(1), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(adminMessages).values({ fromUserId: ctx.user.id, toUserId: input.toUserId, subject: input.subject, message: input.message });
      return { success: true };
    }),

  listMessages: adminProcedure
    .input(z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(50).default(20), toUserId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const offset = (input.page - 1) * input.limit;
      const cols = { id: adminMessages.id, fromUserId: adminMessages.fromUserId, toUserId: adminMessages.toUserId, subject: adminMessages.subject, message: adminMessages.message, isRead: adminMessages.isRead, createdAt: adminMessages.createdAt, toUserName: users.name, toUserEmail: users.email };
      const rows = input.toUserId
        ? await db.select(cols).from(adminMessages).leftJoin(users, eq(adminMessages.toUserId, users.id)).where(eq(adminMessages.toUserId, input.toUserId)).orderBy(desc(adminMessages.createdAt)).limit(input.limit).offset(offset)
        : await db.select(cols).from(adminMessages).leftJoin(users, eq(adminMessages.toUserId, users.id)).orderBy(desc(adminMessages.createdAt)).limit(input.limit).offset(offset);
      const [totalRow] = input.toUserId
        ? await db.select({ count: count() }).from(adminMessages).where(eq(adminMessages.toUserId, input.toUserId))
        : await db.select({ count: count() }).from(adminMessages);
      return { rows, total: totalRow?.count ?? 0 };
    }),

  markMessageRead: adminProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(adminMessages).set({ isRead: true }).where(eq(adminMessages.id, input.messageId));
      return { success: true };
    }),

  // ── Exportação CSV ───────────────────────────────────────────────────────
  exportUsersCSV: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, goal: users.goal, weight: users.weight, height: users.height, hasPaidPlan: users.hasPaidPlan, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt));
    const header = "ID,Nome,Email,Role,Objetivo,Peso,Altura,Plano Pago,Cadastro";
    const csvRows = rows.map(r => `${r.id},"${r.name ?? ""}","${r.email ?? ""}",${r.role},"${r.goal ?? ""}",${r.weight ?? ""},${r.height ?? ""},${r.hasPaidPlan ? "Sim" : "Não"},"${r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : ""}"`);
    return { csv: [header, ...csvRows].join("\n") };
  }),

  exportPaymentsCSV: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select({ id: payments.id, userName: users.name, userEmail: users.email, status: payments.status, stripePaymentIntentId: payments.stripePaymentIntentId, createdAt: payments.createdAt }).from(payments).leftJoin(users, eq(payments.userId, users.id)).orderBy(desc(payments.createdAt));
    const header = "ID,Usuário,Email,Status,ID Stripe,Data";
    const csvRows = rows.map(r => `${r.id},"${r.userName ?? ""}","${r.userEmail ?? ""}",${r.status},"${r.stripePaymentIntentId ?? ""}","${r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : ""}"`);
    return { csv: [header, ...csvRows].join("\n") };
  }),

  // ── Mensagens recebidas pelo usuário (para notificação) ──────────────────
  getMyMessages: protectedProcedure
    .input(z.object({ onlyUnread: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { rows: [], total: 0 };
      const rows = input.onlyUnread
        ? await db.select().from(adminMessages).where(and(eq(adminMessages.toUserId, ctx.user.id), eq(adminMessages.isRead, false))).orderBy(desc(adminMessages.createdAt))
        : await db.select().from(adminMessages).where(eq(adminMessages.toUserId, ctx.user.id)).orderBy(desc(adminMessages.createdAt));
      return { rows, total: rows.length };
    }),

  markMyMessageRead: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(adminMessages).set({ isRead: true }).where(and(eq(adminMessages.id, input.messageId), eq(adminMessages.toUserId, ctx.user.id)));
      return { success: true };
    }),
});
