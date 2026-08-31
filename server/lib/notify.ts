// Notificações operacionais para o dono: cadastro, pagamento, assinatura e erros.
// Envia um e-mail (Resend) para o ADMIN_EMAIL. É best-effort: nunca lança nem
// bloqueia o fluxo principal.
import { enviarEmailSimples } from "./delivery/email";
import { listarEmailsAdmins } from "../db";

// E-mails extras fixos por env (separados por vírgula). Os admins do banco são
// somados a esses automaticamente — então basta criar um admin pra ele receber.
const EXTRA = (process.env.ADMIN_EMAIL || "lsbusinessbrrj@gmail.com,thiagonoe100@outlook.com")
  .split(",").map((e) => e.trim()).filter(Boolean);

async function destinatarios(): Promise<string[]> {
  let doBanco: string[] = [];
  try { doBanco = await listarEmailsAdmins(); } catch { /* best-effort */ }
  return Array.from(new Set([...doBanco, ...EXTRA].map((e) => e.toLowerCase())));
}

function corpo(titulo: string, linhas: string[]): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;color:#111">
    <p style="font-weight:800;color:#166534;margin:0 0 8px">NutriX · Aviso</p>
    <p style="font-weight:700;margin:0 0 8px">${titulo}</p>
    ${linhas.map((l) => `<p style="margin:0 0 4px">${l}</p>`).join("")}
  </div>`;
}

/** Envia um aviso para todos os admins (fire-and-forget, nunca bloqueia). */
export function notificarAdmin(assunto: string, titulo: string, linhas: string[]): void {
  (async () => {
    const html = corpo(titulo, linhas);
    for (const to of await destinatarios()) {
      await enviarEmailSimples(to, `[NutriX] ${assunto}`, html).catch(() => {});
    }
  })().catch(() => {});
}

export function avisoCadastro(nome: string | null, email: string | null, phone?: string | null): void {
  notificarAdmin("Novo cadastro 🆕", "Um novo cliente se cadastrou", [
    `Nome: ${nome || "—"}`,
    `E-mail: ${email || "—"}`,
    `WhatsApp: ${phone || "—"}`,
  ]);
}

export function avisoPagamento(tipo: "pagamento" | "assinatura", email: string | null, valor: string): void {
  const emoji = tipo === "assinatura" ? "🔁" : "💰";
  notificarAdmin(`${tipo === "assinatura" ? "Nova assinatura" : "Novo pagamento"} ${emoji}`,
    `${tipo === "assinatura" ? "Assinatura mensal ativada" : "Pagamento aprovado"}`, [
    `Cliente: ${email || "—"}`,
    `Valor: R$ ${valor}`,
  ]);
}

// Throttle de avisos de erro: no máximo 1 e-mail por assinatura de erro a cada
// 10 min. Evita que um erro que se repete a cada request inunde os admins e
// estoure a cota do Resend (o que suprimiria os e-mails reais dos clientes).
const COOLDOWN_MS = 10 * 60 * 1000;
const ultimoErro = new Map<string, number>();

export function avisoErro(onde: string, mensagem: string): void {
  const assinatura = `${onde}::${String(mensagem).split("\n")[0].slice(0, 120)}`;
  const agora = Date.now();
  const anterior = ultimoErro.get(assinatura) ?? 0;
  if (agora - anterior < COOLDOWN_MS) return; // já avisamos esse erro há pouco
  ultimoErro.set(assinatura, agora);
  if (ultimoErro.size > 200) ultimoErro.clear(); // não deixa o mapa crescer sem limite
  notificarAdmin("Erro no sistema ⚠️", `Ocorreu um erro em: ${onde}`, [
    `Detalhe: ${mensagem}`,
  ]);
}
