// Envio da dieta por WhatsApp via WhatsApp Cloud API (Meta).
// Sem WHATSAPP_TOKEN/PHONE_NUMBER_ID, roda em modo simulação.
import type { ResultadoEnvio } from "./email";

const GRAPH = "https://graph.facebook.com/v21.0";

export function mensagemWhatsapp(nome: string): string {
  const primeiro = nome.split(" ")[0] || nome;
  return `Olá, ${primeiro}! 🥗 Aqui é da NutriX.\n\nSua *dieta personalizada* está pronta! Enviamos o PDF com o seu plano — calorias e proteína calculadas para o seu objetivo, opções por refeição e substituições.\n\n💧 Lembre-se de beber bastante água.\nQualquer dúvida, é só chamar por aqui. Bons resultados! 💪`;
}

/** Normaliza telefone para o formato internacional (DDI 55 + DDD + número). */
export function normalizarTelefone(tel: string): string {
  const d = (tel || "").replace(/\D/g, "");
  return d.startsWith("55") ? d : `55${d}`;
}

export async function enviarWhatsapp(telefone: string, nome: string, pdf: Buffer): Promise<ResultadoEnvio> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    return { ok: true, simulado: true, detalhe: "WHATSAPP_TOKEN/PHONE_NUMBER_ID não configurados — WhatsApp apenas simulado." };
  }
  const to = normalizarTelefone(telefone);
  try {
    // 1) Upload do PDF -> media_id
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", "application/pdf");
    form.append("file", new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), `dieta-${nome}.pdf`);
    const up = await fetch(`${GRAPH}/${phoneId}/media`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    const upJson: any = await up.json();
    if (!up.ok) return { ok: false, simulado: false, detalhe: JSON.stringify(upJson) };

    // 2) Envia o documento com legenda
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp", to, type: "document",
        document: { id: upJson.id, filename: `dieta-${nome}.pdf`, caption: mensagemWhatsapp(nome) },
      }),
    });
    const json: any = await res.json();
    if (!res.ok) return { ok: false, simulado: false, detalhe: JSON.stringify(json) };
    return { ok: true, simulado: false };
  } catch (e) {
    return { ok: false, simulado: false, detalhe: (e as Error).message };
  }
}
