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
interface Option { foods: FoodItem[]; kcal: number; protein: number; obs?: string }
interface Meal { name: string; time: string; calories: number; protein: number; options: Option[] }
export interface ResumoLinha { opcao: number; kcal: number; protein: number; pctKcal: number; pctProt: number }
export interface PlanData {
  totalCalories: number; proteinTarget: number; waterMl: number;
  meals: Meal[];
  resumo: { linhas: ResumoLinha[]; metaKcal: number; metaProt: number };
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

  // Estratégia (regras 1, 3, 4): dimensiona a PROTEÍNA para o alvo de proteína
  // da refeição e o CARBOIDRATO para preencher as calorias restantes. Assim a
  // opção bate proteína E kcal (as duas prioridades). Fixos não escalam.
  interface Ent { a: Alimento; g: number; override?: string; fixo?: boolean }
  const ents: Ent[] = [];
  const kOf = (e: Ent) => (e.override ? 0 : (e.a.kcal * e.g) / 100);
  const usada = () => ents.reduce((s, e) => s + kOf(e), 0);

  const prot = por("proteina")[0] ?? padrao("proteina", leve ? PROT_LEVE : undefined);
  if (prot && prot.p > 0) {
    const cap = leve ? CAP_PROT_LEVE : CAP_PROT_PRINCIPAL;
    ents.push({ a: prot, g: arred5(Math.min(Math.max((targetProt / prot.p) * 100, 20), cap)) });
  }
  const carb = por("carboidrato")[0] ?? padrao("carboidrato");

  if (leve) {
    const fruta = por("fruta")[0] ?? padrao("fruta");
    if (fruta) ents.push({ a: fruta, g: fruta.gPorMedida });
  } else {
    const legume = acharVeg((a) => a.nome === "Brócolis cozido");
    const salada = acharVeg((a) => a.nome.includes("Salada"));
    if (legume) ents.push({ a: legume, g: 100, fixo: true });
    if (salada) ents.push({ a: salada, g: salada.gPorMedida, override: "À vontade", fixo: true });
  }
  if (carb) {
    const rest = Math.max(targetKcal - usada(), 0);
    const mult = leve ? 4 : 9;
    ents.push({ a: carb, g: arred5(Math.min(Math.max((rest / carb.kcal) * 100, carb.gPorMedida), carb.gPorMedida * mult)) });
  }

  // Ajuste (regras 3/4): resolve fp/fc para bater proteína E calorias do alvo.
  const marca = ents.map((e) => ({
    kcal: kOf(e), prot: e.override ? 0 : (e.a.p * e.g) / 100,
    fixo: !!e.fixo, prote: !e.fixo && !e.override && ehProteico(e.a.kcal, e.a.p),
  }));
  const { fp, fc } = resolverEscalas(marca, targetKcal, targetProt);
  ents.forEach((e, i) => { if (!e.fixo) e.g = arred5(e.g * (marca[i].prote ? fp : fc)); });

