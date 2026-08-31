// Monitor de testes: snapshot do funil (cadastros → dieta gerada → plano pago).
// Lê o banco direto (funciona mesmo com o site dormindo no Render).
// Uso: tsx scripts/monitor.ts
import "dotenv/config";
import { getDb } from "../server/db";
import { users, dietPlans, payments } from "../drizzle/schema";
import { desc, gte, sql } from "drizzle-orm";

const db = await getDb();
if (!db) { console.error("sem db"); process.exit(1); }

const agora = new Date();
const h24 = new Date(Date.now() - 24 * 60 * 60 * 1000);

const [tot] = await db.select({ c: sql<number>`count(*)` }).from(users);
const [totPlanos] = await db.select({ c: sql<number>`count(*)` }).from(dietPlans);
const [novos24] = await db.select({ c: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, h24));
const [planos24] = await db.select({ c: sql<number>`count(*)` }).from(dietPlans).where(gte(dietPlans.createdAt, h24));
const [pagos] = await db.select({ c: sql<number>`count(*)` }).from(users).where(sql`${users.hasPaidPlan} = true`);

const recentes = await db.select({
  id: users.id, email: users.email, name: users.name, login: users.loginMethod,
  pago: users.hasPaidPlan, criado: users.createdAt,
}).from(users).orderBy(desc(users.createdAt)).limit(12);

// planos por usuário (pra ver quem gerou dieta)
const planosPorUser = await db.select({ userId: dietPlans.userId, kcal: dietPlans.totalCalories, criado: dietPlans.createdAt })
  .from(dietPlans).orderBy(desc(dietPlans.createdAt)).limit(20);
const temPlano = new Map<number, { kcal: number | null; criado: Date }>();
for (const p of planosPorUser) if (!temPlano.has(p.userId)) temPlano.set(p.userId, { kcal: p.kcal, criado: p.criado });

const fmt = (d: Date | null) => d ? new Date(d).toISOString().replace("T", " ").slice(0, 16) : "-";

console.log(`\n===== MONITOR NUTRIX · ${fmt(agora)} UTC =====`);
console.log(`Usuários: ${tot.c}  (novos 24h: ${novos24.c})`);
console.log(`Dietas geradas: ${totPlanos.c}  (24h: ${planos24.c})`);
console.log(`Com plano pago/liberado: ${pagos.c}`);
console.log(`\n-- Últimos cadastros --`);
console.log(`id  | quando(UTC)      | login    | dieta? | pago | email`);
for (const u of recentes) {
  const pl = temPlano.get(u.id);
  console.log(
    `${String(u.id).padEnd(3)} | ${fmt(u.criado)} | ${String(u.login ?? "-").padEnd(8)} | ${pl ? "sim" : "NÃO"}    | ${u.pago ? "sim" : "-"}   | ${u.email ?? "-"}`
  );
}
// Sinal simples pra automação: total de usuários (pra detectar novos entre execuções).
console.log(`\nUSERS_TOTAL=${tot.c}`);
process.exit(0);
