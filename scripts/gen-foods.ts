// Gera server/lib/diet/foodsBase.ts a partir da aba Base_Alimentos da planilha
// da nutricionista (NUTRIX - BASE - REV 1.xlsx). Macros = exatos da planilha;
// medida caseira / porção e flags (veg/lactose/glúten) e grupo de substituição
// são inferidos por categoria + nome (a planilha não traz esses campos).
import { readFileSync, writeFileSync } from "node:fs";
import * as XLSX from "xlsx";

const XLSX_PATH = process.argv[2] ?? "/Users/andreanenogueira/Downloads/NUTRIX - BASE - REV 1.xlsx";
type AppCat = "proteina" | "carboidrato" | "gordura" | "vegetal" | "fruta" | "bebida";

const wb = XLSX.read(readFileSync(XLSX_PATH), { type: "buffer" });
const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets["Base_Alimentos"], { defval: "" });

const num = (v: any) => (typeof v === "number" ? v : parseFloat(String(v).replace(",", "."))) || 0;
const norm = (s: string) => s.toLowerCase();

// Categoria da planilha -> categoria do app. null = decide pelo macro dominante.
const CATMAP: Record<string, AppCat | null> = {
  "Cereais e pães": "carboidrato",
  "Tubérculos e raízes": "carboidrato",
  "Leguminosas": "carboidrato",
  "Carnes e aves": "proteina",
  "Peixes e frutos do mar": "proteina",
  "Ovos": "proteina",
  "Leites e derivados": "proteina",
  "Frutas": "fruta",
  "Verduras e legumes": "vegetal",
  "Oleaginosas e sementes": "gordura",
  "Gorduras": "gordura",
  "Pratos regionais": null,
  "Doces e extras": null,
  "Bebidas": "bebida",
};

function dominante(p: number, c: number, f: number): AppCat {
  const arr: [AppCat, number][] = [["proteina", p * 4], ["carboidrato", c * 4], ["gordura", f * 9]];
  return arr.sort((a, b) => b[1] - a[1])[0][0];
}

// medida caseira + gramas por medida
function medida(catSheet: string, cat: AppCat, nome: string): [string, number] {
  const n = norm(nome);
  if (cat === "proteina") {
    if (catSheet === "Ovos") {
      if (n.includes("codorna")) return ["unidade", 10];
      if (n.includes("clara")) return ["unidade", 33];
      return ["unidade", 50];
    }
    if (catSheet === "Leites e derivados") {
      if (n.includes("leite")) return ["copo", 200];
      if (n.includes("iogurte")) return ["pote", 170];
      if (n.includes("requeij")) return ["colher de sopa", 20];
      if (n.includes("ricota")) return ["fatia", 30];
      return ["fatia", 20]; // queijos
    }
    return ["porção", 100]; // carnes, aves, peixes, frutos do mar
  }
  if (cat === "carboidrato") {
    if (catSheet === "Leguminosas") return ["concha", 80];
    if (catSheet === "Tubérculos e raízes") return ["porção", 100];
    if (/(pão|pao)/.test(n)) return /(franc|forma|integral)/.test(n) && n.includes("franc") ? ["unidade", 50] : ["fatia", 25];
    if (/(tapioca|beiju)/.test(n)) return ["unidade", 60];
    if (/(aveia|granola)/.test(n)) return ["colher de sopa", 15];
    if (/(farinha|fubá|fuba)/.test(n)) return ["colher de sopa", 15];
    if (n.includes("biscoito")) return ["unidade", 6];
    if (n.includes("milho verde")) return ["espiga", 100];
    return ["colher de sopa", 25]; // arroz, macarrão, cuscuz, polenta, canjica
  }
  if (cat === "fruta") {
    if (n.includes("castanha")) return ["unidade", 5];
    if (n.includes("banana")) return ["unidade", 80];
    if (n.includes("maçã") || n.includes("maca")) return ["unidade", 130];
    if (n.includes("laranja")) return ["unidade", 130];
    if (n.includes("mamão") || n.includes("mamao")) return ["fatia", 150];
    if (n.includes("manga")) return ["unidade", 120];
    if (n.includes("melancia")) return ["fatia", 200];
    if (n.includes("melão") || n.includes("melao")) return ["fatia", 150];
    if (n.includes("abacaxi")) return ["fatia", 100];
    if (n.includes("pera")) return ["unidade", 130];
    if (n.includes("goiaba")) return ["unidade", 100];
    return ["porção", 100]; // morango, uva, polpas, frutas regionais
  }
  if (cat === "vegetal") {
    if (/(alface|couve|repolho|chicória|chicoria|vinagreira|jambu)/.test(n)) return ["porção", 40];
    return ["porção", 60];
  }
  if (cat === "gordura") {
    if (catSheet === "Gorduras") {
      if (/(manteiga|margarina)/.test(n)) return ["colher de chá", 8];
      return ["colher de sopa", 8]; // azeite, óleo, dendê
    }
    if (/(chia|linhaça|linhaca)/.test(n)) return ["colher de sopa", 12];
    if (n.includes("coco")) return ["colher de sopa", 20];
    return ["porção", 25]; // amendoim, castanhas
  }
  if (cat === "bebida") return ["copo", 200];
  return ["porção", 100];
}

