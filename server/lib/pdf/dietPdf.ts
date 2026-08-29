// PDF da dieta personalizada — marca NutriX, mascote no topo, cabeçalho com os
// dados do cliente, verde + amarelo forte (no lugar do vermelho) e desenhos de
// fundo com opacidade. Renderiza sem JSX (React.createElement) p/ dev e esbuild.
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Svg, Circle, Ellipse, Path, G, renderToBuffer } from "@react-pdf/renderer";
import type { PlanData } from "../diet/generatePlan";

const h = React.createElement;

// Paleta NutriX (mockup): verdes suaves + dourado, cabeçalho claro com folhagem.
const C = {
  verde: "#1f5a34", verde2: "#7bbf8c", verdeClaro: "#eef6f0",
  amarelo: "#9C6A15", amareloBg: "#FBF0CF",
  cinza: "#5b6b62", cinzaClaro: "#f5f9f6", borda: "#dce8e0", texto: "#233029", agua: "#0284c7",
  // Cabeçalho / marca
  wordNutri: "#2f6b3f", wordX: "#E1962F", slogan1: "#3f8f57", slogan2: "#256b38",
  sw1: "#dfeee2", sw2: "#c3dcc9", sw3: "#8fbf9a", folha: "#6fae7c", dots: "#c7c2b0",
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
  header: { backgroundColor: "#f7faf7", borderRadius: 8, padding: 9, marginBottom: 5, border: `1 solid ${C.borda}`, position: "relative", overflow: "hidden" },
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
  mealTitle: { flexDirection: "row", alignItems: "center", marginTop: 13, marginBottom: 3, borderBottom: `1.2 solid ${C.verde2}`, paddingBottom: 3 },
  optTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.amarelo, marginTop: 8, marginBottom: 3, backgroundColor: C.amareloBg, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, alignSelf: "flex-start" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottom: `0.5 solid ${C.borda}` },
  itemName: { width: "62%" },
  itemQtd: { width: "38%", textAlign: "right", color: C.cinza },
  subLine: { fontSize: 7.5, color: C.cinza, marginLeft: 6, marginBottom: 1.5 },
  obs: { fontSize: 8.5, color: C.cinza, marginTop: 5, lineHeight: 1.35 },
  rodape: { position: "absolute", bottom: 14, left: 30, right: 30, fontSize: 7, color: C.cinza, textAlign: "center", borderTop: `0.5 solid ${C.borda}`, paddingTop: 5 },
});

// Uma folha (desenhada na origem, ~24pt) — marca d'água do fundo.
function folhaEls(): any[] {
  return [
    h(Path, { key: 1, d: "M0 12 C 4 -2 20 -2 24 4 C 20 18 4 18 0 12 Z", fill: C.folha }),
    h(Path, { key: 2, d: "M2 11 C 8 6 16 4 22 5", stroke: "#4e8a5f", strokeWidth: 0.8, fill: "none" }),
  ];
}

// Fundo: folhas suaves espalhadas (opacidade baixa), em toda a página.
function fundo() {
  const cells: any[] = [];
  let i = 0;
  for (let row = 0; row < 9; row++) {
    const yy = 90 + row * 88;
    const offset = row % 2 ? 58 : 0;
    for (let col = 0; col < 5; col++) {
      const xx = 40 + offset + col * 115;
      if (xx > 560) continue;
      const rot = (i * 57) % 360;
      cells.push(h(G, { key: `${row}-${col}`, transform: `translate(${xx} ${yy}) rotate(${rot})`, opacity: 0.06 }, folhaEls()));
      i++;
    }
  }
  return h(Svg, { fixed: true, style: { position: "absolute", top: 0, left: 0, width: 595, height: 842 }, viewBox: "0 0 595 842" }, cells);
}

// Cabeçalho do topo (mockup): fundo claro com folhagem verde, marca "NutriX"
// grande (verde + dourado), slogan e o mascote à direita, + grade de pontos.
function bannerTopo() {
  const src = logo();
  const dots: any[] = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++)
    dots.push(h(Circle, { key: `d${r}${c}`, cx: 300 + c * 12, cy: 18 + r * 12, r: 1.5, fill: C.dots, opacity: 0.6 }));
  return h(View, { style: { position: "absolute", top: 0, left: 0, width: 595, height: 200, backgroundColor: "#fbfdf9" } },
    h(Svg, { style: { position: "absolute", top: 0, left: 0, width: 595, height: 200 }, viewBox: "0 0 595 200" },
      ...dots,
      // Folhagem fluida (clara → média) varrendo em direção ao mascote
      h(Path, { d: "M150 -30 C 320 30 300 150 520 120 C 600 108 650 150 700 90 L700 -40 L150 -40 Z", fill: C.sw1 }),
      h(Path, { d: "M210 -30 C 360 40 350 120 540 118 C 610 118 660 80 700 60 L700 -40 L210 -40 Z", fill: C.sw2 }),
      h(Path, { d: "M250 40 C 350 8 430 44 560 20 C 620 8 600 70 520 86 C 420 106 330 92 270 74 C 250 66 246 52 250 40 Z", fill: C.sw3 }),
      h(Path, { d: "M300 66 C 380 44 470 66 560 46 C 600 38 585 78 520 92 C 440 108 350 100 300 78 Z", fill: C.folha, opacity: 0.5 }),
      // Folhinhas soltas à esquerda
      h(Path, { d: "M96 44 C 106 34 126 34 136 44 C 126 54 106 54 96 44 Z", fill: C.folha }),
      h(Path, { d: "M150 70 C 158 62 174 62 182 70 C 174 78 158 78 150 70 Z", fill: C.folha }),
      h(Path, { d: "M108 32 C 118 48 118 62 112 80", stroke: C.folha, strokeWidth: 2, fill: "none" }),
    ),
    // Marca NutriX (Nutri verde + X dourado)
    h(Text, { style: { position: "absolute", top: 44, left: 38, fontSize: 44, fontFamily: "Helvetica-Bold" } },
      h(Text, { style: { color: C.wordNutri } }, "Nutri"), h(Text, { style: { color: C.wordX } }, "X")),
    h(Text, { style: { position: "absolute", top: 100, left: 40, color: C.slogan1, fontSize: 15 } }, "Saúde que Alimenta."),
    h(Text, { style: { position: "absolute", top: 118, left: 40, color: C.slogan2, fontSize: 15, fontFamily: "Helvetica-Bold" } }, "Treino que Transforma."),
    src ? h(Image, { src, style: { position: "absolute", top: 46, left: 456, width: 110, height: 110, borderRadius: 55 } }) : null,
  );
}

