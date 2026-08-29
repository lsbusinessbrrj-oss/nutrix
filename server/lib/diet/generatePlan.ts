// Monta o plano combinando:
// - Opção 1 = alimentos ESCOLHIDOS pelo cliente no quiz (com substituições);
// - Opções seguintes = templates da dieta de referência (reference.ts).
// A calibração fina das quantidades virá da planilha da nutricionista; por ora
// as quantidades escalam pela meta calórica.

import { calcularMetas, type PerfilNutri } from "./engine";
import { REF_KCAL, REF_REFEICOES, REF_SUBS, type RefItem, type RefOpcao } from "./reference";
import {
  alimento, alimentosDoId, filtrarPorRestricoes, passaRestricoes, substituicoesDe,
  type Alimento, type Categoria, type Restricao,
} from "./foods";

interface Sub { name: string; quantity: string }
interface FoodItem { name: string; quantity: string; substituicoes: Sub[] }
interface Option { foods: FoodItem[]; kcal: number; obs?: string }
interface Meal { name: string; time: string; calories: number; protein: number; options: Option[] }
export interface PlanData {
  totalCalories: number; proteinTarget: number; waterMl: number;
  meals: Meal[];
  summary: { tmb: number; tdee: number; proteinPerKg: number; carbs: number; fat: number; waterMl: number };
  orientacao: string[];
}
export type Selecoes = Record<string, string[]>;

// ── formatação de medidas ──
const PLURAL: Record<string, string> = { unidade: "unidades", fatia: "fatias", colher: "colheres", medidor: "medidores", xícara: "xícaras", concha: "conchas", pegador: "pegadores", pedaço: "pedaços", punhado: "punhados", copo: "copos", pote: "potes", prato: "pratos" };
const ADJ: Record<string, string> = { média: "médias", cheia: "cheias", rasa: "rasas", pequena: "pequenas" };
function pluralMedida(m: string, n: number): string {
  if (n === 1) return m;
  const p = m.split(" ");
  p[0] = PLURAL[p[0]] ?? p[0] + "s";
  const last = p[p.length - 1];
  if (ADJ[last]) p[p.length - 1] = ADJ[last];
  return p.join(" ");
}
const fmtG = (g: number) => (Number.isInteger(g) ? `${g}` : g.toFixed(1).replace(".", ","));
const arred5 = (g: number) => Math.max(5, Math.round(g / 5) * 5);
const pick = <T,>(a: T[], i: number) => a[((i % a.length) + a.length) % a.length];

function formatarMedida(a: Alimento, gramas: number): string {
  const g = arred5(gramas);
  const unidade = a.cat === "bebida" ? "ml" : "g";
  const n = Math.max(1, Math.round(g / a.gPorMedida));
  const nTxt = n === 1 ? `1 ${a.medida}` : `${n} ${pluralMedida(a.medida, n)}`;
  return `${nTxt} ou ${g}${unidade}`;
}

// Substituições: exatas da referência quando houver; senão, automáticas por grupo.
function subsFor(name: string, gramas: number, restr: Set<Restricao>): Sub[] {
  if (REF_SUBS[name]) return REF_SUBS[name];
  const a = alimento(name);
  if (a) return substituicoesDe(a, gramas, restr).map((s) => ({ name: s.alimento.nome, quantity: formatarMedida(s.alimento, s.gramas) }));
  return [];
}

// ── Opção do cliente (a partir das escolhas do quiz) ──
const PROT_LEVE = new Set(["Ovo", "Queijo muçarela", "Presunto magro", "Iogurte natural desnatado", "Whey protein"]);
const CAP_PROT_LEVE = 60, CAP_PROT_PRINCIPAL = 300;

function montarOpcaoCliente(
  base: Alimento[], targetKcal: number, targetProt: number, leve: boolean, restr: Set<Restricao>, seed: number,
): Option {
  const por = (c: Categoria) => base.filter((a) => a.cat === c);
  const padrao = (c: Categoria, nomes?: Set<string>) => {
    let pool = filtrarPorRestricoes(c, restr);
    if (nomes) { const f = pool.filter((a) => nomes.has(a.nome)); if (f.length) pool = f; }
    return pool.length ? pick(pool, seed) : undefined;
  };
  const acharVeg = (pred: (a: Alimento) => boolean) => por("vegetal").find(pred) ?? filtrarPorRestricoes("vegetal", restr).find(pred);

  const foods: FoodItem[] = [];
  let kcal = 0;
  const add = (a: Alimento, gramas: number, override?: string) => {
    foods.push({ name: a.nome, quantity: override ?? formatarMedida(a, gramas), substituicoes: subsFor(a.nome, gramas, restr) });
    kcal += (a.kcal * gramas) / 100;
  };

  const prot = por("proteina")[0] ?? padrao("proteina", leve ? PROT_LEVE : undefined);
  if (prot) {
    const cap = leve ? CAP_PROT_LEVE : CAP_PROT_PRINCIPAL;
    add(prot, arred5(Math.min(Math.max((targetProt / prot.p) * 100, 30), cap)));
  }
  const carb = por("carboidrato")[0] ?? padrao("carboidrato");

  if (leve) {
    const fruta = por("fruta")[0] ?? padrao("fruta");
    if (fruta) add(fruta, fruta.gPorMedida);
    if (carb) {
      const rest = Math.max(targetKcal - kcal, 0);
      add(carb, arred5(Math.min(Math.max((rest / carb.kcal) * 100, carb.gPorMedida), carb.gPorMedida * 4)));
    }
    const faltam = targetKcal - kcal;
    if (faltam > 60) {
      const g2 = padrao("gordura", new Set(["Requeijão light", "Cream cheese light", "Pasta de amendoim"]));
      if (g2) { const g = arred5(Math.min((faltam / g2.kcal) * 100, g2.gPorMedida * 3)); if (g >= 5) add(g2, g); }
    }
  } else {
    const legume = acharVeg((a) => a.nome === "Brócolis cozido");
    const salada = acharVeg((a) => a.nome.includes("Salada"));
    const legKcal = legume ? (legume.kcal * 100) / 100 : 0;
    const salKcal = salada ? (salada.kcal * salada.gPorMedida) / 100 : 0;
    if (carb) {
      const rest = Math.max(targetKcal - kcal - legKcal - salKcal, 0);
      add(carb, arred5(Math.min(Math.max((rest / carb.kcal) * 100, carb.gPorMedida), carb.gPorMedida * 9)));
    }
    if (legume) add(legume, 100);
    if (salada) add(salada, salada.gPorMedida, "À vontade");
  }
  return { foods, kcal: Math.round(kcal) };
}

