import "dotenv/config";
import * as db from "../server/db";
import { hashSenha } from "../server/auth/password";

const u = await db.getUserByEmail("matheus-teste@nutrix.com");
if (!u) throw new Error("usuário não encontrado");
await db.updateUserProfile(u.id, { passwordHash: await hashSenha("senha123456") });
console.log("Senha redefinida para: senha123456");
process.exit(0);
