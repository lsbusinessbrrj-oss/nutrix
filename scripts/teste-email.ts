// Teste REAL de e-mail via Resend. Enquanto o domínio não está verificado,
// usa o remetente onboarding@resend.dev, que só entrega no e-mail dono da conta.
import "dotenv/config";
process.env.EMAIL_FROM = "NutriX <onboarding@resend.dev>";

import { gerarPlano } from "../server/lib/diet/generatePlan";
import { gerarPdfDieta } from "../server/lib/pdf/dietPdf";
import { enviarEmail } from "../server/lib/delivery/email";

const DESTINO = process.argv[2] ?? "matheus.feliiper@gmail.com";

const plano = gerarPlano(
  { sexo: "male", peso: 87, altura: 177, idade: 30, objetivo: "weight_loss", atividade: "moderado" },
  null,
  { cafe_manha: ["cm_pao_ovo", "cm_banana"], almoco: ["al_arroz", "al_frango_grelhado", "al_salada_alface_tomate"] },
);
const pdf = await gerarPdfDieta(
  { nome: "Matheus Felipe Rodrigues", whatsapp: "+55 (24) 99997-1926", sexo: "male", idade: 33, peso: 87, altura: 177 },
  plano,
);
console.log(`Enviando e-mail real para: ${DESTINO} (PDF ${pdf.length} bytes)...`);
const r = await enviarEmail(DESTINO, "Matheus", pdf);
console.log("Resultado:", JSON.stringify(r, null, 2));
process.exit(0);
