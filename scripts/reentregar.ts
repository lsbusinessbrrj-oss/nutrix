// Re-entrega a dieta de todos os usuários com plano pago/liberado:
// gera+salva o plano e reenvia o e-mail com o PDF. Reporta o resultado de cada um.
// Uso: tsx scripts/reentregar.ts
import "dotenv/config";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { entregarDieta } from "../server/lib/delivery";

const db = await getDb();
if (!db) { console.error("sem db"); process.exit(1); }

const pagos = await db.select({
  id: users.id, email: users.email, name: users.name, phone: users.phone,
  peso: users.weight, alt: users.height, idade: users.age, sexo: users.sex,
}).from(users).where(eq(users.hasPaidPlan, true)).orderBy(desc(users.createdAt));

console.log(`\n== Reentrega para ${pagos.length} pagantes ==`);
console.log(`RESEND: ${process.env.RESEND_API_KEY ? "configurado" : "AUSENTE"} | FROM: ${process.env.EMAIL_FROM ?? "-"}`);
console.log(`WHATSAPP: ${process.env.WHATSAPP_TOKEN ? "configurado" : "AUSENTE (não envia)"}\n`);

for (const u of pagos) {
  const perfilOk = u.peso != null && u.alt != null && u.idade != null && !!u.sexo;
  const tag = `#${u.id} ${u.email ?? "(sem email)"}`;
  // Pula endereços internos de teste (não são inboxes reais).
  if (!u.email || /@nutrix\.(com|dev|local)$/i.test(u.email)) {
    console.log(`⏭️  ${tag} — interno/teste, pulado`);
    continue;
  }
  if (!perfilOk) {
    console.log(`❌ ${tag} — PERFIL INCOMPLETO (peso=${u.peso} alt=${u.alt} idade=${u.idade} sexo=${u.sexo}) → e-mail NÃO enviado`);
    continue;
  }
  try {
    const r = await entregarDieta(u.id);
    const e = r.email as any;
    const emailStatus = e?.ok ? (e.simulado ? "SIMULADO (sem chave)" : `ENVIADO → ${e.destino}`) : `FALHOU: ${e?.detalhe ?? "?"}`;
    const wa = r.whatsapp as any;
    console.log(`✅ ${tag}`);
    console.log(`     e-mail: ${emailStatus}`);
    console.log(`     whatsapp: ${wa?.ok ? "enviado" : (wa?.detalhe ?? "não enviado")}`);
  } catch (err) {
    console.log(`❌ ${tag} — ERRO na entrega: ${(err as Error).message}`);
  }
}
console.log("\n== fim ==");
process.exit(0);
