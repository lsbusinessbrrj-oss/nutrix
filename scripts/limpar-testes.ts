// Apaga TODOS os usuários que não são admin (limpeza pré-lançamento).
// Uso: tsx scripts/limpar-testes.ts --dry   (só lista)
//      tsx scripts/limpar-testes.ts         (apaga de verdade)
import "dotenv/config";
import { getDb, deleteUser } from "../server/db";
import { users } from "../drizzle/schema";
import { desc } from "drizzle-orm";

const dry = process.argv.includes("--dry");
const db = await getDb();
if (!db) { console.error("sem db"); process.exit(1); }

const todos = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role }).from(users).orderBy(desc(users.createdAt));
const admins = todos.filter((u) => u.role === "admin");
const apagar = todos.filter((u) => u.role !== "admin");

console.log(`\n== MANTER (admins: ${admins.length}) ==`);
for (const u of admins) console.log(`  ✔ #${u.id} ${u.email} (${u.name ?? "-"})`);
console.log(`\n== APAGAR (não-admin: ${apagar.length}) ==`);
for (const u of apagar) console.log(`  ✗ #${u.id} ${u.email} (${u.name ?? "-"})`);

if (dry) { console.log("\n[DRY RUN] nada foi apagado."); process.exit(0); }

let n = 0;
for (const u of apagar) { await deleteUser(u.id); n++; }
console.log(`\nApagados: ${n}. Mantidos (admins): ${admins.length}.`);
process.exit(0);
