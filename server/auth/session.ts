// Sessão própria por JWT (substitui a sessão do Manus).
// Assina/verifica um token com o id do usuário, guardado no cookie de sessão.
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";

const ONE_YEAR = "365d";

function secret(): Uint8Array {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET não configurado.");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function assinarSessao(userId: number): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ONE_YEAR)
    .sign(secret());
}

export async function verificarSessao(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const uid = payload.uid;
    return typeof uid === "number" ? uid : null;
  } catch {
    return null;
  }
}
