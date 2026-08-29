// Gera o plano no formato que a tela Dietas.tsx consome, agora:
// - respeitando os alimentos escolhidos pelo cliente em cada refeição;
// - garantindo SEMPRE carboidrato + proteína em toda refeição (fruta nunca sozinha);
// - com medida caseira + gramas;
// - com água calculada pelo peso e orientações do plano.

import { calcularMetas, type PerfilNutri } from "./engine";
import {
  alimentosDoId, filtrarPorRestricoes, passaRestricoes, substituicoesDe,
  type Alimento, type Categoria, type Restricao,
} from "./foods";

interface FoodItem { name: string; quantity: string; substituicoes: { name: string; quantity: string }[] }
interface Option { foods: FoodItem[]; kcal: number }
interface Meal { name: string; time: string; calories: number; protein: number; options: Option[] }
export interface PlanData {
  totalCalories: number;
  proteinTarget: number;
  waterMl: number;
  meals: Meal[];
  summary: { tmb: number; tdee: number; proteinPerKg: number; carbs: number; fat: number; waterMl: number };
  orientacao: string[];
}

/** Chave da refeição usada ao salvar as escolhas (saveFoodSelections). */
export type Selecoes = Record<string, string[]>;

// frac = fração das calorias; protFrac = fração da proteína (concentrada nas
// refeições principais); leve = café/lanches (proteína modesta, sem carne pesada).
const REFEICOES = [
  { name: "Café da manhã", time: "08:30", frac: 0.25, protFrac: 0.15, leve: true, selKey: "cafe_manha" },
  { name: "Lanche da manhã", time: "10:30", frac: 0.10, protFrac: 0.10, leve: true, selKey: "lanche_manha" },
  { name: "Almoço", time: "12:00", frac: 0.30, protFrac: 0.30, leve: false, selKey: "almoco" },
  { name: "Café da Tarde", time: "17:00", frac: 0.13, protFrac: 0.15, leve: true, selKey: "lanche_tarde" },
  { name: "Jantar", time: "21:00", frac: 0.22, protFrac: 0.30, leve: false, selKey: "janta" },
];

// Proteínas leves (para café/lanches). Carnes ficam nas refeições principais.
const PROT_LEVE = new Set(["Ovo", "Queijo muçarela", "Iogurte natural desnatado", "Whey protein", "Presunto magro", "Tofu firme"]);
const CAP_PROT_LEVE = 60;   // g — porção máxima de proteína em refeição leve
const CAP_PROT_PRINCIPAL = 300;

const arred5 = (g: number) => Math.max(5, Math.round(g / 5) * 5);
const pick = <T,>(arr: T[], i: number) => arr[((i % arr.length) + arr.length) % arr.length];

// Pluralização simples das medidas caseiras.
const PLURAL_HEAD: Record<string, string> = {
  colher: "colheres", fatia: "fatias", unidade: "unidades", filé: "filés",
  porção: "porções", concha: "conchas", pedaço: "pedaços", pote: "potes",
  dose: "doses", prato: "pratos", xícara: "xícaras", copo: "copos",
  pegador: "pegadores", punhado: "punhados",
};
const PLURAL_ADJ: Record<string, string> = { média: "médias", pequena: "pequenas", cheia: "cheias" };

function pluralMedida(medida: string): string {
  const parts = medida.split(" ");
  parts[0] = PLURAL_HEAD[parts[0]] ?? parts[0] + "s";
  const last = parts[parts.length - 1];
  if (PLURAL_ADJ[last]) parts[parts.length - 1] = PLURAL_ADJ[last];
  return parts.join(" ");
}

function formatarMedida(a: Alimento, gramas: number): string {
  const g = arred5(gramas);
  const n = Math.max(1, Math.round(g / a.gPorMedida));
  const unidade = a.cat === "bebida" ? "ml" : "g";
  const medidaTxt = n === 1 ? a.medida : `${n} ${pluralMedida(a.medida)}`;
  const nTxt = n === 1 ? `1 ${a.medida}` : medidaTxt;
  return `${nTxt} ou ${g}${unidade}`;
}

function kcalDe(a: Alimento, gramas: number) { return (a.kcal * gramas) / 100; }

function criarItem(a: Alimento, gramas: number, restr: Set<Restricao>): FoodItem {
  const subs = substituicoesDe(a, gramas, restr).map((s) => ({
    name: s.alimento.nome, quantity: formatarMedida(s.alimento, s.gramas),
  }));
  return { name: a.nome, quantity: formatarMedida(a, gramas), substituicoes: subs };
}

