import "dotenv/config";
import * as db from "../server/db";
import { gerarPlano } from "../server/lib/diet/generatePlan";

const email = "matheus-teste@nutrix.com";
const user = await db.getUserByEmail(email);
if (!user) throw new Error("usuário de teste não encontrado");

await db.updateUserProfile(user.id, {
  weight: 80, height: 178, age: 30, sex: "male",
  goal: "weight_loss", activityLevel: "moderado",
  dailyCalories: "nao_sei", phone: "(24) 99999-0000",
  hasPaidPlan: true, currentStreak: 3,
});

const plano = gerarPlano({
  sexo: "male", peso: 80, altura: 178, idade: 30,
  objetivo: "weight_loss", atividade: "moderado",
});
await db.createDietPlan(user.id, plano.totalCalories, plano);
console.log(`Plano: ${plano.totalCalories} kcal, ${plano.meals.length} refeições, proteína ${plano.proteinTarget}g`);
process.exit(0);
