// Webhook do Mercado Pago (IPN/notificações).
// Quando um pagamento é aprovado (Pix, cartão) ou uma assinatura é autorizada,
// a Meta/MP chama esta rota; nós confirmamos no MP, liberamos o plano do cliente
// e entregamos a dieta automaticamente. Responde sempre 200 (o MP re-tenta se não).
import express from "express";
import * as db from "./db";
import { detalhePagamento, detalheAssinatura } from "./lib/payments/mercadopago";
import { entregarDieta, confirmarAssinatura } from "./lib/delivery";

// Localiza o usuário pelo external_reference (id) ou, na falta, pelo e-mail.
async function liberarEEntregar(externalRef?: string, email?: string): Promise<number | null> {
  let user = externalRef && /^\d+$/.test(externalRef) ? await db.getUserById(Number(externalRef)) : null;
  if (!user && email) user = await db.getUserByEmail(email);
  if (!user) return null;
  if (!user.hasPaidPlan) await db.updateUserProfile(user.id, { hasPaidPlan: true });
  await entregarDieta(user.id); // e-mail automático (WhatsApp fica no caminho B)
  return user.id;
}

export function registerMpWebhook(app: express.Application) {
  const handler = async (req: express.Request, res: express.Response) => {
    try {
      const q = req.query as Record<string, string>;
      const b = (req.body ?? {}) as any;
      const tipo = String(b.type ?? b.topic ?? q.type ?? q.topic ?? "").toLowerCase();
      const id = String(b?.data?.id ?? b.id ?? q["data.id"] ?? q.id ?? "");
      if (!id) return res.sendStatus(200);

      if (tipo.includes("payment")) {
        const p = await detalhePagamento(id);
        if (p.status === "approved") await liberarEEntregar(p.externalReference, p.email);
      } else if (tipo.includes("preapproval") || tipo.includes("subscription")) {
        const a = await detalheAssinatura(id);
        if (a.status === "authorized") {
          const uid = await liberarEEntregar(a.externalReference, a.email);
          if (uid != null) await confirmarAssinatura(uid); // confirma a assinatura ativada
        }
      }
    } catch (e) {
      console.error("[MP webhook]", (e as Error).message);
    }
    return res.sendStatus(200);
  };

  // O MP pode notificar via POST (JSON) ou GET (IPN com query string).
  app.post("/api/mp/webhook", express.json(), handler);
  app.get("/api/mp/webhook", handler);
}
