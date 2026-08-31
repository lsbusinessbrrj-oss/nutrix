// Link mágico de login (usado nos e-mails de marketing): um JWT curto que, ao ser
// aberto, autentica o usuário automaticamente e leva pra tela certa. Sem senha.
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";

function secret(): Uint8Array {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET não configurado.");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function assinarTokenLogin(userId: number): Promise<string> {
  return new SignJWT({ uid: userId, typ: "magic" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // link de login por e-mail: curto por segurança
    .sign(secret());
}

export async function lerTokenLogin(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ !== "magic" || typeof payload.uid !== "number") return null;
    return payload.uid;
  } catch {
    return null;
  }
}
