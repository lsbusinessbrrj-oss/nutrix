// Cria (ou promove) uma conta admin com e-mail/senha.
// Uso: tsx scripts/upsert-admin.ts <email> <senha> "<nome>"
import "dotenv/config";
import { getDb, getUserByEmail, createLocalUser } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashSenha } from "../server/auth/password";

const email = (process.argv[2] ?? "").toLowerCase().trim();
const senha = process.argv[3] ?? "";
const nome = process.argv[4] ?? null;

if (!email || !senha) { console.error("uso: tsx scripts/upsert-admin.ts <email> <senha> \"<nome>\""); process.exit(1); }

const db = await getDb();
if (!db) { console.error("sem db"); process.exit(1); }

const hash = await hashSenha(senha);
const existente = await getUserByEmail(email);
if (existente) {
  await db.update(users).set({ role: "admin", passwordHash: hash, ...(nome ? { name: nome } : {}) }).where(eq(users.email, email));
  console.log(`OK (promovido a admin): ${email} / senha: ${senha}`);
} else {
  const u = await createLocalUser({ email, passwordHash: hash, name: nome });
  await db.update(users).set({ role: "admin" }).where(eq(users.id, u.id));
  console.log(`OK (criado admin): ${email} / senha: ${senha}`);
}
process.exit(0);
