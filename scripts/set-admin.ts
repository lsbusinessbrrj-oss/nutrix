import "dotenv/config";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashSenha } from "../server/auth/password";
const email = (process.argv[2] ?? "lsbusinessbrrj@gmail.com").toLowerCase();
const senha = process.argv[3] ?? "NutriXAdmin@2026";
const db = await getDb();
if (!db) { console.error("sem db"); process.exit(1); }
const hash = await hashSenha(senha);
const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
if (!u) { console.log("conta nao existe:", email); process.exit(0); }
await db.update(users).set({ role: "admin", passwordHash: hash }).where(eq(users.email, email));
console.log(`OK admin: ${email} / senha: ${senha}`);
process.exit(0);
