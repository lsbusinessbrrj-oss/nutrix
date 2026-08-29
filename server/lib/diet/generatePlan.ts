// Gera o plano reproduzindo os templates EXATOS da dieta de referência
// (reference.ts): mesmas refeições, opções, itens e substituições, com as
// quantidades escaladas pela meta calórica de cada cliente.

import { calcularMetas, type PerfilNutri } from "./engine";
import { REF_KCAL, REF_REFEICOES, REF_SUBS, type RefItem } from "./reference";

interface FoodItem { name: string; quantity: string; substituicoes: { name: string; quantity: string }[] }
interface Option { foods: FoodItem[]; kcal: number; obs?: string }
interface Meal { name: string; time: string; calories: number; protein: number; options: Option[] }
export interface PlanData {
  totalCalories: number;
  proteinTarget: number;
  waterMl: number;
  meals: Meal[];
  summary: { tmb: number; tdee: number; proteinPerKg: number; carbs: number; fat: number; waterMl: number };
  orientacao: string[];
}
export type Selecoes = Record<string, string[]>;

const PLURAL: Record<string, string> = {
  unidade: "unidades", fatia: "fatias", colher: "colheres", medidor: "medidores", xícara: "xícaras",
};
const ADJ: Record<string, string> = { média: "médias", cheia: "cheias", rasa: "rasas" };
function pluralMedida(m: string, n: number): string {
  if (n === 1) return m;
  const parts = m.split(" ");
  parts[0] = PLURAL[parts[0]] ?? parts[0] + "s";
  const last = parts[parts.length - 1];
  if (ADJ[last]) parts[parts.length - 1] = ADJ[last];
  return parts.join(" ");
}
const fmtG = (g: number) => (Number.isInteger(g) ? `${g}` : g.toFixed(1).replace(".", ","));

function gramasDe(it: RefItem, scale: number): number {
  if (it.livre) return 0;
  return it.fixo ? it.baseG : Math.round(it.baseG * scale * 10) / 10;
}

function quantidadeDe(it: RefItem, scale: number, gramas: number): string {
  // Perto da referência (ou item fixo), usa a string exata das fotos.
  if (it.livre) return "À vontade";
  if (it.fixo || Math.abs(scale - 1) < 0.06) return it.qtd;
  const unidade = it.unidade === "ml" ? "ml" : "g";
  if (it.medida && it.gPorMedida) {
    const n = Math.max(1, Math.round(gramas / it.gPorMedida));
    return `${n} ${pluralMedida(it.medida, n)} ou ${fmtG(gramas)}${unidade}`;
  }
  return `${fmtG(gramas)} ${unidade}`;
}

function itemParaFood(it: RefItem, scale: number): FoodItem {
  const g = gramasDe(it, scale);
  return {
    name: it.name,
    quantity: quantidadeDe(it, scale, g),
    substituicoes: REF_SUBS[it.name] ?? [],
  };
}

export function gerarPlano(
  perfil: PerfilNutri,
  _healthConditions?: string | null,
  _selecoes?: Selecoes,
): PlanData {
  const metas = calcularMetas(perfil);
  const scale = metas.calorias / REF_KCAL;

  const meals: Meal[] = REF_REFEICOES.map((ref) => {
    const options: Option[] = ref.opcoes.map((op) => {
      const foods = op.itens.map((it) => itemParaFood(it, scale));
      const kcal = op.itens.reduce((s, it) => s + (it.kcal100 * gramasDe(it, scale)) / 100, 0);
      return { foods, kcal: Math.round(kcal), obs: op.obs };
    });
    return { name: ref.name, time: ref.time, calories: options[0].kcal, protein: 0, options };
  });

  const totalReal = meals.reduce((s, m) => s + m.calories, 0);

  return {
    totalCalories: totalReal,
    proteinTarget: metas.proteinaG,
    waterMl: metas.aguaMl,
    meals,
    summary: {
      tmb: metas.tmb, tdee: metas.tdee, proteinPerKg: metas.proteinaPorKg,
      carbs: metas.carboidratoG, fat: metas.gorduraG, waterMl: metas.aguaMl,
    },
    orientacao: orientacoes(metas.aguaMl),
  };
}

function orientacoes(aguaMl: number): string[] {
  const litros = Math.max(2.5, aguaMl / 1000).toFixed(1).replace(".", ",");
  return [
    `Hidratação: consuma no mínimo ${litros} L de água por dia, distribuídos ao longo do dia. Melhora o funcionamento intestinal, a disposição e os resultados.`,
    "Organização das refeições: evite pular refeições. A regularidade ajuda no controle da fome e da energia. Se precisar ajustar horários, priorize manter as quantidades totais do dia.",
    "Atividade física: pratique musculação e/ou atividade física conforme sua rotina. A associação entre alimentação e treino é fundamental para reduzir gordura e preservar massa muscular.",
    "Sono: durma de 7 a 8 horas por noite — influencia o apetite, o emagrecimento e a recuperação.",
    "Refeição livre: é permitida 1 refeição livre por semana, sem excessos. Retome o plano normalmente na refeição seguinte.",
    "Substituições: cada alimento tem opções equivalentes. Troque apenas o item que enjoar, mantendo a quantidade indicada.",
    "Resultados vêm da regularidade, não da perfeição. Este material é educativo e não substitui acompanhamento profissional.",
  ];
}
