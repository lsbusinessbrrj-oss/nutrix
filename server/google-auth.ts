// Login com Google (OAuth 2.0). Fluxo:
//  GET /api/auth/google           → redireciona para o consentimento do Google
//  GET /api/auth/google/callback  → troca o code por perfil, cria/loga o usuário
// Precisa de GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no ambiente, e o redirect
// URI (APP_URL + /api/auth/google/callback) cadastrado no Google Cloud.
import type express from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { assinarSessao } from "./auth/session";
import { hashSenha } from "./auth/password";
import * as db from "./db";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v2/userinfo";

const appUrl = () => process.env.APP_URL || "http://localhost:3000";
const redirectUri = () => `${appUrl()}/api/auth/google/callback`;

// Lê um cookie do header (o app não usa cookie-parser).
function readCookie(req: express.Request, name: string): string | undefined {
  const raw = req.headers.cookie || "";
  const item = raw.split(";").map((s) => s.trim()).find((s) => s.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : undefined;
}

export function registerGoogleAuth(app: express.Application) {
  // Início do login
  app.get("/api/auth/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.redirect("/login?erro=google_off");
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const secure = getSessionCookieOptions(req).secure;
    res.cookie("g_state", state, { httpOnly: true, sameSite: "lax", secure, maxAge: 10 * 60 * 1000, path: "/" });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri(),
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    res.redirect(`${GOOGLE_AUTH}?${params.toString()}`);
  });

  // Retorno do Google
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) return res.redirect("/login?erro=google_off");

      const code = String((req.query as any).code || "");
      const state = String((req.query as any).state || "");
      if (!code || !state || state !== readCookie(req, "g_state")) return res.redirect("/login?erro=google_state");

      // Troca o code por tokens
      const tokenRes = await fetch(GOOGLE_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code, client_id: clientId, client_secret: clientSecret,
          redirect_uri: redirectUri(), grant_type: "authorization_code",
        }).toString(),
      });
      const token = (await tokenRes.json()) as any;
      if (!token.access_token) return res.redirect("/login?erro=google_token");

      // Perfil do usuário
      const infoRes = await fetch(GOOGLE_USERINFO, { headers: { Authorization: `Bearer ${token.access_token}` } });
      const info = (await infoRes.json()) as any; // { email, name, picture }
      const email = String(info.email || "").toLowerCase().trim();
      if (!email) return res.redirect("/login?erro=google_email");

      // Cria ou loga o usuário (por e-mail)
      let user = await db.getUserByEmail(email);
      if (!user) {
        const passwordHash = await hashSenha(Math.random().toString(36) + Date.now().toString(36));
        user = await db.createLocalUser({ email, passwordHash, name: info.name ?? null, phone: null });
        if (info.picture) await db.updateUserProfile(user.id, { avatarUrl: info.picture });
      } else if (!user.avatarUrl && info.picture) {
        await db.updateUserProfile(user.id, { avatarUrl: info.picture });
      }

      const sessionToken = await assinarSessao(user.id);
      const opts = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...opts, maxAge: ONE_YEAR_MS });
      res.clearCookie("g_state", { path: "/" });
      res.redirect("/home");
    } catch (e) {
      console.error("[Google auth]", (e as Error).message);
      res.redirect("/login?erro=google_falha");
    }
  });
}
