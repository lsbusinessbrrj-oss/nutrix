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
  const pickPadrao = (c: Categoria, nomes?: Set<string>) => {
    let pool = filtrarPorRestricoes(c, restr);
    if (nomes) { const f = pool.filter((a) => nomes.has(a.nome)); if (f.length) pool = f; }
    return pool.length ? pick(pool, seed) : undefined;
  };

  interface Ent { a: Alimento; g: number; fixo?: boolean }
  const ents: Ent[] = [];

  // FIEL ÀS ESCOLHAS: inclui TODOS os alimentos que o cliente marcou (sem repetir).
  const vistos = new Set<string>();
  for (const a of base) {
    if (vistos.has(a.nome)) continue;
    vistos.add(a.nome);
    const g0 = a.gPorMedida > 0 ? a.gPorMedida : 100;
    // Bebidas / itens de quase-zero kcal (café, chá) não escalam — porção padrão.
    const quaseZero = a.cat === "bebida" || a.kcal < 12;
    ents.push({ a, g: g0, fixo: quaseZero });
  }

  // Só COMPLETA se a seleção não tiver proteína ou carboidrato (pra não desbalancear).
  // Usa a CATEGORIA (verdura de baixa caloria não conta como proteína). Os itens
  // adicionados já entram dimensionados perto do alvo (bom ponto de partida).
  const kcalAtual = () => ents.reduce((s, e) => s + (e.fixo ? 0 : (e.a.kcal * e.g) / 100), 0);
  const temProt = base.some((a) => a.cat === "proteina");
  const temCarb = base.some((a) => a.cat === "carboidrato");
  if (!temProt) {
    const p = pickPadrao("proteina", leve ? PROT_LEVE : undefined);
    if (p && p.p > 0) ents.push({ a: p, g: arred5(Math.min(Math.max((targetProt / p.p) * 100, 20), leve ? CAP_PROT_LEVE : CAP_PROT_PRINCIPAL)) });
  }
  if (!temCarb) {
    const c = pickPadrao("carboidrato");
    if (c) { const rest = Math.max(targetKcal - kcalAtual(), 0); const mult = leve ? 4 : 9; ents.push({ a: c, g: arred5(Math.min(Math.max((rest / c.kcal) * 100, c.gPorMedida), c.gPorMedida * mult)) }); }
  }
  if (!ents.length) { const p = pickPadrao("proteina"); if (p) ents.push({ a: p, g: p.gPorMedida }); }

  // Ajuste (regras 3/4): escala proteínas (fp) e demais (fc) pra bater proteína E kcal.
  const marca = ents.map((e) => ({
    kcal: (e.a.kcal * e.g) / 100, prot: (e.a.p * e.g) / 100,
    fixo: !!e.fixo, prote: !e.fixo && ehProteico(e.a.kcal, e.a.p),
  }));
  const e0 = resolverEscalas(marca, targetKcal, targetProt);
  const fixedK = marca.reduce((a, mk) => a + (mk.fixo ? mk.kcal : 0), 0);
  const varNow = marca.reduce((a, mk) => a + (mk.fixo ? 0 : mk.kcal * (mk.prote ? e0.fp : e0.fc)), 0);
  const corr = varNow > 0 ? Math.max(0.6, Math.min(1.5, (targetKcal - fixedK) / varNow)) : 1;
  const fp = e0.fp * corr, fc = e0.fc * corr;
  ents.forEach((en, i) => { if (!en.fixo) en.g = arred5(en.g * (marca[i].prote ? fp : fc)); });

  const foods: FoodItem[] = ents.map((e) => ({
    name: e.a.nome,
    quantity: formatarMedida(e.a, e.g),
    substituicoes: subsFor(e.a.nome, e.g, restr),
  }));
  const kcal = ents.reduce((s, e) => s + (e.a.kcal * e.g) / 100, 0);
  const protein = ents.reduce((s, e) => s + (e.a.p * e.g) / 100, 0);
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
  const e = resolverEscalas(xs, alvoKcal, alvoProt);
  // Correção final priorizando CALORIAS (regra 1): se ainda estourar/faltar, um
  // ajuste uniforme nos itens variáveis aproxima a kcal do alvo da refeição.
  const fixedK = xs.reduce((a, x) => a + (x.fixo ? x.kcal : 0), 0);
  const varNow = xs.reduce((a, x) => a + (x.fixo ? 0 : x.kcal * (x.prote ? e.fp : e.fc)), 0);
  const corr = varNow > 0 ? Math.max(0.6, Math.min(1.5, (alvoKcal - fixedK) / varNow)) : 1;
  const fp = e.fp * corr, fc = e.fc * corr;
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

    // CADA escolha do cliente vira UMA opção (fiel ao que ele marcou no quiz).
    // Se escolheu 3, as 3 opções são dele; se escolheu menos, completa com a
    // referência (variedade). Regra 2: exatamente 3 opções.
    const ids = selecoes?.[ref.key] ?? [];
    const clientOptions: Option[] = ids
      .map((id, k) => {
        const foods = alimentosDoId(id).filter((a) => passaRestricoes(a, restr));
        return foods.length ? montarOpcaoCliente(foods, alvo, alvoProt, leve, restr, mi + k) : null;
      })
      .filter((o): o is Option => !!o);

    const options: Option[] = [...clientOptions, ...refOptions];
    // Regra 2: EXATAMENTE 3 opções. Completa com opções da base se faltar.
    let seed = mi + 7;
    while (options.length < 3) options.push(montarOpcaoCliente([], alvo, alvoProt, leve, restr, seed++));
    options.length = 3;

    return { name: ref.name, time: ref.time, calories: Math.round(alvo), protein: Math.round(alvoProt), options };
  });

  // Regras 14/15: somatório diário de cada linha de opção (1, 2 e 3) vs meta.
  const metaKcal = Math.round(metas.calorias), metaProt = metas.proteinaG;
  const linhas: ResumoLinha[] = [0, 1, 2].map((i) => {
    const kcal = meals.reduce((s, m) => s + (m.options[i]?.kcal ?? 0), 0);
    const protein = meals.reduce((s, m) => s + (m.options[i]?.protein ?? 0), 0);
    return { opcao: i + 1, kcal, protein, pctKcal: Math.round((kcal / metaKcal) * 100), pctProt: Math.round((protein / metaProt) * 100) };
  });

  const plano: PlanData = {
    totalCalories: metaKcal, proteinTarget: metaProt, waterMl: metas.aguaMl, meals,
    resumo: { linhas, metaKcal, metaProt },
    summary: { tmb: metas.tmb, tdee: metas.tdee, proteinPerKg: metas.proteinaPorKg, carbs: metas.carboidratoG, fat: metas.gorduraG, waterMl: metas.aguaMl },
    orientacao: orientacoes(metas.aguaMl),
  };

  // Regra 18: validação automática antes de liberar (avisa no log se algo falhar).
  const val = validarPlano(plano);
  const falhas = val.filter((x) => !x.ok);
  if (falhas.length) console.warn("[NutriX] Validação do plano — atenção:\n" + falhas.map((x) => `  • ${x.regra}: ${x.detalhe}`).join("\n"));
  return plano;
}

