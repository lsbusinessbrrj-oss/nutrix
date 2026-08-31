// Autenticação própria por e-mail/senha (substitui o OAuth do Manus).
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import type { TrpcContext } from "../_core/context";
import { publicProcedure, router } from "../_core/trpc";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { conferirSenha, hashSenha } from "../auth/password";
import { assinarSessao } from "../auth/session";
import { protectedProcedure } from "../_core/trpc";

// Nunca devolver o hash da senha para o cliente.
function semSenha(user: User | null) {
  if (!user) return null;
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}

async function iniciarSessao(ctx: TrpcContext, userId: number) {
  const token = await assinarSessao(userId);
  const opts = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, token, { ...opts, maxAge: ONE_YEAR_MS });
}

export const authRouter = router({
  me: publicProcedure.query((opts) => semSenha(opts.ctx.user)),

  logout: publicProcedure.mutation(({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...opts, maxAge: -1 });
    return { success: true } as const;
  }),

  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres"),
        name: z.string().max(80).optional(),
        phone: z.string().max(30).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim();
      const existente = await db.getUserByEmail(email);
      if (existente) {
        throw new TRPCError({ code: "CONFLICT", message: "Já existe uma conta com este e-mail." });
      }
      const passwordHash = await hashSenha(input.password);
      const phone = input.phone?.replace(/\D/g, "") ? input.phone.trim() : null;
      const user = await db.createLocalUser({ email, passwordHash, name: input.name ?? null, phone });
      await iniciarSessao(ctx, user.id);
      return { success: true, user: semSenha(user) };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("E-mail inválido"),
        password: z.string().min(1, "Informe a senha"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim();
      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
      }
      const ok = await conferirSenha(input.password, user.passwordHash);
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
      }
      await iniciarSessao(ctx, user.id);
      return { success: true, user: semSenha(user) };
    }),

  // Atualiza o perfil do cliente (nome e/ou foto). A foto vem como data URL
  // (imagem já redimensionada no cliente); guardamos em avatarUrl.
  atualizarPerfil: protectedProcedure
    .input(
      z.object({
        name: z.string().max(80).optional(),
        avatarUrl: z.string().max(1_500_000).optional(), // data URL da foto (base64)
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name.trim() || null;
      if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl || null;
      if (Object.keys(data).length) await db.updateUserProfile(ctx.user.id, data);
      return { ok: true };
    }),

  // Cancela apenas a assinatura (mantém a conta).
  cancelarAssinatura: protectedProcedure.mutation(async ({ ctx }) => {
    await db.updateUserProfile(ctx.user.id, { hasPaidPlan: false });
    // Cancelamento no Mercado Pago é feito com o id da assinatura (quando MP configurado).
    return { ok: true };
  }),

  // Exclui a conta e todos os dados (cancela a assinatura junto). LGPD.
  excluirConta: protectedProcedure.mutation(async ({ ctx }) => {
    await db.deleteUser(ctx.user.id);
    const opts = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...opts, maxAge: -1 });
    return { ok: true };
  }),
});
