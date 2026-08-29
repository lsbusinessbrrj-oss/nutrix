// PDF da dieta personalizada — marca NutriX, mascote no topo, cabeçalho com os
// dados do cliente, verde + amarelo forte (no lugar do vermelho) e desenhos de
// fundo com opacidade. Renderiza sem JSX (React.createElement) p/ dev e esbuild.
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Svg, Circle, Ellipse, Path, G, renderToBuffer } from "@react-pdf/renderer";
import type { PlanData } from "../diet/generatePlan";

const h = React.createElement;

// Cores: verde da marca + amarelo forte (pedido da nutri) no lugar do vermelho.
const C = {
  verde: "#166534", verde2: "#16a34a", verdeClaro: "#dcfce7",
  amarelo: "#CA8A04", amareloBg: "#FEF3C7",
  cinza: "#475569", cinzaClaro: "#f1f5f9", borda: "#e2e8f0", texto: "#0f172a", agua: "#0284c7",
};

let LOGO: string | null | undefined;
function logo(): string | null {
  if (LOGO !== undefined) return LOGO;
  try {
    const p = path.join(process.cwd(), "client", "public", "nutrix-logo.jpeg");
    LOGO = "data:image/jpeg;base64," + readFileSync(p).toString("base64");
  } catch { LOGO = null; }
  return LOGO;
}

const s = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 30, paddingHorizontal: 32, fontSize: 9.5, color: C.texto, fontFamily: "Helvetica" },
  mascote: { width: 64, height: 64, borderRadius: 32, alignSelf: "center", marginBottom: 6 },
  titulo: { fontSize: 15, color: C.verde, fontFamily: "Helvetica-Bold", textAlign: "center" },
  subtitulo: { fontSize: 8, color: C.cinza, textAlign: "center", marginTop: 1, marginBottom: 7 },
  header: { backgroundColor: C.cinzaClaro, borderRadius: 6, padding: 8, marginBottom: 5, border: `1 solid ${C.borda}` },
  headerTit: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.verde, marginBottom: 3 },
  dadoRow: { flexDirection: "row", flexWrap: "wrap" },
  dado: { width: "50%", flexDirection: "row", paddingVertical: 1.4 },
  dadoLbl: { color: C.cinza, width: 72 },
  dadoVal: { fontFamily: "Helvetica-Bold", color: C.texto },
  metasCard: { backgroundColor: C.verdeClaro, borderRadius: 6, padding: 7, marginBottom: 2 },
  metaRow: { flexDirection: "row", flexWrap: "wrap" },
  metaBox: { width: "20%", paddingVertical: 2 },
  metaVal: { fontSize: 12, color: C.verde, fontFamily: "Helvetica-Bold" },
  metaLbl: { fontSize: 6.5, color: C.cinza, textTransform: "uppercase" },
  mealTitle: { fontSize: 12, color: C.verde, fontFamily: "Helvetica-Bold", marginTop: 13, marginBottom: 3, borderBottom: `1 solid ${C.verde2}`, paddingBottom: 3 },
  optTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.amarelo, marginTop: 8, marginBottom: 3, backgroundColor: C.amareloBg, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, alignSelf: "flex-start" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottom: `0.5 solid ${C.borda}` },
  itemName: { width: "62%" },
  itemQtd: { width: "38%", textAlign: "right", color: C.cinza },
  subLine: { fontSize: 7.5, color: C.cinza, marginLeft: 6, marginBottom: 1.5 },
  obs: { fontSize: 8.5, color: C.cinza, marginTop: 5, lineHeight: 1.35 },
  rodape: { position: "absolute", bottom: 14, left: 30, right: 30, fontSize: 7, color: C.cinza, textAlign: "center", borderTop: `0.5 solid ${C.borda}`, paddingTop: 5 },
});