/** Monta UMA opção de refeição a partir de uma base de alimentos escolhidos. */
function montarOpcao(
  targetKcal: number, targetProt: number,
  base: Alimento[], restr: Set<Restricao>, seed: number, leve: boolean,
): Option {
  const por = (c: Categoria) => base.filter((a) => a.cat === c);
  const padrao = (c: Categoria) => {
    let pool = filtrarPorRestricoes(c, restr);
    // Em refeições leves, a proteína padrão é leve (ovo/queijo/iogurte…), sem carne.
    if (c === "proteina" && leve) {
      const leves = pool.filter((a) => PROT_LEVE.has(a.nome));
      if (leves.length) pool = leves;
    }
    return pool.length ? pick(pool, seed) : undefined;
  };

  // 1) Proteína (obrigatória) — a escolhida ou uma padrão.
  const prot = por("proteina")[0] ?? padrao("proteina");
  // 2) Carboidrato (obrigatório) — o escolhido ou um padrão.
  const carb = por("carboidrato")[0] ?? padrao("carboidrato");
  // 3) Extras: frutas, vegetais e bebidas escolhidos (porção fixa).
  const extras = base.filter((a) => a.cat === "fruta" || a.cat === "vegetal" || a.cat === "bebida").slice(0, 2);

  const foods: FoodItem[] = [];
  let kcal = 0;

  if (prot) {
    const cap = leve ? CAP_PROT_LEVE : CAP_PROT_PRINCIPAL;
    const g = arred5(Math.min(Math.max((targetProt / prot.p) * 100, 30), cap));
    foods.push(criarItem(prot, g, restr));
    kcal += kcalDe(prot, g);
  }
  // Extras entram antes de dimensionar o carbo (para o carbo fechar as calorias).
  for (const e of extras) {
    const g = e.gPorMedida; // 1 medida caseira
    foods.push(criarItem(e, g, restr));
    kcal += kcalDe(e, g);
  }
  if (carb) {
    const restante = Math.max(targetKcal - kcal, 0);
    // Entre 1 medida caseira e um teto realista (evita "7 fatias de pão").
    const maxG = carb.gPorMedida * (leve ? 4 : 9);
    const g = arred5(Math.min(Math.max((restante / carb.kcal) * 100, carb.gPorMedida), maxG));
    foods.push(criarItem(carb, g, restr));
    kcal += kcalDe(carb, g);
  }

  // 4) Gordura para fechar as calorias (café com requeijão; almoço com azeite),
  //    como na referência — evita encher a refeição só de carboidrato.
  const faltam = targetKcal - kcal;
  if (faltam > 80) {
    const pool = filtrarPorRestricoes("gordura", restr);
    const pref = leve
      ? ["Requeijão light", "Cream cheese light", "Pasta de amendoim"]
      : ["Azeite de oliva", "Pasta de amendoim"];
    const gord = pool.find((a) => pref.includes(a.nome)) ?? pool[0];
    if (gord) {
      const g = arred5(Math.min((faltam / gord.kcal) * 100, gord.gPorMedida * 3));
      if (g >= 5) { foods.push(criarItem(gord, g, restr)); kcal += kcalDe(gord, g); }
    }
  }

  return { foods, kcal: Math.round(kcal) };
}

export function gerarPlano(
  perfil: PerfilNutri,
  healthConditions?: string | null,
  selecoes?: Selecoes,
): PlanData {
  const metas = calcularMetas(perfil);
  const restr = restricoesDe(healthConditions);

  const meals: Meal[] = REFEICOES.map((r, mi) => {
    const targetKcal = Math.round(metas.calorias * r.frac);
    const targetProt = Math.round(metas.proteinaG * r.protFrac);

    // Alimentos escolhidos pelo cliente para esta refeição (respeitando restrições).
    const ids = selecoes?.[r.selKey] ?? [];
    const escolhidos = ids.flatMap(alimentosDoId).filter((a) => passaRestricoes(a, restr));

    // Opção 1 = escolha do cliente (completada com carbo+proteína).
    // Opções 2 e 3 = variações da base.
    const options: Option[] = [
      montarOpcao(targetKcal, targetProt, escolhidos, restr, mi * 7, r.leve),
      montarOpcao(targetKcal, targetProt, [], restr, mi * 7 + 3, r.leve),
      montarOpcao(targetKcal, targetProt, [], restr, mi * 7 + 5, r.leve),
    ];

    // kcal do card = soma real da Opção 1 (o que está no prato).
    return { name: r.name, time: r.time, calories: options[0].kcal, protein: targetProt, options };
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

export function restricoesDe(healthConditions?: string | null): Set<Restricao> {
  const set = new Set<Restricao>();
  const raw = (healthConditions ?? "").split(",").map((s) => s.trim());
  if (raw.includes("vegano")) set.add("vegano");
  if (raw.includes("vegetariano")) set.add("vegetariano");
  if (raw.includes("intolerancia_lactose") || raw.includes("lactose")) set.add("lactose");
  if (raw.includes("intolerancia_gluten") || raw.includes("gluten")) set.add("gluten");
  return set;
}

function orientacoes(aguaMl: number): string[] {
  const litros = (aguaMl / 1000).toFixed(1).replace(".", ",");
  return [
    `Hidratação: consuma no mínimo ${litros} L de água por dia, distribuídos ao longo do dia.`,
    "Organização das refeições: evite pular refeições. A regularidade ajuda no controle da fome e na energia diária.",
    "Toda refeição traz carboidrato + proteína; frutas e saladas entram como complemento, nunca sozinhas.",
    "Atividade física: pratique musculação e/ou atividade física de acordo com sua rotina.",
    "Sono: procure dormir de 7 a 8 horas por noite — influencia o apetite e a recuperação.",
    "Refeição livre: é permitida 1 refeição livre por semana, sem excessos.",
    "Este material é educativo e não substitui acompanhamento de nutricionista ou médico.",
  ];
}
