// Diagnóstico de um usuário: perfil completo? escolhas de comida? plano? pago?
// Uso: tsx scripts/chk-user.ts <email-ou-id>
import "dotenv/config";
import { getDb, getUserFoodSelections, getActiveDietPlan } from "../server/db";
import { users } from "../drizzle/schema";
import { eq, like } from "drizzle-orm";

const arg = (process.argv[2] ?? "").toLowerCase().trim();
if (!arg) { console.error("uso: tsx scripts/chk-user.ts <email-ou-id>"); process.exit(1); }
const db = await getDb(); if (!db) { console.error("sem db"); process.exit(1); }

const rows = /^\d+$/.test(arg)
  ? await db.select().from(users).where(eq(users.id, Number(arg)))
  : await db.select().from(users).where(like(users.email, `%${arg}%`));

for (const u of rows) {
  const perfilOk = u.weight != null && u.height != null && u.age != null && !!u.sex;
  console.log(`\n#${u.id} ${u.email}  (${u.name ?? "sem nome"})`);
  console.log(`  pago(hasPaidPlan): ${u.hasPaidPlan}  | login: ${u.loginMethod}`);
  console.log(`  perfil: ${perfilOk ? "COMPLETO" : "INCOMPLETO ❌"}  peso=${u.weight} altura=${u.height} idade=${u.age} sexo=${u.sex}`);
  console.log(`  objetivo=${u.goal} atividade=${u.activityLevel} phone=${u.phone ?? "-"}`);
  const sels = await getUserFoodSelections(u.id);
  console.log(`  escolhas de comida: ${sels.length} refeições salvas`);
  const plano = await getActiveDietPlan(u.id);
  console.log(`  plano ativo no banco: ${plano ? `SIM (${plano.totalCalories} kcal)` : "NÃO"}`);
}
process.exit(0);
