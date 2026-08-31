import "dotenv/config";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
const email = (process.argv[2] ?? "lsbusinessbrrj@gmail.com").toLowerCase();
const db = await getDb();
if (!db) { console.error("Sem conexão com o banco."); process.exit(1); }
const [antes] = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, email));
if (!antes) { console.log(`Nenhuma conta com o e-mail ${email}. (Faça login com essa conta primeiro.)`); process.exit(0); }
await db.update(users).set({ role: "admin" }).where(eq(users.email, email));
const [depois] = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, email));
console.log("OK:", JSON.stringify(depois));
process.exit(0);
