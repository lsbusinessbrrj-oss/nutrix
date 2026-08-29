// PDF da dieta personalizada — marca NutriX, mascote no topo, cabeçalho com os
// dados do cliente, verde + amarelo forte (no lugar do vermelho) e desenhos de
// fundo com opacidade. Renderiza sem JSX (React.createElement) p/ dev e esbuild.
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Svg, Circle, Path, renderToBuffer } from "@react-pdf/renderer";
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
  page: { paddingTop: 28, paddingBottom: 40, paddingHorizontal: 32, fontSize: 10, color: C.texto, fontFamily: "Helvetica" },
  mascote: { width: 64, height: 64, borderRadius: 32, alignSelf: "center", marginBottom: 6 },
  titulo: { fontSize: 18, color: C.verde, fontFamily: "Helvetica-Bold", textAlign: "center" },
  subtitulo: { fontSize: 9, color: C.cinza, textAlign: "center", marginTop: 2, marginBottom: 12 },
  header: { backgroundColor: C.cinzaClaro, borderRadius: 8, padding: 12, marginBottom: 8, border: `1 solid ${C.borda}` },
  headerTit: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.verde, marginBottom: 6 },
  dadoRow: { flexDirection: "row", flexWrap: "wrap" },
  dado: { width: "50%", flexDirection: "row", paddingVertical: 2.5 },
  dadoLbl: { color: C.cinza, width: 78 },
  dadoVal: { fontFamily: "Helvetica-Bold", color: C.texto },
  metasCard: { backgroundColor: C.verdeClaro, borderRadius: 8, padding: 10, marginBottom: 4 },
  metaRow: { flexDirection: "row", flexWrap: "wrap" },
  metaBox: { width: "20%", paddingVertical: 3 },
  metaVal: { fontSize: 13, color: C.verde, fontFamily: "Helvetica-Bold" },
  metaLbl: { fontSize: 7, color: C.cinza, textTransform: "uppercase" },
  mealTitle: { fontSize: 13, color: C.verde, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 2, borderBottom: `1 solid ${C.verde2}`, paddingBottom: 3 },
  optTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.amarelo, marginTop: 8, marginBottom: 3, backgroundColor: C.amareloBg, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, alignSelf: "flex-start" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5, borderBottom: `0.5 solid ${C.borda}` },
  itemName: { width: "62%" },
  itemQtd: { width: "38%", textAlign: "right", color: C.cinza },
  subLine: { fontSize: 7.5, color: C.cinza, marginLeft: 8, marginBottom: 2 },
  obs: { fontSize: 8.5, color: C.cinza, marginTop: 8, lineHeight: 1.4 },
  rodape: { position: "absolute", bottom: 18, left: 32, right: 32, fontSize: 7.5, color: C.cinza, textAlign: "center", borderTop: `0.5 solid ${C.borda}`, paddingTop: 6 },
});

// Fundo com desenhos (frutas, folha, gota) em baixa opacidade.
function fundo() {
  return h(Svg, { fixed: true, style: { position: "absolute", top: 0, left: 0, width: 595, height: 842 }, viewBox: "0 0 595 842" },
    // maçãs / laranjas (círculos)
    h(Circle, { cx: 70, cy: 300, r: 34, fill: C.verde2, opacity: 0.05 }),
    h(Circle, { cx: 520, cy: 210, r: 40, fill: C.amarelo, opacity: 0.05 }),
    h(Circle, { cx: 500, cy: 620, r: 30, fill: C.verde2, opacity: 0.05 }),
    h(Circle, { cx: 90, cy: 720, r: 26, fill: C.amarelo, opacity: 0.05 }),
    // folhas (elipses via path) e gotas d'água
    h(Path, { d: "M300 120 q40 -30 80 0 q-40 30 -80 0 z", fill: C.verde2, opacity: 0.04 }),
    h(Path, { d: "M540 470 c-14 18 -14 32 0 40 c14 -8 14 -22 0 -40 z", fill: C.agua, opacity: 0.06 }),
    h(Path, { d: "M60 470 c-12 16 -12 28 0 36 c12 -8 12 -20 0 -36 z", fill: C.agua, opacity: 0.06 }),
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
function itemRow(name: string, qtd: string, subs: { name: string }[]) {
  const els: any[] = [h(View, { style: s.itemRow, key: "r" }, h(Text, { style: s.itemName }, name), h(Text, { style: s.itemQtd }, qtd))];
  if (subs.length) els.push(h(Text, { style: s.subLine, key: "s" }, "Troca por: " + subs.map((x) => x.name).slice(0, 5).join(", ")));
  return h(View, { key: name + qtd, wrap: false }, els);
}

export interface ClientePdf {
  nome: string; whatsapp?: string | null; sexo?: string | null;
  idade?: number | null; peso?: number | null; altura?: number | null; // altura em cm
}

export function DietDocument(props: { cliente: ClientePdf; plano: PlanData }) {
  const { cliente, plano } = props;
  const m = plano.summary;
  const src = logo();
  const alturaM = cliente.altura ? (cliente.altura > 3 ? cliente.altura / 100 : cliente.altura) : null;
  const imc = cliente.peso && alturaM ? cliente.peso / (alturaM * alturaM) : null;
  const dataAval = new Date().toLocaleDateString("pt-BR");
  const sexoTxt = cliente.sexo === "male" ? "Masculino" : cliente.sexo === "female" ? "Feminino" : (cliente.sexo ?? "—");

  const capa = h(Page, { size: "A4", style: s.page, key: "capa" },
    fundo(),
    src ? h(Image, { src, style: s.mascote }) : null,
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
      h(Text, { style: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.verde, marginBottom: 4 } }, "Metas diárias"),
      h(View, { style: s.metaRow },
        meta(`${plano.totalCalories}`, "kcal/dia"),
        meta(`${plano.proteinTarget} g`, "proteína"),
        meta(`${m.carbs} g`, "carboidrato"),
        meta(`${m.fat} g`, "gordura"),
        meta(`${(plano.waterMl / 1000).toFixed(1).replace(".", ",")} L`, "água"),
      ),
    ),

    ...plano.meals.map((meal, mi) =>
      h(View, { key: mi, wrap: false },
        h(Text, { style: s.mealTitle }, `${meal.time} · ${meal.name}`),
        ...meal.options.map((opt, oi) =>
          h(View, { key: oi },
            h(Text, { style: s.optTitle }, `Opção ${oi + 1} — ${opt.kcal} kcal`),
            ...opt.foods.map((f) => itemRow(f.name, f.quantity, f.substituicoes)),
          ),
        ),
      ),
    ),
    rodape(),
  );

  const orient = h(Page, { size: "A4", style: s.page, key: "orient" },
    fundo(),
    h(Text, { style: s.titulo }, "Orientação nutricional"),
    h(Text, { style: s.subtitulo }, `${cliente.nome} · ${dataAval}`),
    h(View, { style: s.header },
      ...plano.orientacao.map((o, i) => h(Text, { key: i, style: s.obs }, "• " + o)),
    ),
    rodape(),
  );

  return h(Document, { title: `Dieta de ${cliente.nome}`, author: "NutriX" }, capa, orient);
}

export async function gerarPdfDieta(cliente: ClientePdf, plano: PlanData): Promise<Buffer> {
  return renderToBuffer(h(DietDocument, { cliente, plano }) as any);
}
