// Download do PDF da dieta pelo app: GET /api/dieta/pdf
// Autentica pelo cookie de sessão e exige plano liberado (hasPaidPlan).
import type express from "express";
import { COOKIE_NAME } from "@shared/const";
import { verificarSessao } from "./auth/session";
import { gerarPdfUsuario } from "./lib/delivery";
import * as db from "./db";

function readCookie(req: express.Request, name: string): string | undefined {
  const raw = req.headers.cookie || "";
  const item = raw.split(";").map((s) => s.trim()).find((s) => s.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : undefined;
}

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function registerDietaPdf(app: express.Application) {
  app.get("/api/dieta/pdf", async (req, res) => {
    try {
      const token = readCookie(req, COOKIE_NAME);
      const uid = token ? await verificarSessao(token) : null;
      if (!uid) return res.status(401).send("Faça login para baixar sua dieta.");
      const user = await db.getUserById(uid);
      if (!user) return res.status(401).send("Sessão inválida.");
      if (!user.hasPaidPlan) return res.status(403).send("Libere sua dieta para baixar o PDF.");
      const { nome, pdf } = await gerarPdfUsuario(uid);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="dieta-${slug(nome)}.pdf"`);
      res.send(pdf);
    } catch (e) {
      console.error("[dieta-pdf]", (e as Error).message);
      res.status(500).send("Não foi possível gerar o PDF agora. Tente novamente.");
    }
  });
}
