// Envio da dieta por e-mail (com o PDF anexo) via Resend.
// Sem RESEND_API_KEY configurada, roda em modo simulação (não envia de verdade).
import { Resend } from "resend";

export function assuntoEmail(nome: string) {
  const primeiro = nome.split(" ")[0] || nome;
  return `${primeiro}, sua dieta personalizada chegou`;
}

export function corpoEmail(nome: string): string {
  const primeiro = nome.split(" ")[0] || nome;
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:460px;margin:0 auto">
    <p style="margin:0 0 14px"><strong style="color:#166534">NutriX</strong></p>
    <p style="margin:0 0 12px">Oi ${primeiro}, sua dieta está pronta.</p>
    <p style="margin:0 0 12px">Segue em anexo o seu plano alimentar personalizado, com as calorias e a proteína calculadas para o seu objetivo, as opções por refeição e as substituições.</p>
    <p style="margin:0 0 12px">Algumas dicas: siga as quantidades de cada refeição, beba bastante água ao longo do dia e, se enjoar de algum item, use as opções de substituição.</p>
    <p style="margin:0 0 12px">Qualquer dúvida, é só responder este e-mail. Bons resultados!</p>
    <p style="margin:18px 0 0;color:#555">Abraço,<br>Equipe NutriX</p>
  </div>`;
}

export function corpoEmailTexto(nome: string): string {
  const primeiro = nome.split(" ")[0] || nome;
  return `Oi ${primeiro}, sua dieta está pronta.\n\n` +
    `Segue em anexo o seu plano alimentar personalizado, com as calorias e a proteína calculadas para o seu objetivo, as opções por refeição e as substituições.\n\n` +
    `Algumas dicas: siga as quantidades de cada refeição, beba bastante água ao longo do dia e, se enjoar de algum item, use as opções de substituição.\n\n` +
    `Qualquer dúvida, é só responder este e-mail. Bons resultados!\n\nAbraço,\nEquipe NutriX`;
}

// E-mail de "dieta liberada" (sem PDF): avisa que a dieta está no app e leva pra lá.
export function assuntoDietaLiberada(nome: string) {
  const primeiro = nome.split(" ")[0] || nome;
  return `${primeiro}, sua dieta está liberada`;
}

export function corpoDietaLiberada(nome: string, link: string): string {
  const primeiro = nome.split(" ")[0] || nome;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#0f172a">
    <div style="background:#166534;padding:20px;border-radius:12px 12px 0 0;text-align:center">
      <span style="color:#fff;font-size:22px;font-weight:800">Nutri<span style="color:#E53935">X</span></span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="color:#166534;margin:0 0 12px">Sua dieta está pronta, ${primeiro}!</h2>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.55">Seu plano alimentar personalizado já está liberado no app, com as calorias e a proteína calculadas para o seu objetivo, as opções por refeição e as substituições.</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.55">É só acessar pra ver sua dieta e <strong>baixar o PDF</strong> quando quiser.</p>
      <p style="text-align:center;margin:24px 0">
        <a href="${link}" style="background:#166534;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px;display:inline-block">Ver minha dieta</a>
      </p>
      <p style="color:#94a3b8;font-size:12px;margin-top:20px">Equipe NutriX · Saúde que Alimenta. Treino que Transforma.</p>
    </div>
  </div>`;
}

export function textoDietaLiberada(nome: string, link: string): string {
  const primeiro = nome.split(" ")[0] || nome;
  return `Sua dieta está pronta, ${primeiro}!\n\n` +
    `Seu plano alimentar personalizado já está liberado no app, com as calorias e a proteína calculadas para o seu objetivo, as opções por refeição e as substituições. É só acessar pra ver sua dieta e baixar o PDF quando quiser.\n\n` +
    `Ver minha dieta: ${link}\n\nEquipe NutriX · Saúde que Alimenta. Treino que Transforma.`;
}

export function assuntoAssinatura() {
  return "Sua assinatura NutriX está ativa";
}

