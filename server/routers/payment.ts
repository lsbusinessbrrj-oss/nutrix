import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getStripe } from "../lib/stripe";
import { criarPix, criarCheckout, criarAssinatura, statusPagamento, detalhePagamento, detalheAssinatura, PRECO_DIETA } from "../lib/payments/mercadopago";
import { entregarDieta, confirmarAssinatura } from "../lib/delivery";

// Modo teste ligado por variável de ambiente DO SERVIDOR (não confiar no client).
const MODO_TESTE = process.env.MODO_TESTE === "1" || process.env.VITE_MODO_TESTE === "1";

export const paymentRouter = router({
  // ── Mercado Pago ──
  // Pix direto (QR + copia-e-cola).
  criarPix: protectedProcedure.mutation(async ({ ctx }) => {
    const email = ctx.user.email ?? "cliente@nutrix.com.br";
    const pix = await criarPix(email, ctx.user.name ?? "Cliente", ctx.user.id);
    await db.createPayment(ctx.user.id, pix.paymentId);
    return { ...pix, preco: PRECO_DIETA };
  }),

  // Checkout Pro: cartão de crédito, cartão de débito, Pix e boleto numa tela.
  criarCheckout: protectedProcedure.mutation(async ({ ctx }) => {
    return criarCheckout(ctx.user.email ?? "cliente@nutrix.com.br", ctx.user.name ?? "Cliente", ctx.user.id);
  }),

  // Assinatura recorrente (mensal).
  criarAssinatura: protectedProcedure.mutation(async ({ ctx }) => {
    return criarAssinatura(ctx.user.email ?? "cliente@nutrix.com.br", ctx.user.id);
  }),

  // Confirma um Pix real (consulta o status no Mercado Pago) e, se aprovado,
  // libera e entrega a dieta.
  confirmarPix: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const det = await detalhePagamento(input.paymentId);
      if (det.status !== "approved") return { aprovado: false, status: det.status };
      // Segurança: o pagamento tem que ser DESTE usuário (external_reference = userId).
      if (det.externalReference && det.externalReference !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Pagamento não corresponde à sua conta." });
      }
      const status = det.status;
      await db.updateUserProfile(ctx.user.id, { hasPaidPlan: true });
      let entrega = null;
      try { entrega = await entregarDieta(ctx.user.id); }
      catch (e) { console.error("[confirmarPix] entrega falhou:", (e as Error).message); }
      return { aprovado: true, status, entrega };
    }),

  // Confirma a assinatura no retorno do Mercado Pago (?preapproval_id=...).
  // Rede de segurança pra liberar na hora, mesmo que o webhook demore.
  verificarAssinatura: protectedProcedure
    .input(z.object({ preapprovalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const det = await detalheAssinatura(input.preapprovalId);
      // Segurança: a assinatura tem que ser DESTE usuário.
      if (det.externalReference && det.externalReference !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Assinatura não corresponde à sua conta." });
      }
      if (det.status !== "authorized") return { aprovado: false, status: det.status };
      await db.updateUserProfile(ctx.user.id, { hasPaidPlan: true, assinaturaCancelada: false });
      let entrega = null;
      try {
        await confirmarAssinatura(ctx.user.id);
        entrega = await entregarDieta(ctx.user.id);
      } catch (e) { console.error("[verificarAssinatura] entrega falhou:", (e as Error).message); }
      return { aprovado: true, status: det.status, entrega };
    }),

  // Simula a aprovação do pagamento (para testes): libera e entrega a dieta.
  // A entrega é "best-effort": se falhar (ex.: perfil incompleto), o pagamento
  // continua aprovado (o cliente pagou) — a dieta pode ser gerada depois no app.
  simularAprovacao: protectedProcedure.mutation(async ({ ctx }) => {
    // Só funciona em modo teste (trava do lado do servidor). Em produção real,
    // ninguém libera plano sem pagar chamando esta rota direto.
    if (!MODO_TESTE) throw new TRPCError({ code: "FORBIDDEN", message: "Indisponível." });
    await db.updateUserProfile(ctx.user.id, { hasPaidPlan: true });
    try {
      await confirmarAssinatura(ctx.user.id); // e-mail de "assinatura ativada"
      const entrega = await entregarDieta(ctx.user.id);
      return { aprovado: true, entrega };
    } catch (e) {
      console.error("[simularAprovacao] entrega falhou:", (e as Error).message);
      return { aprovado: true, entrega: null };
    }
  }),

  createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const origin = (ctx.req.headers.origin as string) ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: ctx.user.email ?? undefined,
      line_items: [{
        price_data: {
          currency: "brl",
          product_data: {
            name: "Plano Alimentar NutriX",
            description: "Plano alimentar personalizado com IA + 5 opções por refeição",
          },
          unit_amount: 999,
        },
        quantity: 1,
      }],
      client_reference_id: ctx.user.id.toString(),
      metadata: {
        user_id: ctx.user.id.toString(),
        customer_email: ctx.user.email ?? "",
        customer_name: ctx.user.name ?? "",
      },
      allow_promotion_codes: true,
      success_url: `${origin}/dietas?payment=success`,
      cancel_url: `${origin}/home?payment=cancelled`,
    });

    await db.createPayment(ctx.user.id, session.id);
    return { url: session.url };
  }),

  checkStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    return { hasPaidPlan: user?.hasPaidPlan ?? false };
  }),
});