// Ícones de alimentos (desenhados em ~26pt na origem) para o fundo do PDF.
const APPLE = "#E53935", BANANA = "#EAB308", BROC = "#22a35a", CARROT = "#F97316", FISH = "#64748B", WATER = "#38BDF8", LEAF = "#16a34a";
const ICONES: (() => any[])[] = [
  () => [ // maçã
    h(Circle, { key: 1, cx: 9, cy: 15, r: 7, fill: APPLE }),
    h(Circle, { key: 2, cx: 16, cy: 15, r: 7, fill: APPLE }),
    h(Path, { key: 3, d: "M12 6 C13 4 16 4 17 6 C15 8 13 8 12 6 Z", fill: LEAF }),
  ],
  () => [ // banana
    h(Path, { key: 1, d: "M5 9 C10 22 20 22 25 12 C22 20 12 20 8 9 Z", fill: BANANA }),
  ],
  () => [ // brócolis
    h(Circle, { key: 1, cx: 9, cy: 9, r: 5, fill: BROC }),
    h(Circle, { key: 2, cx: 16, cy: 9, r: 5, fill: BROC }),
    h(Circle, { key: 3, cx: 12, cy: 5, r: 5, fill: BROC }),
    h(Path, { key: 4, d: "M10 12 L15 12 L14 22 L11 22 Z", fill: "#4d7c0f" }),
  ],
  () => [ // peixe
    h(Ellipse, { key: 1, cx: 12, cy: 14, rx: 10, ry: 6, fill: FISH }),
    h(Path, { key: 2, d: "M22 14 L28 9 L28 19 Z", fill: FISH }),
    h(Circle, { key: 3, cx: 8, cy: 12, r: 1.2, fill: "#ffffff" }),
  ],
  () => [ // gota d'água
    h(Path, { key: 1, d: "M13 4 C7 13 7 20 13 22 C19 20 19 13 13 4 Z", fill: WATER }),
  ],
  () => [ // cenoura
    h(Path, { key: 1, d: "M7 9 L17 9 L12 26 Z", fill: CARROT }),
    h(Path, { key: 2, d: "M9 9 L7 3 M12 9 L12 2 M15 9 L17 3", stroke: LEAF, strokeWidth: 1.6, fill: "none" }),
  ],
];

// Fundo: grade organizada de alimentos, suave (opacidade 0,10), em toda página.
function fundo() {
  const cells: any[] = [];
  let idx = 0;
  for (let row = 0; row < 8; row++) {
    const yy = 60 + row * 100;
    const offset = row % 2 ? 60 : 0;
    for (let col = 0; col < 5; col++) {
      const xx = 30 + offset + col * 120;
      if (xx > 560) continue;
      cells.push(h(G, { key: `${row}-${col}`, transform: `translate(${xx} ${yy})`, opacity: 0.1 }, ICONES[idx % ICONES.length]()));
      idx++;
    }
  }
  return h(Svg, { fixed: true, style: { position: "absolute", top: 0, left: 0, width: 595, height: 842 }, viewBox: "0 0 595 842" }, cells);
}

// Banner do topo (estilo faixa com onda), nas cores NutriX + logo à direita.
function bannerTopo() {
  const src = logo();
  return h(View, { style: { position: "absolute", top: 0, left: 0, width: 595, height: 132 } },
    h(Svg, { style: { position: "absolute", top: 0, left: 0, width: 595, height: 132 }, viewBox: "0 0 595 132" },
      // Onda verde principal
      h(Path, { d: "M0 0 H595 V92 C 470 128 360 74 235 100 C 150 118 70 112 0 98 Z", fill: C.verde }),
      // Onda de destaque (verde mais claro), à direita
      h(Path, { d: "M300 100 C 410 78 520 110 595 90 L595 128 C 500 142 400 128 340 112 C 322 106 308 104 300 100 Z", fill: "#2E9E5B" }),
    ),
    // NutriX com o X em amarelo
    h(Text, { style: { position: "absolute", top: 26, left: 34, fontSize: 34, fontFamily: "Helvetica-Bold", color: "#ffffff" } },
      "Nutri", h(Text, { style: { color: "#FCD34D" } }, "X")),
    h(Text, { style: { position: "absolute", top: 72, left: 36, color: C.verdeClaro, fontSize: 12, fontFamily: "Helvetica-Bold" } }, "Saúde que Alimenta."),
    h(Text, { style: { position: "absolute", top: 87, left: 36, color: C.verdeClaro, fontSize: 12, fontFamily: "Helvetica-Bold" } }, "Treino que Transforma."),
    src ? h(Image, { src, style: { position: "absolute", top: 16, left: 470, width: 96, height: 96, borderRadius: 48 } }) : null,
  );
}

function rodape() {
  return h(Text, { style: s.rodape, fixed: true }, "NutriX · Saúde que Alimenta. Treino que Transforma. · Material educativo, não substitui acompanhamento profissional.");
}

function meta(v: string, l: string) {
  return h(View, { style: s.metaBox }, h(Text, { style: s.metaVal }, v), h(Text, { style: s.metaLbl }, l));
}
function dado(lbl: string, val: string) {
  return h(View, { style: s.dado }, h(Text, { style: s.dadoLbl }, lbl), h(Text, { style: s.dadoVal }, val));
}
function itemRow(name: string, qtd: string, subs: { name: string; quantity?: string }[]) {
  const els: any[] = [h(View, { style: s.itemRow, key: "r" }, h(Text, { style: s.itemName }, name), h(Text, { style: s.itemQtd }, qtd))];
  if (subs.length) {
    const txt = subs.slice(0, 5).map((x) => (x.quantity ? `${x.name} ${x.quantity}` : x.name)).join("; ");
    els.push(h(Text, { style: s.subLine, key: "s" }, "Troca por: " + txt));
  }
  return h(View, { key: name + qtd, wrap: false }, els);
}

