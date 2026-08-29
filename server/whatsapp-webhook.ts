// Webhook do WhatsApp Cloud API (caminho B): quando o cliente que já pagou
// manda uma mensagem para o número da NutriX, respondemos com o PDF da dieta.
import express from "express";
import * as db from "./db";
import { entregarWhatsapp } from "./lib/delivery";

export function registerWhatsappWebhook(app: express.Application) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? "nutrix";

  // Verificação do webhook (feita uma vez pelo painel da Meta).
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === verifyToken) {
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
  });

  // Mensagens recebidas — dispara a entrega da dieta por WhatsApp.
  app.post("/api/whatsapp/webhook", express.json(), async (req, res) => {
    try {
      const value = req.body?.entry?.[0]?.changes?.[0]?.value;
      const msg = value?.messages?.[0];
      if (msg?.from) {
        const user = await db.getUserByPhoneDigits(String(msg.from));
        if (user) {
          const r = await entregarWhatsapp(user.id);
          console.log("[WhatsApp] entrega ->", msg.from, JSON.stringify(r));
        } else {
          console.log("[WhatsApp] sem usuário para", msg.from);
        }
      }
      res.sendStatus(200);
    } catch (e) {
      console.error("[WhatsApp webhook]", (e as Error).message);
      res.sendStatus(200);
    }
  });
}
