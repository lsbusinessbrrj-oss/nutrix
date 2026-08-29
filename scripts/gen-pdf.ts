import "dotenv/config";
import { writeFileSync } from "node:fs";
import { gerarPlano } from "../server/lib/diet/generatePlan";
import { gerarPdfDieta } from "../server/lib/pdf/dietPdf";

const plano = gerarPlano(
  { sexo: "male", peso: 87, altura: 177, idade: 30, objetivo: "weight_loss", atividade: "moderado" },
  null,
  {
    cafe_manha: ["cm_pao_ovo", "cm_banana"],
    almoco: ["al_arroz", "al_frango_grelhado", "al_salada_alface_tomate"],
  },
);
const pdf = await gerarPdfDieta("Matheus", plano);
writeFileSync("/tmp/dieta-nutrix.pdf", pdf);
console.log(`PDF gerado: ${pdf.length} bytes -> /tmp/dieta-nutrix.pdf`);
process.exit(0);