// ── Opção da referência ──
function refItemGramas(it: RefItem, scale: number) { return it.livre ? 0 : it.fixo ? it.baseG : Math.round(it.baseG * scale * 10) / 10; }
function refItemQtd(it: RefItem, scale: number, g: number): string {
  if (it.livre) return "À vontade";
  if (it.fixo || Math.abs(scale - 1) < 0.06) return it.qtd;
  const u = it.unidade === "ml" ? "ml" : "g";
  if (it.medida && it.gPorMedida) { const n = Math.max(1, Math.round(g / it.gPorMedida)); return `${n} ${pluralMedida(it.medida, n)} ou ${fmtG(g)}${u}`; }
  return `${fmtG(g)} ${u}`;
}
function refOpcaoToOption(op: RefOpcao, scale: number): Option {
  const foods = op.itens.map((it) => {
    const g = refItemGramas(it, scale);
    return { name: it.name, quantity: refItemQtd(it, scale, g), substituicoes: REF_SUBS[it.name] ?? [] };
  });
  const kcal = op.itens.reduce((s, it) => s + (it.kcal100 * refItemGramas(it, scale)) / 100, 0);
  return { foods, kcal: Math.round(kcal), obs: op.obs };
}

export function gerarPlano(perfil: PerfilNutri, healthConditions?: string | null, selecoes?: Selecoes): PlanData {
  const metas = calcularMetas(perfil);
  const scale = metas.calorias / REF_KCAL;
  const restr = restricoesDe(healthConditions);

  const meals: Meal[] = REF_REFEICOES.map((ref, mi) => {
    const refOptions = ref.opcoes.map((op) => refOpcaoToOption(op, scale));
    const leve = ref.key === "cafe_manha" || ref.key === "lanche_tarde";

    // Opção 1 = escolha do cliente (se houver); senão só as opções de referência.
    const ids = selecoes?.[ref.key] ?? [];
    const escolhidos = ids.flatMap(alimentosDoId).filter((a) => passaRestricoes(a, restr));
    let options: Option[];
    if (escolhidos.length) {
      const mealBudget = refOptions[0].kcal;
      const targetProt = Math.round(metas.proteinaG * (leve ? 0.15 : 0.3));
      options = [montarOpcaoCliente(escolhidos, mealBudget, targetProt, leve, restr, mi), ...refOptions];
    } else {
      options = refOptions;
    }
    return { name: ref.name, time: ref.time, calories: options[0].kcal, protein: 0, options };
  });

  const totalReal = meals.reduce((s, m) => s + m.calories, 0);
  return {
    totalCalories: totalReal, proteinTarget: metas.proteinaG, waterMl: metas.aguaMl, meals,
    summary: { tmb: metas.tmb, tdee: metas.tdee, proteinPerKg: metas.proteinaPorKg, carbs: metas.carboidratoG, fat: metas.gorduraG, waterMl: metas.aguaMl },
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
  const litros = Math.max(2.5, aguaMl / 1000).toFixed(1).replace(".", ",");
  return [
    `Hidratação: consuma no mínimo ${litros} L de água por dia, distribuídos ao longo do dia.`,
    "Organização das refeições: evite pular refeições; a regularidade ajuda no controle da fome e da energia.",
    "Atividade física: pratique musculação e/ou atividade física conforme sua rotina.",
    "Sono: durma de 7 a 8 horas por noite — influencia o apetite e a recuperação.",
    "Refeição livre: 1 por semana, sem excessos; retome o plano na refeição seguinte.",
    "Substituições: cada alimento tem opções equivalentes — troque só o que enjoar, mantendo a quantidade.",
    "Material educativo; não substitui acompanhamento profissional.",
  ];
}
