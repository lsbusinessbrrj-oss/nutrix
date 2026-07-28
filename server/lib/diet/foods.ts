// Base de alimentos (macros por 100 g prontos p/ consumo). Ref: TACO/USDA.
export interface Alimento {
  nome: string;
  cat: "proteina" | "carboidrato" | "gordura" | "vegetal" | "fruta";
  kcal: number;
  p: number;
  c: number;
  f: number;
  medida: string; // medida caseira p/ 100 g
  vegetariano: boolean;
  vegano: boolean;
  lactose: boolean;
  gluten: boolean;
}

const A = (
  nome: string, cat: Alimento["cat"], kcal: number, p: number, c: number, f: number,
  medida: string, vegetariano = true, vegano = true, lactose = false, gluten = false,
): Alimento => ({ nome, cat, kcal, p, c, f, medida, vegetariano, vegano, lactose, gluten });

export const ALIMENTOS: Alimento[] = [
  // Proteínas
  A("Peito de frango grelhado", "proteina", 165, 31, 0, 3.6, "1 filé médio", false, false),
  A("Patinho moído magro", "proteina", 187, 26, 0, 9, "1 porção", false, false),
  A("Tilápia grelhada", "proteina", 128, 26, 0, 2.6, "1 filé", false, false),
  A("Carne bovina magra (alcatra)", "proteina", 220, 28, 0, 11, "1 bife", false, false),
  A("Atum em água", "proteina", 116, 26, 0, 1, "1 lata", false, false),
  A("Ovo inteiro", "proteina", 143, 13, 1.1, 9.5, "2 ovos", true, false),
  A("Iogurte natural desnatado", "proteina", 56, 10, 4, 0.2, "1 pote", true, false, true),
  A("Queijo cottage", "proteina", 98, 11, 3.4, 4.3, "2 col. sopa", true, false, true),
  A("Whey protein", "proteina", 380, 80, 8, 6, "doses", true, false, true),
  A("Tofu firme", "proteina", 144, 15, 3, 8, "1 fatia", true, true),
  A("Grão-de-bico cozido", "proteina", 164, 9, 27, 2.6, "1 concha", true, true),
  A("Lentilha cozida", "proteina", 116, 9, 20, 0.4, "1 concha", true, true),
  // Carboidratos
  A("Arroz branco cozido", "carboidrato", 130, 2.7, 28, 0.3, "3 col. sopa"),
  A("Arroz integral cozido", "carboidrato", 124, 2.6, 26, 1, "3 col. sopa"),
  A("Batata doce cozida", "carboidrato", 86, 1.6, 20, 0.1, "1 unid. pequena"),
  A("Mandioca cozida", "carboidrato", 125, 0.6, 30, 0.3, "1 pedaço"),
  A("Feijão carioca cozido", "carboidrato", 76, 4.8, 13.6, 0.5, "1 concha"),
  A("Aveia em flocos", "carboidrato", 389, 17, 66, 7, "col. sopa", true, true, false, true),
  A("Pão integral", "carboidrato", 247, 13, 41, 3.4, "2 fatias", true, true, false, true),
  A("Tapioca", "carboidrato", 240, 0, 60, 0, "1 unidade"),
  A("Cuscuz de milho", "carboidrato", 112, 3.8, 23, 0.2, "1 fatia"),
  A("Macarrão cozido", "carboidrato", 158, 5.8, 31, 0.9, "1 pegador", true, true, false, true),
  // Gorduras
  A("Azeite de oliva", "gordura", 884, 0, 0, 100, "fio / col. chá"),
  A("Pasta de amendoim", "gordura", 588, 25, 20, 50, "col. sopa"),
  A("Abacate", "gordura", 160, 2, 9, 15, "fatias"),
  A("Castanhas", "gordura", 620, 15, 14, 58, "punhado"),
  // Vegetais
  A("Brócolis cozido", "vegetal", 34, 2.8, 7, 0.4, "1 xícara"),
  A("Salada verde + legumes", "vegetal", 25, 1.5, 5, 0.2, "à vontade"),
  A("Abobrinha refogada", "vegetal", 20, 1.2, 4, 0.2, "1 xícara"),
  A("Cenoura", "vegetal", 41, 0.9, 10, 0.2, "1 unidade"),
  // Frutas
  A("Banana", "fruta", 89, 1.1, 23, 0.3, "1 unidade"),
  A("Maçã", "fruta", 52, 0.3, 14, 0.2, "1 unidade"),
  A("Mamão", "fruta", 43, 0.5, 11, 0.3, "1 fatia"),
  A("Laranja", "fruta", 47, 0.9, 12, 0.1, "1 unidade"),
  A("Morango", "fruta", 32, 0.7, 8, 0.3, "1 xícara"),
];

export type Restricao = "vegetariano" | "vegano" | "lactose" | "gluten";

/** Filtra a base pelas restrições de saúde do cliente. */
export function filtrarPorRestricoes(cat: Alimento["cat"], restricoes: Set<Restricao>): Alimento[] {
  return ALIMENTOS.filter((a) => {
    if (a.cat !== cat) return false;
    if (restricoes.has("vegano") && !a.vegano) return false;
    if (restricoes.has("vegetariano") && !a.vegetariano) return false;
    if (restricoes.has("lactose") && a.lactose) return false;
    if (restricoes.has("gluten") && a.gluten) return false;
    return true;
  });
}
