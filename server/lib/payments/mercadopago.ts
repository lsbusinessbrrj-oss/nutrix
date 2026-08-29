// Mercado Pago — pagamento por Pix.
// Com MP_ACCESS_TOKEN configurado, cria um Pix de verdade (QR + copia-e-cola).
// Sem token, retorna um Pix "de simulação" para testar o fluxo ponta a ponta.
import { MercadoPagoConfig, Payment } from "mercadopago";

export const PRECO_DIETA = Number(process.env.PRECO_DIETA ?? "9.99");

export interface PixResult {
  paymentId: string;
  copiaECola: string;      // código Pix copia-e-cola
  qrBase64?: string;       // imagem do QR (base64 PNG) quando disponível
  simulado: boolean;
}

export async function criarPix(email: string, nome: string): Promise<PixResult> {
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

/** Consulta o status de um pagamento (approved/pending/rejected). */
export async function statusPagamento(paymentId: string): Promise<string> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token || paymentId.startsWith("sim_")) return "pending";
  const client = new MercadoPagoConfig({ accessToken: token });
  const payment = new Payment(client);
  const res = await payment.get({ id: paymentId });
  return res.status ?? "pending";
}
