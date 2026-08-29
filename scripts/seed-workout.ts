import "dotenv/config";
import * as db from "../server/db";
import { gerarTreino, type EntradaTreino } from "../server/lib/workout/engine";

const email = "matheus-teste@nutrix.com";
const user = await db.getUserByEmail(email);
if (!user) throw new Error("usuário de teste não encontrado");

const input: EntradaTreino = {
  location: "gym", level: "intermediate", daysPerWeek: 5,
  muscleGroups: ["Peito", "Tríceps", "Costas", "Bíceps", "Quadríceps", "Posterior", "Ombros", "Abdômen"],
  workoutGoal: "Hipertrofia (ganho de massa)",
};
const planData = gerarTreino(input);
await db.createWorkoutPlan(user.id, { ...input, planData });
console.log(`Treino: ${planData.days.length} dias — ${planData.days.map((d) => d.focus).join(", ")}`);
process.exit(0);
