// Mercado Pago — pagamento por Pix.
// Com MP_ACCESS_TOKEN configurado, cria um Pix de verdade (QR + copia-e-cola).
// Sem token, retorna um Pix "de simulação" para testar o fluxo ponta a ponta.
import { MercadoPagoConfig, Payment, Preference, PreApproval } from "mercadopago";

export const PRECO_DIETA = Number(process.env.PRECO_DIETA ?? "9.99");
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export interface PixResult {
  paymentId: string;
  copiaECola: string;      // código Pix copia-e-cola
  qrBase64?: string;       // imagem do QR (base64 PNG) quando disponível
  simulado: boolean;
}

export async function criarPix(email: string, nome: string, userId?: number): Promise<PixResult> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    // Modo simulação — sem cobrança real.
    return {
      paymentId: `sim_${Date.now()}`,
      copiaECola: "00020126SIMULACAO-NUTRIX-PIX-R$9,99-5204000053039865802BR6009SAO PAULO62070503***6304ABCD",
      simulado: true,
    };
  }
  const client = new MercadoPagoConfig({ accessToken: token });
  const payment = new Payment(client);
  const res = await payment.create({
    body: {
      transaction_amount: PRECO_DIETA,
      description: "Plano alimentar personalizado NutriX",
      payment_method_id: "pix",
      payer: { email, first_name: nome.split(" ")[0] },
      external_reference: userId != null ? String(userId) : undefined,
      notification_url: `${APP_URL}/api/mp/webhook`,
    },
  });
  const tx = (res as any).point_of_interaction?.transaction_data;
  return {
    paymentId: String(res.id),
    copiaECola: tx?.qr_code ?? "",
    qrBase64: tx?.qr_code_base64,
    simulado: false,
  };
}

export interface CheckoutResult { url: string; simulado: boolean }

/**
 * Checkout Pro — uma tela hospedada do Mercado Pago que oferece
 * cartão de crédito, cartão de débito, Pix e boleto.
 */
export async function criarCheckout(email: string, nome: string, userId?: number): Promise<CheckoutResult> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return { url: `${APP_URL}/pagamento?sim=checkout`, simulado: true };
  const client = new MercadoPagoConfig({ accessToken: token });
  const pref = new Preference(client);
  const res = await pref.create({
    body: {
      items: [{ id: "dieta-nutrix", title: "Plano alimentar NutriX", quantity: 1, unit_price: PRECO_DIETA, currency_id: "BRL" }],
      payer: { email, name: nome.split(" ")[0] },
      external_reference: userId != null ? String(userId) : undefined,
      notification_url: `${APP_URL}/api/mp/webhook`,
      back_urls: {
        success: `${APP_URL}/dietas?pago=1`,
        failure: `${APP_URL}/pagamento?status=falha`,
        pending: `${APP_URL}/pagamento?status=pendente`,
      },
      auto_return: "approved",
      statement_descriptor: "NUTRIX",
    },
  });
  const url = res.init_point ?? res.sandbox_init_point;
  if (!url) throw new Error("Mercado Pago não retornou a URL do checkout.");
  return { url, simulado: false };
}

/** Assinatura recorrente (mensal) — cobrança automática via Mercado Pago. */
export async function criarAssinatura(email: string, userId?: number, valor = PRECO_DIETA): Promise<CheckoutResult> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return { url: `${APP_URL}/pagamento?sim=assinatura`, simulado: true };
  const client = new MercadoPagoConfig({ accessToken: token });
  const pre = new PreApproval(client);
  const res = await pre.create({
    body: {
      reason: "Assinatura NutriX (mensal)",
      auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: valor, currency_id: "BRL" },
      back_url: `${APP_URL}/dietas?assinou=1`,
      payer_email: email,
      external_reference: userId != null ? String(userId) : undefined,
      status: "pending",
    },
  });
  const url = (res as any).init_point;
  if (!url) throw new Error("Mercado Pago não retornou a URL da assinatura.");
  return { url, simulado: false };
}

/** Consulta o status de um pagamento (approved/pending/rejected). */
export async function statusPagamento(paymentId: string): Promise<string> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token || paymentId.startsWith("sim_")) return "pending";
  const client = new MercadoPagoConfig({ accessToken: token });
  const payment = new Payment(client);
  const res = await payment.get({ id: paymentId });
  return res.status ?? "pending";
}

/** Detalhes de um pagamento (para o webhook): status + quem pagou. */
export async function detalhePagamento(id: string): Promise<{ status: string; externalReference?: string; email?: string }> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token || id.startsWith("sim_")) return { status: "pending" };
  const client = new MercadoPagoConfig({ accessToken: token });
  const res = await new Payment(client).get({ id });
  return { status: res.status ?? "pending", externalReference: (res as any).external_reference ?? undefined, email: res.payer?.email ?? undefined };
}

/** Detalhes de uma assinatura/preapproval (para o webhook). */
export async function detalheAssinatura(id: string): Promise<{ status: string; externalReference?: string; email?: string }> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return { status: "pending" };
  const client = new MercadoPagoConfig({ accessToken: token });
  const res = await new PreApproval(client).get({ id });
  return { status: (res as any).status ?? "pending", externalReference: (res as any).external_reference ?? undefined, email: (res as any).payer_email ?? undefined };
}
