// Gera o plano no MESMO formato que a tela Dietas.tsx já consome:
// { totalCalories, meals: [{ name, time, calories, protein, options: [{ foods: [{name, quantity}] }] }] }
// A diferença: calorias e proteína agora são calculadas, não "chutadas".

import { calcularMetas, type PerfilNutri } from "./engine";
import { filtrarPorRestricoes, type Alimento, type Restricao } from "./foods";

interface FoodItem { name: string; quantity: string }
interface Option { foods: FoodItem[] }
interface Meal { name: string; time: string; calories: number; protein: number; options: Option[] }
export interface PlanData {
  totalCalories: number;
  proteinTarget: number;
  meals: Meal[];
  summary: { tmb: number; tdee: number; proteinPerKg: number; carbs: number; fat: number; waterMl: number };
}

const REFEICOES = [
  { name: "Café da manhã", time: "07:00", frac: 0.22 },
  { name: "Lanche da manhã", time: "10:00", frac: 0.13 },
  { name: "Almoço", time: "12:30", frac: 0.30 },
  { name: "Lanche da tarde", time: "16:00", frac: 0.13 },
  { name: "Jantar", time: "19:30", frac: 0.22 },
];

const arred5 = (g: number) => Math.max(5, Math.round(g / 5) * 5);
const qtd = (g: number) => (g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${g} g`);
const pick = <T,>(pool: T[], i: number) => pool[((i % pool.length) + pool.length) % pool.length];

/** Mapeia as condições de saúde do quiz para restrições alimentares. */
export function restricoesDe(healthConditions?: string | null): Set<Restricao> {
  const set = new Set<Restricao>();
  const raw = (healthConditions ?? "").split(",").map((s) => s.trim());
  if (raw.includes("vegan")) set.add("vegano");
  if (raw.includes("vegetarian")) set.add("vegetariano");
  if (raw.includes("lactose")) set.add("lactose");
  if (raw.includes("gluten")) set.add("gluten");
  return set;
}

function montarOpcao(
  mealKcal: number, mealProt: number,
  proteinas: Alimento[], carbos: Alimento[], vegetais: Alimento[], frutas: Alimento[],
  ehPrincipal: boolean, seed: number,
): Option {
  const foods: FoodItem[] = [];
  let kcal = 0;

  // 1) Proteína dimensionada para bater a meta de proteína da refeição.
  const prot = pick(proteinas, seed);
  const gProt = arred5(Math.min((mealProt / prot.p) * 100, 300));
  foods.push({ name: prot.nome, quantity: qtd(gProt) });
  kcal += (prot.kcal * gProt) / 100;

  // 2) Acompanhamento (vegetal no prato principal, fruta no lanche).
  const acomp = ehPrincipal ? pick(vegetais, seed) : pick(frutas, seed);
  const gAcomp = ehPrincipal ? 120 : 100;
  foods.push({ name: acomp.nome, quantity: qtd(gAcomp) });
  kcal += (acomp.kcal * gAcomp) / 100;

  // 3) Carboidrato preenche as calorias restantes da refeição.
  const carb = pick(carbos, seed);
  const restante = Math.max(mealKcal - kcal, 0);
  const gCarb = arred5(Math.min((restante / carb.kcal) * 100, 400));
  if (gCarb >= 5) foods.push({ name: carb.nome, quantity: qtd(gCarb) });

  return { foods };
}

export function gerarPlano(
  perfil: PerfilNutri,
  healthConditions?: string | null,
): PlanData {
  const metas = calcularMetas(perfil);
  const restricoes = restricoesDe(healthConditions);

  const proteinas = filtrarPorRestricoes("proteina", restricoes);
  const carbos = filtrarPorRestricoes("carboidrato", restricoes);
  const vegetais = filtrarPorRestricoes("vegetal", restricoes);
  const frutas = filtrarPorRestricoes("fruta", restricoes);

  const meals: Meal[] = REFEICOES.map((r, mi) => {
    const mealKcal = Math.round(metas.calorias * r.frac);
    const mealProt = Math.round(metas.proteinaG * r.frac);
    const ehPrincipal = r.name === "Almoço" || r.name === "Jantar";
    // 5 opções variadas por refeição.
    const options = Array.from({ length: 5 }, (_, oi) =>
      montarOpcao(mealKcal, mealProt, proteinas, carbos, vegetais, frutas, ehPrincipal, mi * 5 + oi),
    );
    return { name: r.name, time: r.time, calories: mealKcal, protein: mealProt, options };
  });

  return {
    totalCalories: metas.calorias,
    proteinTarget: metas.proteinaG,
    meals,
    summary: {
      tmb: metas.tmb, tdee: metas.tdee, proteinPerKg: metas.proteinaPorKg,
      carbs: metas.carboidratoG, fat: metas.gorduraG, waterMl: metas.aguaMl,
    },
  };
}
