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

  // Coleta os itens (com gramas iniciais); depois normaliza os itens variáveis
  // para bater EXATAMENTE o alvo calórico da refeição (fixos não escalam).
  interface Ent { a: Alimento; g: number; override?: string; fixo?: boolean }
  const ents: Ent[] = [];
  const kOf = (e: Ent) => (e.override ? 0 : (e.a.kcal * e.g) / 100);
  const somaVar = () => ents.reduce((s, e) => s + (e.fixo ? 0 : kOf(e)), 0);

  const prot = por("proteina")[0] ?? padrao("proteina", leve ? PROT_LEVE : undefined);
  if (prot) {
    const cap = leve ? CAP_PROT_LEVE : CAP_PROT_PRINCIPAL;
    ents.push({ a: prot, g: arred5(Math.min(Math.max((targetProt / prot.p) * 100, 30), cap)) });
  }
  const carb = por("carboidrato")[0] ?? padrao("carboidrato");

  if (leve) {
    const fruta = por("fruta")[0] ?? padrao("fruta");
    if (fruta) ents.push({ a: fruta, g: fruta.gPorMedida });
    if (carb) {
      const rest = Math.max(targetKcal - somaVar(), 0);
      ents.push({ a: carb, g: arred5(Math.min(Math.max((rest / carb.kcal) * 100, carb.gPorMedida), carb.gPorMedida * 4)) });
    }
  } else {
    const legume = acharVeg((a) => a.nome === "Brócolis cozido");
    const salada = acharVeg((a) => a.nome.includes("Salada"));
    if (carb) {
      const rest = Math.max(targetKcal - somaVar(), 0);
      ents.push({ a: carb, g: arred5(Math.min(Math.max((rest / carb.kcal) * 100, carb.gPorMedida), carb.gPorMedida * 9)) });
    }
    if (legume) ents.push({ a: legume, g: 100, fixo: true });
    if (salada) ents.push({ a: salada, g: salada.gPorMedida, override: "À vontade", fixo: true });
  }

  // Normaliza os itens variáveis para o alvo calórico (a conta fecha).
  const fixK = ents.reduce((s, e) => s + (e.fixo ? kOf(e) : 0), 0);
  const varK = somaVar();
  const fator = varK > 0 ? Math.max(0.35, Math.min(3, (targetKcal - fixK) / varK)) : 1;
  for (const e of ents) if (!e.fixo) e.g = arred5(e.g * fator);

  const foods: FoodItem[] = ents.map((e) => ({
    name: e.a.nome,
    quantity: e.override ?? formatarMedida(e.a, e.g),
    substituicoes: subsFor(e.a.nome, e.g, restr),
  }));
  const kcal = ents.reduce((s, e) => s + kOf(e), 0);
  return { foods, kcal: Math.round(kcal) };
}

// ── Opção da referência ──
// kcal de base de uma opção, separando itens fixos (não escalam) dos variáveis.
function kcalBaseOpcao(op: RefOpcao): { fixo: number; variavel: number } {
  let fixo = 0, variavel = 0;
  for (const it of op.itens) {
    if (it.livre) continue; // "À vontade" não conta calorias
    const k = (it.kcal100 * it.baseG) / 100;
    if (it.fixo) fixo += k; else variavel += k;
  }
  return { fixo, variavel };
}
function refItemGramas(it: RefItem, s: number) { return it.livre ? 0 : it.fixo ? it.baseG : Math.round(it.baseG * s * 10) / 10; }
function refItemQtd(it: RefItem, s: number, g: number): string {
  if (it.livre) return "À vontade";
  if (it.fixo || Math.abs(s - 1) < 0.06) return it.qtd;
  const u = it.unidade === "ml" ? "ml" : "g";
  if (it.medida && it.gPorMedida) { const n = Math.max(1, Math.round(g / it.gPorMedida)); return `${n} ${pluralMedida(it.medida, n)} ou ${fmtG(g)}${u}`; }
  return `${fmtG(g)} ${u}`;
}
// Escala a gramatura de uma troca pelo mesmo fator do item (mantém a troca
// "batendo" a nova quantidade). Ex.: item ×1,17 → "80 g" vira "94 g".
function escalarQtdTroca(q: string, s: number): string {
  if (Math.abs(s - 1) < 0.06 || /vontade/i.test(q)) return q;
  const m1 = q.match(/^(\d+(?:[.,]\d+)?)\s+(.+?)\s+ou\s+(\d+(?:[.,]\d+)?)\s*(g|ml)$/i);
  if (m1) {
    const nOld = parseFloat(m1[1].replace(",", ".")), xOld = parseFloat(m1[3].replace(",", "."));
    const xNew = xOld * s, perUnit = xOld / nOld;
    const nNew = Math.max(1, Math.round(xNew / perUnit));
    return `${nNew} ${m1[2]} ou ${Math.round(xNew)}${m1[4]}`;
  }
  const m2 = q.match(/^(\d+(?:[.,]\d+)?)\s*(g|ml)$/i);
  if (m2) return `${Math.round(parseFloat(m2[1].replace(",", ".")) * s)} ${m2[2]}`;
  return q;
}

