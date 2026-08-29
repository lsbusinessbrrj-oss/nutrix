// Base de alimentos com macros (por 100 g) e medida caseira.
// Ref.: TACO/USDA (aprox.). "g" = gramas por 1 medida caseira.
import { ALIMENTOS_BASE, GRUPO_BASE } from "./foodsBase";

export type Categoria = "proteina" | "carboidrato" | "gordura" | "vegetal" | "fruta" | "bebida";

export interface Alimento {
  nome: string;
  cat: Categoria;
  kcal: number; p: number; c: number; f: number; // por 100 g
  medida: string;      // nome da medida caseira (ex: "colher de sopa", "fatia")
  gPorMedida: number;  // gramas por 1 medida caseira
  vegetariano: boolean; vegano: boolean; lactose: boolean; gluten: boolean;
}

const A = (
  nome: string, cat: Categoria, kcal: number, p: number, c: number, f: number,
  medida: string, gPorMedida: number,
  flags: Partial<{ vegetariano: boolean; vegano: boolean; lactose: boolean; gluten: boolean }> = {},
): Alimento => ({
  nome, cat, kcal, p, c, f, medida, gPorMedida,
  vegetariano: flags.vegetariano ?? true,
  vegano: flags.vegano ?? true,
  lactose: flags.lactose ?? false,
  gluten: flags.gluten ?? false,
});

const naoVeg = { vegetariano: false, vegano: false };
const comLactose = { lactose: true };
const comGluten = { gluten: true };

// Curados (usados pelo CATÁLOGO do quiz e com medidas caseiras revisadas).
const CURADOS: Alimento[] = [
  // ── Carboidratos ──
  A("Pão de forma", "carboidrato", 250, 9, 49, 3.5, "fatia", 25, comGluten),
  A("Tapioca", "carboidrato", 240, 0, 60, 0, "unidade", 60),
  A("Cuscuz de milho", "carboidrato", 112, 3.8, 23, 0.2, "fatia", 80),
  A("Pão de queijo", "carboidrato", 300, 6, 38, 14, "unidade", 20, comLactose),
  A("Arroz branco cozido", "carboidrato", 130, 2.7, 28, 0.3, "colher de sopa", 25),
  A("Arroz integral cozido", "carboidrato", 124, 2.6, 26, 1, "colher de sopa", 25),
  A("Feijão preto cozido", "carboidrato", 77, 4.5, 14, 0.5, "concha", 80),
  A("Macarrão cozido", "carboidrato", 158, 5.8, 31, 0.9, "pegador", 60, comGluten),
  A("Batata doce cozida", "carboidrato", 86, 1.6, 20, 0.1, "unidade pequena", 100),
  A("Mandioca cozida", "carboidrato", 125, 0.6, 30, 0.3, "pedaço", 80),
  A("Inhame cozido", "carboidrato", 97, 1.5, 23, 0.2, "pedaço", 80),
  A("Batata inglesa cozida", "carboidrato", 86, 1.7, 20, 0.1, "unidade média", 90),
  A("Abóbora cozida", "carboidrato", 40, 1, 10, 0.1, "colher de sopa", 40),
  A("Aveia em flocos", "carboidrato", 389, 17, 66, 7, "colher de sopa", 15, comGluten),
  A("Biscoito de polvilho", "carboidrato", 400, 2, 80, 10, "unidade", 5),
  A("Biscoito de água e sal", "carboidrato", 430, 10, 70, 12, "unidade", 6, comGluten),
  A("Biscoito de arroz", "carboidrato", 387, 8, 82, 3, "unidade", 7),

  // ── Proteínas ──
  A("Frango grelhado", "proteina", 165, 31, 0, 3.6, "filé", 100, naoVeg),
  A("Frango desfiado", "proteina", 165, 31, 0, 3.6, "colher de sopa", 20, naoVeg),
  A("Patinho grelhado", "proteina", 219, 32, 0, 9, "porção", 100, naoVeg),
  A("Patinho moído", "proteina", 187, 26, 0, 9, "porção", 100, naoVeg),
  A("Carne bovina assada", "proteina", 219, 32, 0, 9, "fatia", 50, naoVeg),
  A("Carne de porco (lombo)", "proteina", 145, 26, 0, 4, "fatia", 50, naoVeg),
  A("Peixe (tilápia)", "proteina", 128, 26, 0, 2.6, "filé", 100, naoVeg),
  A("Ovo", "proteina", 143, 13, 1.1, 9.5, "unidade", 50, { vegano: false }),
  A("Queijo muçarela", "proteina", 280, 22, 3, 21, "fatia média", 20, { vegano: false, lactose: true }),
  A("Presunto magro", "proteina", 110, 18, 1, 4, "fatia", 15, naoVeg),
  A("Whey protein", "proteina", 380, 80, 8, 6, "dose", 30, { vegano: false, lactose: true }),
  A("Iogurte natural desnatado", "proteina", 56, 10, 4, 0.2, "pote", 170, { vegano: false, lactose: true }),
  A("Tofu firme", "proteina", 144, 15, 3, 8, "fatia", 80),
  A("Grão-de-bico cozido", "proteina", 164, 9, 27, 2.6, "concha", 80),

  // ── Gorduras ──
  A("Requeijão light", "gordura", 160, 10, 7, 10, "colher de sopa", 15, { vegano: false, lactose: true }),
  A("Cream cheese light", "gordura", 180, 8, 6, 15, "colher de sopa", 15, { vegano: false, lactose: true }),
  A("Azeite de oliva", "gordura", 884, 0, 0, 100, "colher de chá", 5),
  A("Pasta de amendoim", "gordura", 588, 25, 20, 50, "colher de sopa", 15),
  A("Abacate", "gordura", 160, 2, 9, 15, "fatia", 40),
  A("Castanhas", "gordura", 620, 15, 14, 58, "punhado", 20),

  // ── Vegetais ──
  A("Salada de alface", "vegetal", 15, 1.4, 2.9, 0.2, "prato", 60),
  A("Salada de alface e tomate", "vegetal", 18, 1, 4, 0.2, "prato", 80),
  A("Salada de legumes", "vegetal", 35, 2, 7, 0.3, "porção", 100),
  A("Brócolis cozido", "vegetal", 34, 2.8, 7, 0.4, "xícara", 90),

  // ── Frutas ──
  A("Maçã", "fruta", 52, 0.3, 14, 0.2, "unidade", 130),
  A("Banana prata", "fruta", 98, 1.3, 26, 0.1, "unidade média", 42),
  A("Mamão", "fruta", 43, 0.5, 11, 0.3, "fatia", 150),
  A("Laranja", "fruta", 47, 0.9, 12, 0.1, "unidade", 130),
  A("Abacaxi", "fruta", 50, 0.5, 13, 0.1, "fatia", 100),
  A("Morango", "fruta", 32, 0.7, 8, 0.3, "xícara", 150),
  A("Melancia", "fruta", 30, 0.6, 8, 0.2, "fatia", 200),
  A("Melão", "fruta", 34, 0.8, 8, 0.2, "fatia", 160),
  A("Pera", "fruta", 57, 0.4, 15, 0.1, "unidade média", 116),
  A("Kiwi", "fruta", 61, 1.1, 15, 0.5, "unidade", 79),
  A("Uva", "fruta", 69, 0.7, 18, 0.2, "cacho pequeno", 100),
  A("Manga", "fruta", 60, 0.8, 15, 0.4, "fatia", 100),

  // ── Bebidas ──
  A("Café", "bebida", 2, 0.1, 0, 0, "xícara", 200),
  A("Leite desnatado", "bebida", 35, 3.4, 5, 0.1, "copo", 200, { vegano: false, lactose: true }),
];