export function corpoAssinatura(nome: string, preco = "9,99"): string {
  const primeiro = nome.split(" ")[0] || nome;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#0f172a">
    <div style="background:#166534;padding:20px;border-radius:12px 12px 0 0;text-align:center">
      <span style="color:#fff;font-size:22px;font-weight:800">Nutri<span style="color:#E53935">X</span></span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="color:#166534;margin:0 0 8px">Assinatura ativada, ${primeiro}! ✅</h2>
      <p>Sua assinatura mensal do <strong>NutriX</strong> está ativa.</p>
      <div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:14px;margin:14px 0">
        <p style="margin:0;font-size:15px"><strong>Plano NutriX</strong></p>
        <p style="margin:4px 0 0;color:#475569;font-size:14px">R$ ${preco}/mês · cobrança automática mensal · cancele quando quiser</p>
      </div>
      <p style="font-size:14px">Sua dieta personalizada já está liberada no app e enviada. Enquanto a assinatura estiver ativa, você mantém o acesso ao seu plano e às atualizações.</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:20px">Equipe NutriX · Saúde que Alimenta. Treino que Transforma.<br>Para cancelar, responda este e-mail ou fale com o suporte.</p>
    </div>
  </div>`;
}

export function assuntoReset() {
  return "Redefinição de senha · NutriX 🔒";
}

export function corpoReset(nome: string | null, link: string): string {
  const primeiro = (nome ?? "").split(" ")[0] || "";
  const ola = primeiro ? `Olá, ${primeiro}!` : "Olá!";
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#0f172a">
    <div style="background:#166534;padding:20px;border-radius:12px 12px 0 0;text-align:center">
      <span style="color:#fff;font-size:22px;font-weight:800">Nutri<span style="color:#E53935">X</span></span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="color:#166534;margin:0 0 8px">Redefinir sua senha</h2>
      <p>${ola} Recebemos um pedido para redefinir a senha da sua conta NutriX.
      Clique no botão abaixo para criar uma nova senha:</p>
      <p style="text-align:center;margin:24px 0">
        <a href="${link}" style="background:#166534;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px;display:inline-block">Criar nova senha</a>
      </p>
      <p style="color:#475569;font-size:13px">Ou copie e cole este link no navegador:<br>
        <a href="${link}" style="color:#166534;word-break:break-all">${link}</a></p>
      <p style="color:#94a3b8;font-size:12px;margin-top:20px">O link expira em 1 hora. Se você não pediu a troca de senha, pode ignorar este e-mail — sua senha atual continua valendo.<br><br>Equipe NutriX · Saúde que Alimenta. Treino que Transforma.</p>
    </div>
  </div>`;
}

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Deriva um texto puro de um HTML simples (fallback quando não é passado).
function htmlParaTexto(html: string): string {
  return html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2: $1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n").trim();
}

/** Envia um e-mail simples (sem anexo) — usado p/ confirmações e marketing.
 *  Sempre inclui uma versão em texto puro (ajuda a cair na aba Principal). */
export async function enviarEmailSimples(para: string, assunto: string, html: string, text?: string): Promise<ResultadoEnvio> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { ok: true, simulado: true, detalhe: "Resend não configurado — e-mail simulado." };
  try {
    const { Resend } = await import("resend");
    const { error } = await new Resend(apiKey).emails.send({
      from, to: para, subject: assunto, html, text: text ?? htmlParaTexto(html),
    });
    if (error) return { ok: false, simulado: false, detalhe: JSON.stringify(error) };
    return { ok: true, simulado: false };
  } catch (e) {
    return { ok: false, simulado: false, detalhe: (e as Error).message };
  }
}

export interface ResultadoEnvio { ok: boolean; simulado: boolean; detalhe?: string }

export async function enviarEmail(para: string, nome: string, pdf: Buffer): Promise<ResultadoEnvio> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: true, simulado: true, detalhe: "RESEND_API_KEY/EMAIL_FROM não configurados — e-mail apenas simulado." };
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from, to: para, subject: assuntoEmail(nome), html: corpoEmail(nome), text: corpoEmailTexto(nome),
      attachments: [{ filename: `dieta-${slug(nome)}.pdf`, content: pdf }],
    });
    if (error) return { ok: false, simulado: false, detalhe: JSON.stringify(error) };
    return { ok: true, simulado: false };
  } catch (e) {
    return { ok: false, simulado: false, detalhe: (e as Error).message };
  }
}
