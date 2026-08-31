// Envia os 5 e-mails de marketing (com link mágico real) para um endereço de teste.
// Uso: APP_URL=https://usenutrix.com.br tsx scripts/test-emails.ts <email>
import "dotenv/config";
import { getUserByEmail } from "../server/db";
import { assinarTokenLogin } from "../server/auth/magic";
import { enviarEmailSimples } from "../server/lib/delivery/email";
import {
  emailBoasVindas, emailCadastroIncompleto, emailDietaPronta, emailCheckout, emailUltimaChamada,
} from "../server/lib/marketing/emails";

const alvo = (process.argv[2] ?? "").toLowerCase().trim();
if (!alvo) { console.error("uso: tsx scripts/test-emails.ts <email>"); process.exit(1); }

const APP_URL = (process.env.APP_URL || "https://usenutrix.com.br").replace(/\/$/, "");
const u = await getUserByEmail(alvo);
const uid = u?.id ?? 30001; // fallback: conta admin
const nome = u?.name ?? "Matheus";

async function link(next: string) {
  const t = await assinarTokenLogin(uid);
  return `${APP_URL}/api/auth/magic?token=${encodeURIComponent(t)}&next=${encodeURIComponent(next)}`;
}

const itens = [
  { nome: "1 · Boas-vindas",        mk: emailBoasVindas,        next: "/home" },
  { nome: "2 · Cadastro incompleto", mk: emailCadastroIncompleto, next: "/home" },
  { nome: "3 · Dieta pronta",        mk: emailDietaPronta,        next: "/pagamento" },
  { nome: "4 · Checkout abandonado", mk: emailCheckout,           next: "/pagamento" },
  { nome: "5 · Última chamada",      mk: emailUltimaChamada,      next: "/pagamento" },
];

console.log(`Enviando 5 e-mails de teste para ${alvo} (APP_URL=${APP_URL})\n`);
for (const it of itens) {
  const l = await link(it.next);
  const { assunto, html } = it.mk(nome, l);
  const r = await enviarEmailSimples(alvo, `[TESTE] ${assunto}`, html);
  console.log(`  ${r.ok ? (r.simulado ? "SIMULADO" : "ENVIADO ") : "FALHOU  "} ${it.nome} — "${assunto}"${r.ok ? "" : " :: " + r.detalhe}`);
}
process.exit(0);
