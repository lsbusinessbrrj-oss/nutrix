// Motor da automação de e-mail marketing (funil).
// Para cada usuário elegível, decide qual e-mail está "na hora" e ainda não foi
// enviado, dispara (Resend) e registra em marketing_emails para não repetir.
//
// Etapas e gatilhos (a partir do cadastro):
//   welcome        → imediato
//   incompleto     → +3h, se o quiz não foi preenchido (sem perfil)
//   dieta_pronta   → +2h, se o perfil está completo e não liberou
//   checkout       → +8h, se o perfil está completo e não liberou
//   ultima_chamada → +24h, se o perfil está completo e não liberou
//
// Regras: não envia para admins, e-mails internos de teste, nem quem já pagou.
import * as db from "../../db";
import { getDb } from "../../db";
import { users, marketingEmails } from "../../../drizzle/schema";
import { and, eq, gte } from "drizzle-orm";
import { assinarTokenLogin } from "../../auth/magic";
import { enviarEmailSimples } from "../delivery/email";
import {
  emailBoasVindas, emailCadastroIncompleto, emailDietaPronta, emailCheckout, emailUltimaChamada, type EmailPronto,
} from "./emails";

const APP_URL = (process.env.APP_URL || "https://usenutrix.com.br").replace(/\/$/, "");
const H = 60 * 60 * 1000;

type Tipo = "welcome" | "incompleto" | "dieta_pronta" | "checkout" | "ultima_chamada";

async function linkMagico(userId: number, next: string): Promise<string> {
  const token = await assinarTokenLogin(userId);
  return `${APP_URL}/api/auth/magic?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
}

function montar(tipo: Tipo, nome: string | null, link: string): EmailPronto {
  switch (tipo) {
    case "welcome": return emailBoasVindas(nome, link);
    case "incompleto": return emailCadastroIncompleto(nome, link);
    case "dieta_pronta": return emailDietaPronta(nome, link);
    case "checkout": return emailCheckout(nome, link);
    case "ultima_chamada": return emailUltimaChamada(nome, link);
  }
}

const destino: Record<Tipo, string> = {
  welcome: "/home",
  incompleto: "/home",
  dieta_pronta: "/pagamento",
  checkout: "/pagamento",
  ultima_chamada: "/pagamento",
};

export interface ResultadoMarketing { avaliados: number; enviados: number; detalhes: string[] }

export async function enviarMarketing(opts: { dryRun?: boolean; maxDias?: number } = {}): Promise<ResultadoMarketing> {
  const dryRun = !!opts.dryRun;
  const maxDias = opts.maxDias ?? 30;
  const conn = await getDb();
  if (!conn) return { avaliados: 0, enviados: 0, detalhes: ["sem banco"] };

  const desde = new Date(Date.now() - maxDias * 24 * H);
  const lista = await conn.select().from(users).where(gte(users.createdAt, desde));

  const detalhes: string[] = [];
  let enviados = 0;
  let avaliados = 0;

  for (const u of lista) {
    // Exclusões
    if (!u.email) continue;
    if (/@nutrix\.(com|dev|local)$/i.test(u.email)) continue;
    if (u.role === "admin") continue;
    if (u.hasPaidPlan) continue; // já converteu → recebe o e-mail de entrega, não marketing
    avaliados++;

    const idadeMs = Date.now() - new Date(u.createdAt).getTime();
    const perfilCompleto = u.weight != null && u.height != null && u.age != null && !!u.sex;

    // Define a lista de e-mails "devidos" por tempo.
    const devidos: Tipo[] = ["welcome"];
    if (!perfilCompleto) {
      if (idadeMs >= 3 * H) devidos.push("incompleto");
    } else {
      if (idadeMs >= 2 * H) devidos.push("dieta_pronta");
      if (idadeMs >= 8 * H) devidos.push("checkout");
      if (idadeMs >= 24 * H) devidos.push("ultima_chamada");
    }

    // Quais já foram enviados?
    const jaEnviados = await conn.select({ type: marketingEmails.type }).from(marketingEmails).where(eq(marketingEmails.userId, u.id));
    const enviadosSet = new Set(jaEnviados.map((x) => x.type));

    // Envia apenas 1 e-mail por rodada (o primeiro ainda pendente, preservando a
    // ordem do funil), pra não disparar vários de uma vez a quem entrou há tempo.
    const pendentes = devidos.filter((t) => !enviadosSet.has(t));
    if (!pendentes.length) continue;
    const tipo = pendentes[0];

    if (dryRun) {
      detalhes.push(`[dry] #${u.id} ${u.email} → ${tipo}`);
      enviados++;
      continue;
    }

    // Reserva o envio ANTES de mandar. Com o índice único (userId,type), duas
    // execuções concorrentes do cron não conseguem reservar o mesmo → sem duplicado.
    try {
      await conn.insert(marketingEmails).values({ userId: u.id, type: tipo });
    } catch {
      continue; // já reservado por outra rodada
    }

    const link = await linkMagico(u.id, destino[tipo]);
    const { assunto, html, text } = montar(tipo, u.name, link);
    const r = await enviarEmailSimples(u.email, assunto, html, text);
    if (r.ok) {
      enviados++;
      detalhes.push(`✅ #${u.id} ${u.email} → ${tipo}${r.simulado ? " (simulado)" : ""}`);
    } else {
      // Desfaz a reserva pra tentar de novo na próxima rodada.
      try { await conn.delete(marketingEmails).where(and(eq(marketingEmails.userId, u.id), eq(marketingEmails.type, tipo))); } catch { /* ignora */ }
      detalhes.push(`❌ #${u.id} ${u.email} → ${tipo}: ${r.detalhe ?? "falhou"}`);
    }
  }

  return { avaliados, enviados, detalhes };
}