// Escala a opção de referência para bater EXATAMENTE o alvo calórico da refeição
// (itens fixos ficam; os variáveis absorvem a diferença). Assim toda opção de
// uma refeição soma o mesmo valor e "a conta fecha" em qualquer escolha.
function refOpcaoToOption(op: RefOpcao, alvoKcal: number): Option {
  const { fixo, variavel } = kcalBaseOpcao(op);
  const s = variavel > 0 ? Math.min(2.5, Math.max(0.4, (alvoKcal - fixo) / variavel)) : 1;
  const foods = op.itens.map((it) => {
    const g = refItemGramas(it, s);
    const sItem = it.fixo || it.livre ? 1 : s; // troca escala junto com o item
    const subs = (REF_SUBS[it.name] ?? []).map((x) => ({ name: x.name, quantity: escalarQtdTroca(x.quantity, sItem) }));
    return { name: it.name, quantity: refItemQtd(it, s, g), substituicoes: subs };
  });
  const kcal = op.itens.reduce((acc, it) => acc + (it.kcal100 * refItemGramas(it, s)) / 100, 0);
  return { foods, kcal: Math.round(kcal), obs: op.obs };
}

export function gerarPlano(perfil: PerfilNutri, healthConditions?: string | null, selecoes?: Selecoes): PlanData {
  const metas = calcularMetas(perfil);
  const restr = restricoesDe(healthConditions);

  // Alvo de cada refeição = objetivo diário distribuído na proporção da dieta de
  // referência (Opção 1). A soma dos alvos = objetivo diário EXATO, então
  // escolher qualquer opção em cada refeição sempre fecha o kcal/dia.
  const pesoRef = REF_REFEICOES.map((ref) => { const b = kcalBaseOpcao(ref.opcoes[0]); return b.fixo + b.variavel; });
  const totalRef = pesoRef.reduce((a, b) => a + b, 0);

  const meals: Meal[] = REF_REFEICOES.map((ref, mi) => {
    const alvo = metas.calorias * (pesoRef[mi] / totalRef); // alvo calórico da refeição
    const refOptions = ref.opcoes.map((op) => refOpcaoToOption(op, alvo));
    const leve = ref.key === "cafe_manha" || ref.key === "lanche_tarde";

    // Opção 1 = escolha do cliente (se houver); senão só as opções de referência.
    const ids = selecoes?.[ref.key] ?? [];
    const escolhidos = ids.flatMap(alimentosDoId).filter((a) => passaRestricoes(a, restr));
    const targetProt = Math.round(metas.proteinaG * (leve ? 0.15 : 0.3));
    let options: Option[] = escolhidos.length
      ? [montarOpcaoCliente(escolhidos, alvo, targetProt, leve, restr, mi), ...refOptions]
      : refOptions;
    options = options.slice(0, 3); // no máximo 3 opções por refeição (1, 2 e 3)
    return { name: ref.name, time: ref.time, calories: Math.round(alvo), protein: 0, options };
  });

  return {
    totalCalories: Math.round(metas.calorias), proteinTarget: metas.proteinaG, waterMl: metas.aguaMl, meals,
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
