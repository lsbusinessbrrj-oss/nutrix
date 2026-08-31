// Orquestra a entrega da dieta: gera o plano + PDF e envia por e-mail e/ou
// WhatsApp (ou simula, se as chaves não estiverem configuradas).
import * as db from "../../db";
import { gerarPlano } from "../diet/generatePlan";
import type { Atividade, Objetivo, Sexo } from "../diet/engine";
import { gerarPdfDieta } from "../pdf/dietPdf";
import { enviarEmailSimples, assuntoAssinatura, corpoAssinatura, assuntoDietaLiberada, corpoDietaLiberada, textoDietaLiberada, type ResultadoEnvio } from "./email";
import { enviarWhatsapp, enviarWhatsappTexto, mensagemAssinatura } from "./whatsapp";
import { assinarTokenLogin } from "../../auth/magic";

type UserRow = NonNullable<Awaited<ReturnType<typeof db.getUserById>>>;

const APP_URL = (process.env.APP_URL || "https://usenutrix.com.br").replace(/\/$/, "");

/** Gera o PDF da dieta de um usuário (usado pelo download no app). */
export async function gerarPdfUsuario(userId: number): Promise<{ nome: string; pdf: Buffer }> {
  const user = await db.getUserById(userId);
  if (!user) throw new Error("Usuário não encontrado");
  const { nome, pdf } = await construirPdf(user);
  return { nome, pdf };
}

/** Gera o plano e o PDF para um usuário (valida perfil e carrega as escolhas). */
async function construirPdf(user: UserRow): Promise<{ nome: string; pdf: Buffer; plano: any }> {
  if (user.weight == null || user.height == null || user.age == null || !user.sex) {
    throw new Error("Perfil incompleto (peso, altura, idade, sexo).");
  }
  const foodSels = await db.getUserFoodSelections(user.id);
  const selecoes: Record<string, string[]> = {};
  for (const s of foodSels) selecoes[s.mealType] = (s.foods as string[]) ?? [];

  const plano = gerarPlano(
    {
      sexo: user.sex as Sexo, peso: Number(user.weight), altura: Number(user.height),
      idade: Number(user.age), objetivo: (user.goal ?? "maintenance") as Objetivo,
      atividade: (user.activityLevel ?? "moderado") as Atividade,
    },
    (user as any).healthConditions, selecoes,
  );
  const nome = user.name ?? "Cliente";
  const cliente = {
    nome, whatsapp: user.phone, sexo: user.sex, idade: user.age,
    peso: user.weight != null ? Number(user.weight) : null,
    altura: user.height != null ? Number(user.height) : null,
  };
  return { nome, pdf: await gerarPdfDieta(cliente, plano), plano };
}

export interface ResultadoEntrega {
  email: (ResultadoEnvio & { destino?: string }) | { ok: false; detalhe: string };
  whatsapp: (ResultadoEnvio & { destino?: string }) | { ok: false; detalhe: string };
}

/**
 * Entrega após o pagamento. Por padrão envia o e-mail (automático) e NÃO dispara
 * o WhatsApp proativamente — no caminho B, o cliente inicia a conversa e o
 * webhook responde com o PDF. Passe `whatsappProativo` para forçar o envio.
 */
export async function entregarDieta(userId: number, whatsappProativo = false): Promise<ResultadoEntrega> {
  const user = await db.getUserById(userId);
  if (!user) throw new Error("Usuário não encontrado");
  const { nome, pdf, plano } = await construirPdf(user);

  // Salva o plano no banco para aparecer no app (/dietas). Não deve derrubar a
  // entrega se falhar.
  try {
    const kcal = Number(plano?.totalCalories ?? 0);
    await db.createDietPlan(user.id, kcal, plano);
  } catch (e) {
    console.error("[entregarDieta] falha ao salvar plano:", (e as Error).message);
  }

  // E-mail SEM PDF: avisa que a dieta está liberada no app (o PDF é baixado lá).
  let email: ResultadoEntrega["email"];
  if (user.email) {
    const token = await assinarTokenLogin(user.id);
    const link = `${APP_URL}/api/auth/magic?token=${encodeURIComponent(token)}&next=/dietas`;
    email = { ...(await enviarEmailSimples(user.email, assuntoDietaLiberada(nome), corpoDietaLiberada(nome, link), textoDietaLiberada(nome, link))), destino: user.email };
  } else {
    email = { ok: false as const, detalhe: "Sem e-mail no cadastro." };
  }

  let whatsapp: ResultadoEntrega["whatsapp"];
  if (whatsappProativo && user.phone) {
    whatsapp = { ...(await enviarWhatsapp(user.phone, nome, pdf)), destino: user.phone };
  } else {
    whatsapp = { ok: false, detalhe: "Aguardando o cliente iniciar a conversa no WhatsApp." };
  }
  return { email, whatsapp };
}

/** Confirma a assinatura (recorrência) por e-mail e WhatsApp. */
export async function confirmarAssinatura(userId: number) {
  const user = await db.getUserById(userId);
  if (!user) return { email: { ok: false, detalhe: "sem usuário" }, whatsapp: { ok: false, detalhe: "sem usuário" } };
  const nome = user.name ?? "Cliente";
  const email = user.email
    ? { ...(await enviarEmailSimples(user.email, assuntoAssinatura(), corpoAssinatura(nome))), destino: user.email }
    : { ok: false as const, detalhe: "sem e-mail" };
  const whatsapp = user.phone
    ? { ...(await enviarWhatsappTexto(user.phone, mensagemAssinatura(nome))), destino: user.phone }
    : { ok: false as const, detalhe: "sem telefone" };
  return { email, whatsapp };
}

/** Envia o PDF por WhatsApp para um usuário (usado pelo webhook, caminho B). */
export async function entregarWhatsapp(userId: number) {
  const user = await db.getUserById(userId);
  if (!user || !user.phone) return { ok: false, detalhe: "Usuário sem telefone." };
  if (!user.hasPaidPlan) return { ok: false, detalhe: "Cliente ainda não pagou." };
  const { nome, pdf } = await construirPdf(user);
  return { ...(await enviarWhatsapp(user.phone, nome, pdf)), destino: user.phone };
}
