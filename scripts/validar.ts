import { gerarPlano, validarPlano } from "../server/lib/diet/generatePlan";
const casos = [
  { nome: "Homem 87kg (com escolhas)", sel: { cafe_manha:["cm_pao_ovo","cm_banana"], lanche_manha:["lm_whey","lm_banana"], almoco:["al_arroz","al_frango_grelhado","al_salada_alface_tomate"], lanche_tarde:["lt_pao_ovo","lt_banana"], janta:["jt_arroz","jt_carne_grelhada"] } },
  { nome: "Mulher 62kg (sem escolhas)", perfil:{ sexo:"female" as const, peso:62, altura:165, idade:28, objetivo:"weight_loss" as const, atividade:"leve" as const }, sel: {} },
];
for (const c of casos) {
  const perfil = (c as any).perfil ?? { sexo:"male" as const, peso:87, altura:177, idade:33, objetivo:"weight_loss" as const, atividade:"moderado" as const };
  const p = gerarPlano(perfil, null, c.sel);
  const v = validarPlano(p);
  console.log(`\n=== ${c.nome} — meta ${p.totalCalories}kcal/${p.proteinTarget}g ===`);
  for (const x of v) console.log(`  ${x.ok?"✅":"❌"} ${x.regra} — ${x.detalhe}`);
}
process.exit(0);
