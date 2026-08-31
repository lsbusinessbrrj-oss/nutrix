// Token de redefinição de senha (por e-mail), sem precisar de colunas novas no banco.
// O token é um JWT curto (60 min) que embute o id do usuário e uma "impressão digital"
// do hash de senha atual. Assim que a senha é trocada, a impressão muda e o token
// deixa de valer — garantindo uso único.
import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import { ENV } from "../_core/env";

function secret(): Uint8Array {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET não configurado.");
  return new TextEncoder().encode(ENV.cookieSecret);
}

/** Impressão digital curta do hash de senha atual (muda quando a senha troca). */
export function impressaoSenha(passwordHash: string | null | undefined): string {
  return createHash("sha256").update(String(passwordHash ?? "")).digest("hex").slice(0, 16);
}

export async function assinarTokenReset(userId: number, passwordHash: string | null | undefined): Promise<string> {
  return new SignJWT({ uid: userId, ph: impressaoSenha(passwordHash), typ: "reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60m")
    .sign(secret());
}

/** Valida assinatura + expiração e devolve {uid, ph}. A checagem de uso único
 *  (comparar ph com o hash atual) é feita por quem chama, após carregar o usuário. */
export async function lerTokenReset(token: string): Promise<{ uid: number; ph: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ !== "reset") return null;
    if (typeof payload.uid !== "number" || typeof payload.ph !== "string") return null;
    return { uid: payload.uid, ph: payload.ph };
  } catch {
    return null;
  }
}
