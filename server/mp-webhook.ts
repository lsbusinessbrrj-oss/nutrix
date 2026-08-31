// Webhook do Mercado Pago (IPN/notificações).
// Quando um pagamento é aprovado (Pix, cartão) ou uma assinatura é autorizada,
// a Meta/MP chama esta rota; nós confirmamos no MP, liberamos o plano do cliente
// e entregamos a dieta automaticamente. Responde sempre 200 (o MP re-tenta se não).
import express from "express";
import crypto from "crypto";
import * as db from "./db";
import { detalhePagamento, detalheAssinatura } from "./lib/payments/mercadopago";

// Valida a assinatura HMAC do Mercado Pago (x-signature). Só é exigida quando
// MP_WEBHOOK_SECRET está configurada; sem ela, seguimos confiando na conferência
// do pagamento na API do MP (que já usa nosso access token) + redes de retorno.
function assinaturaValida(req: express.Request, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // não configurado → não bloqueia
  const sig = String(req.header("x-signature") ?? "");
  const reqId = String(req.header("x-request-id") ?? "");
  const parts = Object.fromEntries(sig.split(",").map((p) => p.split("=").map((s) => s.trim())));
  const ts = parts["ts"], v1 = parts["v1"];
  if (!ts || !v1 || !dataId) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${reqId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1)); } catch { return false; }
}
import { entregarDieta, confirmarAssinatura } from "./lib/delivery";
import { avisoPagamento, avisoErro } from "./lib/notify";

// Localiza o usuário pelo external_reference (id) ou, na falta, pelo e-mail.
// Retorna { id, novo } — novo=true só na 1ª liberação (evita aviso duplicado
// nas re-tentativas do MP).
async function liberarEEntregar(externalRef?: string, email?: string): Promise<{ id: number; novo: boolean } | null> {
  let user = externalRef && /^\d+$/.test(externalRef) ? await db.getUserById(Number(externalRef)) : null;
  if (!user && email) user = await db.getUserByEmail(email);
  if (!user) return null;
  const novo = !user.hasPaidPlan;
  // Só entrega/marca na 1ª vez: o MP re-tenta o webhook (e pode notificar 2x),
  // e sem esse gate o cliente receberia o e-mail "dieta liberada" repetido.
  // Marcamos hasPaidPlan ANTES da entrega (que é lenta) pra estreitar a corrida.
  if (novo) {
    await db.updateUserProfile(user.id, { hasPaidPlan: true });
    await entregarDieta(user.id); // e-mail automático (WhatsApp fica no caminho B)
  }
  return { id: user.id, novo };
}

export function registerMpWebhook(app: express.Application) {
  const handler = async (req: express.Request, res: express.Response) => {
    try {
      const q = req.query as Record<string, string>;
      const b = (req.body ?? {}) as any;
      const tipo = String(b.type ?? b.topic ?? q.type ?? q.topic ?? "").toLowerCase();
      const id = String(b?.data?.id ?? b.id ?? q["data.id"] ?? q.id ?? "");
      if (!id) return res.sendStatus(200);
      if (!assinaturaValida(req, id)) {
        console.warn("[MP webhook] assinatura inválida — ignorado");
        return res.sendStatus(200);
      }

      if (tipo.includes("payment")) {
        const p = await detalhePagamento(id);
        if (p.status === "approved") {
          const r = await liberarEEntregar(p.externalReference, p.email);
          if (r?.novo) avisoPagamento("pagamento", p.email ?? null, "9,99");
        }
      } else if (tipo.includes("preapproval") || tipo.includes("subscription")) {
        const a = await detalheAssinatura(id);
        if (a.status === "authorized") {
          const r = await liberarEEntregar(a.externalReference, a.email);
          if (r?.novo) {
            await confirmarAssinatura(r.id); // e-mail de "assinatura ativada" — só 1x
            avisoPagamento("assinatura", a.email ?? null, "9,99");
          }
        }
      }
    } catch (e) {
      console.error("[MP webhook]", (e as Error).message);
      avisoErro("webhook do Mercado Pago", (e as Error).message);
    }
    return res.sendStatus(200);
  };

  // O MP pode notificar via POST (JSON) ou GET (IPN com query string).
  app.post("/api/mp/webhook", express.json(), handler);
  app.get("/api/mp/webhook", handler);
}
