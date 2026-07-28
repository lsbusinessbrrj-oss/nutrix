import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getStripe } from "../lib/stripe";

export const paymentRouter = router({
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