export interface ClientePdf {
  nome: string; whatsapp?: string | null; sexo?: string | null;
  idade?: number | null; peso?: number | null; altura?: number | null; // altura em cm
}

export function DietDocument(props: { cliente: ClientePdf; plano: PlanData }) {
  const { cliente, plano } = props;
  const m = plano.summary;
  const alturaM = cliente.altura ? (cliente.altura > 3 ? cliente.altura / 100 : cliente.altura) : null;
  const imc = cliente.peso && alturaM ? cliente.peso / (alturaM * alturaM) : null;
  const dataAval = new Date().toLocaleDateString("pt-BR");
  const sexoTxt = cliente.sexo === "male" ? "Masculino" : cliente.sexo === "female" ? "Feminino" : (cliente.sexo ?? "—");

  const capa = h(Page, { size: "A4", style: s.page, key: "capa" },
    fundo(),
    bannerTopo(),
    h(View, { style: { height: 104 } }), // espaço do banner do topo (132 − paddingTop 28)
    h(Text, { style: s.titulo }, "Plano Alimentar Personalizado"),
    h(Text, { style: s.subtitulo }, "NutriX · Saúde que Alimenta. Treino que Transforma."),

    h(View, { style: s.header },
      h(Text, { style: s.headerTit }, "Dados do cliente"),
      h(View, { style: s.dadoRow },
        dado("Nome:", cliente.nome),
        dado("WhatsApp:", cliente.whatsapp ?? "—"),
        dado("Sexo:", sexoTxt),
        dado("Idade:", cliente.idade != null ? `${cliente.idade} anos` : "—"),
        dado("Peso:", cliente.peso != null ? `${cliente.peso} kg` : "—"),
        dado("Altura:", alturaM != null ? `${alturaM.toFixed(2).replace(".", ",")} m` : "—"),
        dado("IMC:", imc != null ? imc.toFixed(1).replace(".", ",") : "—"),
        dado("Avaliação:", dataAval),
      ),
    ),

    h(View, { style: s.metasCard },
      h(Text, { style: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.verde, marginBottom: 4 } }, "Objetivo diário"),
      h(View, { style: s.metaRow },
        meta(`${plano.totalCalories}`, "kcal/dia"),
        meta(`${plano.proteinTarget} g`, "proteína"),
        meta(`${m.carbs} g`, "carboidrato"),
        meta(`${m.fat} g`, "gordura"),
        meta(`${(plano.waterMl / 1000).toFixed(1).replace(".", ",")} L`, "água"),
      ),
    ),

    // Organização fixa em 4 páginas:
    //  P1 = Café da manhã · P2 = Lanche da manhã + Almoço
    //  P3 = Café da tarde + Jantar · P4 = Orientações (abaixo)
    // Quebra de página antes do Lanche da manhã (idx 1) e do Café da tarde (idx 3).
    ...plano.meals.map((meal, mi) =>
      h(View, { key: mi, break: mi === 1 || mi === 3, minPresenceAhead: 46 },
        h(Text, { style: s.mealTitle, minPresenceAhead: 40 }, `${meal.time} · ${meal.name}`),
        ...meal.options.map((opt, oi) =>
          h(View, { key: oi, minPresenceAhead: 30 },
            h(Text, { style: s.optTitle }, `Opção ${oi + 1} — ${opt.kcal} kcal`),
            ...opt.foods.map((f) => itemRow(f.name, f.quantity, f.substituicoes)),
          ),
        ),
      ),
    ),

    // Orientações sozinhas na página 4.
    h(View, { break: true },
      h(Text, { style: s.mealTitle }, "Orientação nutricional"),
      h(View, { style: { ...s.header, marginTop: 4 } },
        ...plano.orientacao.map((o, i) => h(Text, { key: i, style: s.obs }, "• " + o)),
      ),
    ),
    rodape(),
  );

  return h(Document, { title: `Dieta de ${cliente.nome}`, author: "NutriX" }, capa);
}

export async function gerarPdfDieta(cliente: ClientePdf, plano: PlanData): Promise<Buffer> {
  return renderToBuffer(h(DietDocument, { cliente, plano }) as any);
}