// Base final = curados + os 169 alimentos da planilha da nutri (sem duplicar nome).
const nomesCurados = new Set(CURADOS.map((a) => a.nome));
export const ALIMENTOS: Alimento[] = [
  ...CURADOS,
  ...ALIMENTOS_BASE.filter((a) => !nomesCurados.has(a.nome)),
];

const porNome = new Map(ALIMENTOS.map((a) => [a.nome, a]));
export function alimento(nome: string): Alimento | undefined {
  return porNome.get(nome);
}

export type Restricao = "vegetariano" | "vegano" | "lactose" | "gluten";

export function passaRestricoes(a: Alimento, r: Set<Restricao>): boolean {
  if (r.has("vegano") && !a.vegano) return false;
  if (r.has("vegetariano") && !a.vegetariano) return false;
  if (r.has("lactose") && a.lactose) return false;
  if (r.has("gluten") && a.gluten) return false;
  return true;
}

export function filtrarPorRestricoes(cat: Categoria, r: Set<Restricao>): Alimento[] {
  return ALIMENTOS.filter((a) => a.cat === cat && passaRestricoes(a, r));
}

// ── Mapa: id do alimento no quiz (Home.tsx) -> alimentos reais da base ──
// Combos ("Pão + Frango") já trazem carbo + proteína.
export const CATALOGO: Record<string, string[]> = {
  // Café da manhã / Café da tarde (prefixos cm_ e lt_ compartilham os mesmos)
  pao_frango: ["Pão de forma", "Frango desfiado"],
  pao_ovo: ["Pão de forma", "Ovo"],
  pao_queijo: ["Pão de forma", "Queijo muçarela"],
  pao_presunto: ["Pão de forma", "Presunto magro", "Queijo muçarela"],
  tapioca_queijo: ["Tapioca", "Queijo muçarela"],
  tapioca_frango: ["Tapioca", "Frango desfiado"],
  cuscuz_ovo: ["Cuscuz de milho", "Ovo"],
  pao_queijo_minas: ["Pão de queijo"],
  omelete: ["Ovo", "Queijo muçarela"],
  maca: ["Maçã"],
  banana: ["Banana prata"],
  mamao: ["Mamão"],
  laranja: ["Laranja"],
  abacaxi: ["Abacaxi"],
  morango: ["Morango"],
  melancia: ["Melancia"],
  melao: ["Melão"],
  cafe_leite: ["Café", "Leite desnatado"],
  cafe: ["Café"],
  iogurte: ["Iogurte natural desnatado"],
  whey: ["Whey protein"],
  biscoito_polvilho: ["Biscoito de polvilho"],
  biscoito_agua_sal: ["Biscoito de água e sal"],
  biscoito_arroz: ["Biscoito de arroz"],
  // Almoço / Jantar (prefixos al_ e jt_)
  arroz: ["Arroz branco cozido"],
  feijao_preto: ["Feijão preto cozido"],
  cuscuz: ["Cuscuz de milho"],
  macarrao: ["Macarrão cozido"],
  batata_doce: ["Batata doce cozida"],
  mandioca: ["Mandioca cozida"],
  inhame: ["Inhame cozido"],
  batata_inglesa: ["Batata inglesa cozida"],
  abobora: ["Abóbora cozida"],
  frango_grelhado: ["Frango grelhado"],
  carne_assada: ["Carne bovina assada"],
  carne_grelhada: ["Carne bovina assada"],
  carne_porco: ["Carne de porco (lombo)"],
  patinho_moido: ["Patinho moído"],
  peixe: ["Peixe (tilápia)"],
  salada_alface_tomate: ["Salada de alface e tomate"],
  salada_alface: ["Salada de alface"],
  salada_legumes: ["Salada de legumes"],
};

