// Endpoint chamado por um cron externo (ex.: cron-job.org) a cada ~15-30 min.
// Roda a automação de marketing e também serve de keep-alive do serviço.
//   GET/POST /api/cron/marketing?key=CRON_SECRET
import type express from "express";
import { enviarMarketing } from "./lib/marketing";

export function registerCronMarketing(app: express.Application) {
  app.all("/api/cron/marketing", async (req, res) => {
    const key = (req.query as any).key || req.headers["x-cron-key"];
    const secret = process.env.CRON_SECRET;
    if (!secret || key !== secret) return res.status(401).json({ ok: false, erro: "não autorizado" });
    try {
      const r = await enviarMarketing();
      res.json({ ok: true, avaliados: r.avaliados, enviados: r.enviados });
    } catch (e) {
      console.error("[cron-marketing]", (e as Error).message);
      res.status(500).json({ ok: false, erro: (e as Error).message });
    }
  });
}
