import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getStripe } from "../lib/stripe";
import { criarPix, criarCheckout, criarAssinatura, statusPagamento, PRECO_DIETA } from "../lib/payments/mercadopago";
import { entregarDieta, confirmarAssinatura } from "../lib/delivery";

export const paymentRouter = router({
  // ── Mercado Pago ──
  // Pix direto (QR + copia-e-cola).
  criarPix: protectedProcedure.mutation(async ({ ctx }) => {
    const email = ctx.user.email ?? "cliente@nutrix.com.br";
    const pix = await criarPix(email, ctx.user.name ?? "Cliente");
    await db.createPayment(ctx.user.id, pix.paymentId);
    return { ...pix, preco: PRECO_DIETA };
  }),

  // Checkout Pro: cartão de crédito, cartão de débito, Pix e boleto numa tela.
  criarCheckout: protectedProcedure.mutation(async ({ ctx }) => {
    return criarCheckout(ctx.user.email ?? "cliente@nutrix.com.br", ctx.user.name ?? "Cliente");
  }),

  // Assinatura recorrente (mensal).
  criarAssinatura: protectedProcedure.mutation(async ({ ctx }) => {
    return criarAssinatura(ctx.user.email ?? "cliente@nutrix.com.br");
  }),

  // Confirma um Pix real (consulta o status no Mercado Pago) e, se aprovado,
  // libera e entrega a dieta.
  confirmarPix: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const status = await statusPagamento(input.paymentId);
      if (status !== "approved") return { aprovado: false, status };
      await db.updateUserProfile(ctx.user.id, { hasPaidPlan: true });
      const entrega = await entregarDieta(ctx.user.id);
      return { aprovado: true, status, entrega };
    }),

  // Simula a aprovação do pagamento (para testes): libera e entrega a dieta.
  simularAprovacao: protectedProcedure.mutation(async ({ ctx }) => {
    await db.updateUserProfile(ctx.user.id, { hasPaidPlan: true });
    await confirmarAssinatura(ctx.user.id); // e-mail + WhatsApp de "assinatura ativada"
    const entrega = await entregarDieta(ctx.user.id);
    return { aprovado: true, entrega };
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