// Ícone por refeição (SVG, pois o @react-pdf não renderiza emoji).
function iconeRefeicao(mi: number) {
  const raios = "M8 0.5 V2.6 M8 13.4 V15.5 M0.5 8 H2.6 M13.4 8 H15.5 M2.8 2.8 L4.3 4.3 M11.7 11.7 L13.2 13.2 M13.2 2.8 L11.7 4.3 M4.3 11.7 L2.8 13.2";
  const kids: any[] = mi === 0 || mi === 3 ? [ // sol
    h(Circle, { key: 1, cx: 8, cy: 8, r: 3.1, fill: "#E8A33D" }),
    h(Path, { key: 2, d: raios, stroke: "#E8A33D", strokeWidth: 1.2, fill: "none" }),
  ] : mi === 1 ? [ // maçã
    h(Circle, { key: 1, cx: 6.6, cy: 9, r: 4, fill: "#E0533B" }),
    h(Circle, { key: 2, cx: 9.6, cy: 9, r: 4, fill: "#E0533B" }),
    h(Path, { key: 3, d: "M8 2 C 9 0.6 11 0.6 12 2 C 10.8 3.4 9 3.4 8 2 Z", fill: C.slogan1 }),
  ] : mi === 2 ? [ // garfo + faca
    h(Path, { key: 1, d: "M4 1 V15 M2.4 1 V5 M5.6 1 V5 M4 5 V6", stroke: "#6b8f76", strokeWidth: 1.1, fill: "none" }),
    h(Path, { key: 2, d: "M11 1 C 13 1 13 7 11 7 V15", stroke: "#6b8f76", strokeWidth: 1.1, fill: "none" }),
  ] : [ // lua (janta)
    h(Path, { key: 1, d: "M11 2 A 6 6 0 1 0 11 14 A 4.6 4.6 0 1 1 11 2 Z", fill: "#6b8f76" }),
  ];
  return h(Svg, { width: 15, height: 15, viewBox: "0 0 16 16", style: { marginRight: 6 } }, kids);
}

// Folha grande (marca d'água) para o canto direito do card de dados.
function folhaGrande() {
  return h(Svg, { width: 90, height: 90, viewBox: "0 0 120 120", style: { position: "absolute", right: 4, top: 2, opacity: 0.1 } },
    h(Path, { d: "M100 15 C 40 20 15 60 20 100 C 80 96 108 60 100 15 Z", fill: C.slogan1 }),
    h(Path, { d: "M28 92 C 55 60 80 40 96 24", stroke: C.slogan2, strokeWidth: 2, fill: "none" }),
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
    h(View, { style: { height: 172 } }), // espaço do cabeçalho do topo (200 − paddingTop 28)
    h(Text, { style: s.titulo }, "Plano Alimentar Personalizado"),
    h(Text, { style: s.subtitulo }, "NutriX · Saúde que Alimenta. Treino que Transforma."),

    h(View, { style: s.header },
      folhaGrande(),
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

    // Conteúdo completo fluindo continuamente (sem quebras fixas nem espaços
    // vazios); o título não fica órfão no fim da página.
    ...plano.meals.map((meal, mi) =>
      h(View, { key: mi, minPresenceAhead: 46 },
        h(View, { style: s.mealTitle, minPresenceAhead: 40 },
          iconeRefeicao(mi),
          h(Text, { style: { fontSize: 12, color: C.verde, fontFamily: "Helvetica-Bold" } }, `${meal.time} · ${meal.name}`),
        ),
        ...meal.options.map((opt, oi) =>
          h(View, { key: oi, minPresenceAhead: 30 },
            h(Text, { style: s.optTitle }, `Opção ${oi + 1} — ${opt.kcal} kcal`),
            ...opt.foods.map((f) => itemRow(f.name, f.quantity, f.substituicoes)),
          ),
        ),
      ),
    ),

    // Orientações fluem logo após as refeições (sem página vazia).
    h(View, { minPresenceAhead: 80 },
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
