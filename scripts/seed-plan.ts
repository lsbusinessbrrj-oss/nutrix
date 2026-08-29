import "dotenv/config";
import * as db from "../server/db";
import { gerarPlano } from "../server/lib/diet/generatePlan";

const email = "matheus-teste@nutrix.com";
const user = await db.getUserByEmail(email);
if (!user) throw new Error("usuário de teste não encontrado");

await db.updateUserProfile(user.id, {
  weight: 87, height: 177, age: 30, sex: "male",
  goal: "weight_loss", activityLevel: "moderado", dailyCalories: "nao_sei",
  phone: "(24) 99999-0000", hasPaidPlan: true, currentStreak: 3,
});

const selecoes: Record<string, string[]> = {
  cafe_manha: ["cm_pao_frango", "cm_banana"],
  lanche_manha: ["lm_maca"], // só fruta -> deve completar com carbo + proteína
  almoco: ["al_arroz", "al_frango_grelhado", "al_salada_alface_tomate"],
  lanche_tarde: ["lt_tapioca_frango"],
  janta: ["jt_batata_doce", "jt_peixe"],
};
for (const [meal, foods] of Object.entries(selecoes)) {
  await db.upsertFoodSelection(user.id, meal, foods);
}

const plano = gerarPlano(
  { sexo: "male", peso: 87, altura: 177, idade: 30, objetivo: "weight_loss", atividade: "moderado" },
  null, selecoes,
);
await db.createDietPlan(user.id, plano.totalCalories, plano);

const fmt = (m: any) => m.options[0].foods.map((f: any) => `${f.name} (${f.quantity})`).join(" · ");
console.log(`Plano: ${plano.totalCalories} kcal · água ${plano.waterMl} ml`);
console.log("Café da manhã:", fmt(plano.meals[0]));
console.log("Lanche manhã (escolheu só maçã):", fmt(plano.meals[1]));
console.log("Almoço:", fmt(plano.meals[2]));
process.exit(0);
