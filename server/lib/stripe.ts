// Cliente Stripe preguiçoso: só é criado quando realmente usado, para o
// servidor conseguir subir mesmo sem a chave configurada ainda.
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Stripe não configurado. Defina STRIPE_SECRET_KEY no .env.");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}