export interface ValidacaoItem { regra: string; ok: boolean; detalhe: string }

/** Regra 18: confere as regras obrigatórias do plano antes de gerar o PDF. */
export function validarPlano(plano: PlanData): ValidacaoItem[] {
  const v: ValidacaoItem[] = [];
  const pct = (x: number, base: number) => (base > 0 ? Math.abs(x - base) / base : 0);

  // Regra 2 — exatamente 3 opções.
  const fora3 = plano.meals.filter((m) => m.options.length !== 3).map((m) => m.name);
  v.push({ regra: "3 opções por refeição", ok: fora3.length === 0, detalhe: fora3.length ? `refeições com nº errado: ${fora3.join(", ")}` : "todas com 3 opções" });

  // Regra 5/14 — toda opção com calorias e proteína calculadas.
  const semMacro = plano.meals.some((m) => m.options.some((o) => !(o.kcal > 0) || o.protein == null));
  v.push({ regra: "kcal e proteína calculadas", ok: !semMacro, detalhe: semMacro ? "há opção sem kcal/proteína" : "ok" });

  // Regra 3 — opções da mesma refeição próximas em calorias (±12% do alvo).
  const desK: string[] = [];
  for (const m of plano.meals) for (const o of m.options) if (pct(o.kcal, m.calories) > 0.12) desK.push(`${m.name} (${o.kcal} vs ${m.calories})`);
  v.push({ regra: "opções equivalentes em calorias (±12%)", ok: desK.length === 0, detalhe: desK.length ? desK.join("; ") : "ok" });

  // Regra 8 — toda substituição com quantidade.
  let subSemQtd = 0;
  for (const m of plano.meals) for (const o of m.options) for (const f of o.foods) for (const s of f.substituicoes) if (!s.quantity) subSemQtd++;
  v.push({ regra: "substituições com quantidade", ok: subSemQtd === 0, detalhe: subSemQtd ? `${subSemQtd} troca(s) sem quantidade` : "ok" });

  // Regra 14/17 — somatório diário de cada opção próximo da meta (kcal ±5%, proteína ±8%).
  for (const l of plano.resumo.linhas) {
    const okK = pct(l.kcal, plano.resumo.metaKcal) <= 0.05;
    const okP = pct(l.protein, plano.resumo.metaProt) <= 0.08;
    v.push({ regra: `Dia Opção ${l.opcao} próximo da meta`, ok: okK && okP, detalhe: `${l.kcal} kcal (${l.pctKcal}%) · ${l.protein} g prot (${l.pctProt}%)` });
  }
  return v;
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
