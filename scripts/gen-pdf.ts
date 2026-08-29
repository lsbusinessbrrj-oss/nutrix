import "dotenv/config";
import { writeFileSync } from "node:fs";
import { gerarPlano } from "../server/lib/diet/generatePlan";
import { gerarPdfDieta } from "../server/lib/pdf/dietPdf";

const plano = gerarPlano(
  { sexo: "male", peso: 87, altura: 177, idade: 33, objetivo: "weight_loss", atividade: "moderado" },
  null,
  {
    cafe_manha: ["cm_pao_ovo", "cm_banana"],
    lanche_manha: ["lm_whey", "lm_banana"],
    almoco: ["al_arroz", "al_frango_grelhado", "al_salada_alface_tomate"],
    lanche_tarde: ["lt_pao_ovo", "lt_banana"],
    janta: ["jt_arroz", "jt_carne_grelhada"],
  },
);
const pdf = await gerarPdfDieta(
  { nome: "Matheus Felipe Rodrigues", whatsapp: "+55 (24) 99997-1926", sexo: "male", idade: 33, peso: 87, altura: 177 },
  plano,
);
writeFileSync("/tmp/dieta-nutrix.pdf", pdf);
console.log(`PDF gerado: ${pdf.length} bytes -> /tmp/dieta-nutrix.pdf`);
process.exit(0);
