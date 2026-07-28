import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookies } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import type { User } from "../../drizzle/schema";
import { verificarSessao } from "../auth/session";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Sessão própria: cookie JWT -> id do usuário -> registro no banco.
    const token = parseCookies(opts.req.headers.cookie ?? "")[COOKIE_NAME];
    if (token) {
      const uid = await verificarSessao(token);
      if (uid != null) {
        user = (await db.getUserById(uid)) ?? null;
      }
    }
  } catch {
    // Autenticação é opcional para procedures públicas.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
