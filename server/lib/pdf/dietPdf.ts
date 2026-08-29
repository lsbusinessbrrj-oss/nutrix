// Gera o PDF da dieta personalizada (o que o cliente recebe).
// Usa @react-pdf/renderer via React.createElement (sem JSX, para compilar
// tanto no dev/tsx quanto no bundle esbuild do servidor).
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { PlanData } from "../diet/generatePlan";

const h = React.createElement;

const C = { verde: "#166534", verdeClaro: "#dcfce7", vermelho: "#E53935", cinza: "#475569", cinzaClaro: "#f1f5f9", borda: "#e2e8f0", texto: "#0f172a", agua: "#0284c7" };

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: C.texto, fontFamily: "Helvetica" },
  h1: { fontSize: 22, color: C.verde, fontFamily: "Helvetica-Bold" },
  sub: { fontSize: 11, color: C.cinza, marginTop: 4 },
  card: { backgroundColor: C.cinzaClaro, borderRadius: 6, padding: 12, marginTop: 14 },
  metaRow: { flexDirection: "row", flexWrap: "wrap" },
  metaBox: { width: "20%", paddingVertical: 4 },
  metaVal: { fontSize: 15, color: C.verde, fontFamily: "Helvetica-Bold" },
  metaLbl: { fontSize: 8, color: C.cinza, textTransform: "uppercase" },
  mealTitle: { fontSize: 14, color: C.verde, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 2, borderBottom: `1 solid ${C.verde}`, paddingBottom: 3 },
  optTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.vermelho, marginTop: 8, marginBottom: 3 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5, borderBottom: `0.5 solid ${C.borda}` },
  itemName: { width: "62%" },
  itemQtd: { width: "38%", textAlign: "right", color: C.cinza },
  subLine: { fontSize: 7.5, color: C.cinza, marginLeft: 8, marginBottom: 2 },
  obs: { fontSize: 8.5, color: C.cinza, marginTop: 8, lineHeight: 1.4 },
  rodape: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 7.5, color: C.cinza, textAlign: "center", borderTop: `0.5 solid ${C.borda}`, paddingTop: 6 },
});

function meta(v: string, l: string) {
  return h(View, { style: s.metaBox }, h(Text, { style: s.metaVal }, v), h(Text, { style: s.metaLbl }, l));
}

function itemRow(name: string, qtd: string, subs: { name: string }[]) {
  const els: any[] = [
    h(View, { style: s.itemRow, key: "r" },
      h(Text, { style: s.itemName }, name),
      h(Text, { style: s.itemQtd }, qtd),
    ),
  ];
  if (subs.length) {
    els.push(h(Text, { style: s.subLine, key: "s" }, "Troca por: " + subs.map((x) => x.name).slice(0, 5).join(", ")));
  }
  return h(View, { key: name + qtd, wrap: false }, els);
}

export function DietDocument(props: { nome: string; plano: PlanData }) {
  const { nome, plano } = props;
  const m = plano.summary;
  const rodape = h(Text, { style: s.rodape, fixed: true }, "NutriX · Plano gerado conforme seus dados · Material educativo, não substitui acompanhamento profissional.");

  const capa = h(Page, { size: "A4", style: s.page, key: "capa" },
    h(Text, { style: s.h1 }, "NutriX — Plano Alimentar"),
    h(Text, { style: s.sub }, `${nome} · Meta: ${plano.totalCalories} kcal/dia`),
    h(View, { style: s.card },
      h(Text, { style: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.verde, marginBottom: 6 } }, "Suas metas diárias"),
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
    rodape,
  );

  const orient = h(Page, { size: "A4", style: s.page, key: "orient" },
    h(Text, { style: s.h1 }, "Orientação nutricional"),
    h(View, { style: s.card },
      ...plano.orientacao.map((o, i) => h(Text, { key: i, style: s.obs }, "• " + o)),
    ),
    rodape,
  );

  return h(Document, { title: `Dieta de ${nome}`, author: "NutriX" }, capa, orient);
}

export async function gerarPdfDieta(nome: string, plano: PlanData): Promise<Buffer> {
  return renderToBuffer(h(DietDocument, { nome, plano }) as any);
}