  const foods: FoodItem[] = ents.map((e) => ({
    name: e.a.nome,
    quantity: e.override ?? formatarMedida(e.a, e.g),
    substituicoes: subsFor(e.a.nome, e.g, restr),
  }));
  const kcal = ents.reduce((s, e) => s + kOf(e), 0);
  const protein = ents.reduce((s, e) => s + (e.override ? 0 : (e.a.p * e.g) / 100), 0);
  return { foods, kcal: Math.round(kcal), protein: Math.round(protein) };
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
// Proteína de base de uma opção (soma dos itens, na gramatura de referência).
function protBaseOpcao(op: RefOpcao): number {
  return op.itens.reduce((s, it) => s + (it.livre ? 0 : (it.p100 * it.baseG) / 100), 0);
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

// Um item é "proteico" quando ≥30% das calorias vêm de proteína (frango, ovo,
// whey, queijo…). Caso contrário é fonte de carbo/energia (arroz, pão, banana…).
const ehProteico = (kcal100: number, p100: number) => kcal100 > 0 && (p100 * 4) / kcal100 >= 0.3;

// Resolve dois fatores de escala (fp p/ itens proteicos, fc p/ os demais) para
// a opção bater ao mesmo tempo o alvo de PROTEÍNA e o alvo de CALORIAS.
// Itens fixos não escalam. (Sistema linear 2×2.)
function resolverEscalas(itens: { kcal: number; prot: number; fixo: boolean; prote: boolean }[], alvoK: number, alvoP: number): { fp: number; fc: number } {
  let fK = 0, fP = 0, pK = 0, pP = 0, cK = 0, cP = 0;
  for (const it of itens) {
    if (it.fixo) { fK += it.kcal; fP += it.prot; }
    else if (it.prote) { pK += it.kcal; pP += it.prot; }
    else { cK += it.kcal; cP += it.prot; }
  }
  const clamp = (x: number) => Math.max(0.35, Math.min(2.6, x));
  const c1 = alvoP - fP, c2 = alvoK - fK, det = pP * cK - cP * pK;
  if (Math.abs(det) > 1e-6) return { fp: clamp((c1 * cK - cP * c2) / det), fc: clamp((pP * c2 - c1 * pK) / det) };
  const nonK = pK + cK; const f = nonK > 0 ? clamp((alvoK - fK) / nonK) : 1; // sem separação → escala por kcal
  return { fp: f, fc: f };
}

// Escala a opção de referência para bater o alvo de PROTEÍNA e de CALORIAS da
// refeição (regras 3 e 4). Assim as 3 opções ficam equivalentes e "a conta fecha".
function refOpcaoToOption(op: RefOpcao, alvoKcal: number, alvoProt: number): Option {
  const xs = op.itens.map((it) => ({
    it, kcal: (it.kcal100 * it.baseG) / 100, prot: (it.p100 * it.baseG) / 100,
    fixo: !!(it.fixo || it.livre), prote: !it.fixo && !it.livre && ehProteico(it.kcal100, it.p100),
  }));
  const { fp, fc } = resolverEscalas(xs, alvoKcal, alvoProt);
  const fatorDe = (x: typeof xs[number]) => (x.fixo ? 1 : x.prote ? fp : fc);
  const foods = xs.map((x) => {
    const s = fatorDe(x);
    const g = x.it.livre ? 0 : Math.round(x.it.baseG * s * 10) / 10;
    const subs = (REF_SUBS[x.it.name] ?? []).map((y) => ({ name: y.name, quantity: escalarQtdTroca(y.quantity, x.fixo ? 1 : s) }));
    return { name: x.it.name, quantity: refItemQtd(x.it, s, g), substituicoes: subs };
  });
  const kcal = xs.reduce((a, x) => a + x.kcal * fatorDe(x), 0);
  const protein = xs.reduce((a, x) => a + x.prot * fatorDe(x), 0);
  return { foods, kcal: Math.round(kcal), protein: Math.round(protein), obs: op.obs };
}

export function gerarPlano(perfil: PerfilNutri, healthConditions?: string | null, selecoes?: Selecoes): PlanData {
  const metas = calcularMetas(perfil);
  const restr = restricoesDe(healthConditions);

  // Distribuição da meta por refeição (regra 4): kcal e proteína são repartidos
  // na proporção da dieta de referência (Opção 1). As somas dos alvos batem o
  // objetivo diário EXATO, então escolher qualquer opção sempre fecha a conta.
  const pesoRef = REF_REFEICOES.map((ref) => { const b = kcalBaseOpcao(ref.opcoes[0]); return b.fixo + b.variavel; });
  const totalRef = pesoRef.reduce((a, b) => a + b, 0);
  const protRef = REF_REFEICOES.map((ref) => protBaseOpcao(ref.opcoes[0]));
  const totalProtRef = protRef.reduce((a, b) => a + b, 0) || 1;

  const meals: Meal[] = REF_REFEICOES.map((ref, mi) => {
    const alvo = metas.calorias * (pesoRef[mi] / totalRef);          // alvo kcal da refeição
    const alvoProt = metas.proteinaG * (protRef[mi] / totalProtRef); // alvo proteína da refeição
    const leve = ref.key === "cafe_manha" || ref.key === "lanche_tarde";
    const refOptions = ref.opcoes.map((op) => refOpcaoToOption(op, alvo, alvoProt));

    // Opção 1 = escolha do cliente (se houver); depois as opções de referência.
    const ids = selecoes?.[ref.key] ?? [];
    const escolhidos = ids.flatMap(alimentosDoId).filter((a) => passaRestricoes(a, restr));
    let options: Option[] = escolhidos.length
      ? [montarOpcaoCliente(escolhidos, alvo, alvoProt, leve, restr, mi), ...refOptions]
      : [...refOptions];

    // Regra 2: EXATAMENTE 3 opções. Completa com opções da base se faltar.
    let seed = mi + 3;
    while (options.length < 3) options.push(montarOpcaoCliente([], alvo, alvoProt, leve, restr, seed++));
    options = options.slice(0, 3);

    return { name: ref.name, time: ref.time, calories: Math.round(alvo), protein: Math.round(alvoProt), options };
  });

  // Regras 14/15: somatório diário de cada linha de opção (1, 2 e 3) vs meta.
  const metaKcal = Math.round(metas.calorias), metaProt = metas.proteinaG;
  const linhas: ResumoLinha[] = [0, 1, 2].map((i) => {
    const kcal = meals.reduce((s, m) => s + (m.options[i]?.kcal ?? 0), 0);
    const protein = meals.reduce((s, m) => s + (m.options[i]?.protein ?? 0), 0);
    return { opcao: i + 1, kcal, protein, pctKcal: Math.round((kcal / metaKcal) * 100), pctProt: Math.round((protein / metaProt) * 100) };
  });

  return {
    totalCalories: metaKcal, proteinTarget: metaProt, waterMl: metas.aguaMl, meals,
    resumo: { linhas, metaKcal, metaProt },
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