function flags(catSheet: string, nome: string) {
  const n = norm(nome);
  const f = { vegetariano: true, vegano: true, lactose: false, gluten: false };
  if (catSheet === "Carnes e aves" || catSheet === "Peixes e frutos do mar" || catSheet === "Pratos regionais") {
    f.vegetariano = false; f.vegano = false;
  }
  if (catSheet === "Ovos") { f.vegano = false; }
  if (catSheet === "Leites e derivados") { f.vegano = false; f.lactose = true; }
  if (catSheet === "Doces e extras") {
    if (n.includes("leite")) { f.lactose = true; f.vegano = false; }
    if (/(bolo|cocada|paçoca|pacoca|pé-de|pe-de)/.test(n)) f.vegano = false;
  }
  if (n.includes("mel") && !n.includes("melancia") && !n.includes("melão") && !n.includes("melao")) f.vegano = false;
  if (/(pão|pao|macarrão|macarrao|aveia|bolo)/.test(n)) f.gluten = true;
  if (n.includes("biscoito") && /(água|agua|sal)/.test(n)) f.gluten = true;
  return f;
}

// Grupo de substituição (troca só entre itens do mesmo grupo).
function grupo(catSheet: string, cat: AppCat, nome: string): string {
  const n = norm(nome);
  if (catSheet === "Carnes e aves" || catSheet === "Peixes e frutos do mar") return "carne";
  if (catSheet === "Ovos" || catSheet === "Leites e derivados") return "prot_leve";
  if (catSheet === "Leguminosas" || catSheet === "Tubérculos e raízes") return "carbo_prato";
  if (catSheet === "Cereais e pães") {
    if (/(pão|pao|tapioca|beiju|aveia|granola|biscoito|cuscuz)/.test(n)) return "carbo_pao";
    return "carbo_prato";
  }
  if (catSheet === "Frutas") return cat === "gordura" ? "gordura_pura" : "fruta";
  if (catSheet === "Verduras e legumes") return "vegetal";
  if (catSheet === "Oleaginosas e sementes" || catSheet === "Gorduras") return "gordura_pura";
  if (catSheet === "Pratos regionais") return "prato_regional";
  if (catSheet === "Doces e extras") return "doce";
  if (catSheet === "Bebidas") return "bebida";
  return cat;
}

const seen = new Set<string>();
const linhas: string[] = [];
const grupos: string[] = [];
for (const r of rows) {
  const catSheet = String(r["Categoria"]).trim();
  let nome = String(r["Alimento"]).trim();
  if (!nome || seen.has(nome)) continue;
  seen.add(nome);
  const kcal = num(r["Kcal/100g"]), p = num(r["Proteína g/100g"]), c = num(r["Carboidrato g/100g"]), fat = num(r["Gordura g/100g"]);
  const cat = CATMAP[catSheet] ?? dominante(p, c, fat);
  const [med, g] = medida(catSheet, cat, nome);
  const fl = flags(catSheet, nome);
  const gr = grupo(catSheet, cat, nome);
  const flagStr = `{ vegetariano: ${fl.vegetariano}, vegano: ${fl.vegano}, lactose: ${fl.lactose}, gluten: ${fl.gluten} }`;
  linhas.push(`  A(${JSON.stringify(nome)}, ${JSON.stringify(cat)}, ${kcal}, ${p}, ${c}, ${fat}, ${JSON.stringify(med)}, ${g}, ${flagStr}),`);
  grupos.push(`  ${JSON.stringify(nome)}: ${JSON.stringify(gr)},`);
}

const out = `// GERADO por scripts/gen-foods.ts a partir de "NUTRIX - BASE - REV 1.xlsx".
// Macros por 100 g = exatos da planilha da nutricionista. Medida caseira, porção,
// flags e grupo de substituição são inferidos por categoria + nome. NÃO editar à
// mão: rode "pnpm exec tsx scripts/gen-foods.ts" para regenerar.
import type { Alimento, Categoria } from "./foods";

const A = (
  nome: string, cat: Categoria, kcal: number, p: number, c: number, f: number,
  medida: string, gPorMedida: number,
  flags: { vegetariano: boolean; vegano: boolean; lactose: boolean; gluten: boolean },
): Alimento => ({ nome, cat, kcal, p, c, f, medida, gPorMedida, ...flags });

export const ALIMENTOS_BASE: Alimento[] = [
${linhas.join("\n")}
];

// Grupo de substituição de cada alimento da base (troca só dentro do grupo).
export const GRUPO_BASE: Record<string, string> = {
${grupos.join("\n")}
};
`;
writeFileSync("server/lib/diet/foodsBase.ts", out);
console.log(`Gerados ${linhas.length} alimentos -> server/lib/diet/foodsBase.ts`);
process.exit(0);
