// Envio da dieta por e-mail (com o PDF anexo) via Resend.
// Sem RESEND_API_KEY configurada, roda em modo simulação (não envia de verdade).
import { Resend } from "resend";

export function assuntoEmail(nome: string) {
  return `${nome}, sua dieta personalizada NutriX chegou! 🥗`;
}

export function corpoEmail(nome: string): string {
  const primeiro = nome.split(" ")[0] || nome;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#0f172a">
    <div style="background:#166534;padding:20px;border-radius:12px 12px 0 0;text-align:center">
      <span style="color:#fff;font-size:22px;font-weight:800">Nutri<span style="color:#E53935">X</span></span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="color:#166534;margin:0 0 8px">Sua dieta está pronta, ${primeiro}! 🎉</h2>
      <p>Em anexo está o seu <strong>plano alimentar personalizado</strong>, com as calorias e a proteína
      calculadas para o seu objetivo, opções por refeição e substituições.</p>
      <ul style="color:#475569;font-size:14px;line-height:1.6">
        <li>Siga as quantidades indicadas em cada refeição.</li>
        <li>Beba bastante água ao longo do dia.</li>
        <li>Enjoou de algum item? Use as opções de substituição.</li>
      </ul>
      <p style="margin-top:16px">Qualquer dúvida, é só responder este e-mail. Bons resultados! 💪</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:20px">Equipe NutriX · Saúde que Alimenta. Treino que Transforma.</p>
    </div>
  </div>`;
}

export function assuntoAssinatura() {
  return "Assinatura NutriX ativada ✅";
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

/** Envia um e-mail simples (sem anexo) — usado p/ confirmações. */
export async function enviarEmailSimples(para: string, assunto: string, html: string): Promise<ResultadoEnvio> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { ok: true, simulado: true, detalhe: "Resend não configurado — e-mail simulado." };
  try {
    const { Resend } = await import("resend");
    const { error } = await new Resend(apiKey).emails.send({ from, to: para, subject: assunto, html });
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
      from, to: para, subject: assuntoEmail(nome), html: corpoEmail(nome),
      attachments: [{ filename: `dieta-${slug(nome)}.pdf`, content: pdf }],
    });
    if (error) return { ok: false, simulado: false, detalhe: JSON.stringify(error) };
    return { ok: true, simulado: false };
  } catch (e) {
    return { ok: false, simulado: false, detalhe: (e as Error).message };
  }
}