/** Resolve um id do quiz (com prefixo cm_/al_/lt_/jt_/lm_) para alimentos da base. */
export function alimentosDoId(id: string): Alimento[] {
  const semPrefixo = id.replace(/^(cm|al|lt|jt|lm)_/, "");
  const nomes = CATALOGO[semPrefixo] ?? [];
  return nomes.map((n) => porNome.get(n)).filter((a): a is Alimento => !!a);
}

// Macro-chave por categoria (o que a substituição mantém equivalente).
const MACRO_CHAVE: Record<Categoria, "c" | "p" | "f" | "kcal"> = {
  carboidrato: "c", fruta: "c", proteina: "p", gordura: "f", vegetal: "kcal", bebida: "kcal",
};

// Grupo de substituição de cada alimento (troca só por itens do MESMO grupo:
// carne↔carne, queijo/cremoso↔cremoso, carbo-do-prato↔carbo-do-prato, etc.).
const GRUPO: Record<string, string> = {
  "Frango grelhado": "carne", "Frango desfiado": "carne", "Patinho grelhado": "carne",
  "Patinho moído": "carne", "Carne bovina assada": "carne", "Carne de porco (lombo)": "carne", "Peixe (tilápia)": "carne",
  "Ovo": "prot_leve", "Queijo muçarela": "prot_leve", "Presunto magro": "prot_leve",
  "Iogurte natural desnatado": "prot_leve", "Whey protein": "prot_leve",
  "Tofu firme": "prot_veg", "Grão-de-bico cozido": "prot_veg",
  "Pão de forma": "carbo_pao", "Tapioca": "carbo_pao", "Cuscuz de milho": "carbo_pao",
  "Pão de queijo": "carbo_pao", "Aveia em flocos": "carbo_pao",
  "Biscoito de polvilho": "carbo_pao", "Biscoito de água e sal": "carbo_pao", "Biscoito de arroz": "carbo_pao",
  "Arroz branco cozido": "carbo_prato", "Arroz integral cozido": "carbo_prato", "Batata doce cozida": "carbo_prato",
  "Mandioca cozida": "carbo_prato", "Inhame cozido": "carbo_prato", "Batata inglesa cozida": "carbo_prato",
  "Abóbora cozida": "carbo_prato", "Macarrão cozido": "carbo_prato", "Feijão preto cozido": "carbo_prato",
  "Requeijão light": "cremoso", "Cream cheese light": "cremoso",
  "Azeite de oliva": "gordura_pura", "Pasta de amendoim": "gordura_pura", "Abacate": "gordura_pura", "Castanhas": "gordura_pura",
};
const grupoDe = (a: Alimento) => GRUPO[a.nome] ?? GRUPO_BASE[a.nome] ?? a.cat;

/**
 * Substitutos equivalentes de um alimento: mesmo GRUPO de substituição, com a
 * gramatura ajustada para manter o macronutriente-chave (trocas "calculadas
 * para manter o equilíbrio nutricional", como na referência).
 */
export function substituicoesDe(
  a: Alimento, gramas: number, r: Set<Restricao>, max = 6,
): { alimento: Alimento; gramas: number }[] {
  const chave = MACRO_CHAVE[a.cat];
  const valor = (x: Alimento) => (chave === "kcal" ? x.kcal : x[chave]);
  const base = valor(a);
  if (!base) return [];
  const g = grupoDe(a);
  return ALIMENTOS
    .filter((x) => grupoDe(x) === g && x.nome !== a.nome && passaRestricoes(x, r) && valor(x) > 0)
    .map((x) => ({ alimento: x, gramas: gramas * (base / valor(x)) }))
    .filter((s) => s.gramas >= 5 && s.gramas <= 600)
    .slice(0, max);
}
