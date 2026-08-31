// Rota do link mágico: GET /api/auth/magic?token=...&next=/pagamento
// Valida o token, cria a sessão e redireciona para a tela interna indicada.
import type express from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { assinarSessao } from "./auth/session";
import { lerTokenLogin } from "./auth/magic";
import * as db from "./db";

// Só permite caminhos internos simples (evita open-redirect, inclusive via "\"
// que alguns navegadores tratam como "/", e "//host").
function destinoSeguro(next: string | undefined): string {
  if (!next) return "/home";
  // Precisa começar com "/", não ser "//" nem "/\", e conter só caracteres de path seguros.
  if (!/^\/[A-Za-z0-9\-_/]*$/.test(next)) return "/home";
  return next;
}

export function registerMagicAuth(app: express.Application) {
  app.get("/api/auth/magic", async (req, res) => {
    try {
      const token = String((req.query as any).token || "");
      const next = destinoSeguro(String((req.query as any).next || "/home"));
      const uid = await lerTokenLogin(token);
      if (!uid) return res.redirect("/login?erro=link_expirado");
      const user = await db.getUserById(uid);
      if (!user) return res.redirect("/login?erro=link_expirado");
      const sessionToken = await assinarSessao(uid);
      const opts = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...opts, maxAge: ONE_YEAR_MS });
      res.redirect(next);
    } catch (e) {
      console.error("[magic-auth]", (e as Error).message);
      res.redirect("/login?erro=link_expirado");
    }
  });
}
