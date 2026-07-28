// Hash e verificação de senha com bcrypt.
import bcrypt from "bcryptjs";

const ROUNDS = 10;

export function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, ROUNDS);
}

export function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
