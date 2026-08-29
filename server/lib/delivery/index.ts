// Orquestra a entrega da dieta após o pagamento: gera o plano + PDF e envia
// por e-mail e WhatsApp (ou simula, se as chaves não estiverem configuradas).
import * as db from "../../db";
import { gerarPlano } from "../diet/generatePlan";
import type { Atividade, Objetivo, Sexo } from "../diet/engine";
import { gerarPdfDieta } from "../pdf/dietPdf";
import { enviarEmail, type ResultadoEnvio } from "./email";
import { enviarWhatsapp } from "./whatsapp";

export interface ResultadoEntrega {
  totalCalories: number;
  pdfBytes: number;
  email: (ResultadoEnvio & { destino?: string }) | { ok: false; detalhe: string };
  whatsapp: (ResultadoEnvio & { destino?: string }) | { ok: false; detalhe: string };
}

export async function entregarDieta(userId: number): Promise<ResultadoEntrega> {
  const user = await db.getUserById(userId);
  if (!user) throw new Error("Usuário não encontrado");
  if (user.weight == null || user.height == null || user.age == null || !user.sex) {
    throw new Error("Perfil incompleto (peso, altura, idade, sexo).");
  }

  const foodSels = await db.getUserFoodSelections(userId);
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
  const pdf = await gerarPdfDieta(nome, plano);

  const email = user.email
    ? { ...(await enviarEmail(user.email, nome, pdf)), destino: user.email }
    : { ok: false as const, detalhe: "Sem e-mail no cadastro." };
  const whatsapp = user.phone
    ? { ...(await enviarWhatsapp(user.phone, nome, pdf)), destino: user.phone }
    : { ok: false as const, detalhe: "Sem WhatsApp no cadastro." };

  return { totalCalories: plano.totalCalories, pdfBytes: pdf.length, email, whatsapp };
}
