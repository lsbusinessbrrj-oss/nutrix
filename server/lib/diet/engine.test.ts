import { describe, it, expect } from "vitest";
import { calcularTMB, calcularMetas, type PerfilNutri } from "./engine";
import { gerarPlano } from "./generatePlan";
import { alimento } from "./foods";

const cats = (foods: { name: string }[]) =>
  foods.map((f) => alimento(f.name)?.cat).filter(Boolean);

describe("engine — cálculo de calorias e macros", () => {
  it("TMB Mifflin-St Jeor (masculino)", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(Math.round(calcularTMB("male", 80, 180, 30))).toBe(1780);
  });

  it("TMB Mifflin-St Jeor (feminino)", () => {
    // 10*70 + 6.25*165 - 5*30 - 161 = 1420.25
    expect(Math.round(calcularTMB("female", 70, 165, 30))).toBe(1420);
  });

  it("emagrecer aplica déficit de 20% e proteína 2 g/kg", () => {
    const p: PerfilNutri = {
      sexo: "male", peso: 80, altura: 180, idade: 30,
      objetivo: "weight_loss", atividade: "moderado",
    };
    const m = calcularMetas(p);
    expect(m.tdee).toBe(2759); // 1780 * 1.55
    expect(m.calorias).toBe(2207); // 2759 * 0.8
    expect(m.proteinaG).toBe(160); // 2.0 * 80
  });

  it("nunca prescreve abaixo do mínimo de segurança", () => {
    const m = calcularMetas({
      sexo: "female", peso: 48, altura: 158, idade: 60,
      objetivo: "weight_loss", atividade: "sedentario",
    });
    expect(m.calorias).toBeGreaterThanOrEqual(1200);
  });
});

describe("generatePlan — formato e metas", () => {
  const p: PerfilNutri = {
    sexo: "female", peso: 70, altura: 165, idade: 30,
    objetivo: "weight_loss", atividade: "moderado",
  };

  it("retorna 5 refeições com 3 opções cada", () => {
    const plano = gerarPlano(p);
    expect(plano.meals).toHaveLength(5);
    for (const meal of plano.meals) {
      expect(meal.options).toHaveLength(3);
      for (const opt of meal.options) expect(opt.foods.length).toBeGreaterThan(0);
    }
  });

  it("TODA opção tem carboidrato E proteína", () => {
    const plano = gerarPlano(p);
    for (const meal of plano.meals)
      for (const opt of meal.options) {
        const c = cats(opt.foods);
        expect(c).toContain("carboidrato");
        expect(c).toContain("proteina");
      }
  });

  it("respeita os alimentos escolhidos (Opção 1)", () => {
    const plano = gerarPlano(p, null, { almoco: ["al_arroz", "al_frango_grelhado"] });
    const almoco = plano.meals.find((m) => m.name === "Almoço")!;
    const nomes = almoco.options[0].foods.map((f) => f.name);
    expect(nomes).toContain("Arroz branco cozido");
    expect(nomes).toContain("Frango grelhado");
  });

  it("se a pessoa escolhe só fruta, ainda vem carbo + proteína", () => {
    const plano = gerarPlano(p, null, { cafe_manha: ["cm_maca"] });
    const cafe = plano.meals.find((m) => m.name === "Café da manhã")!;
    const c = cats(cafe.options[0].foods);
    expect(cafe.options[0].foods.map((f) => f.name)).toContain("Maçã");
    expect(c).toContain("carboidrato");
    expect(c).toContain("proteina");
  });

  it("água calculada pelo peso (mín. 2,5 L)", () => {
    expect(gerarPlano({ ...p, peso: 87 }).waterMl).toBeGreaterThanOrEqual(2500);
    expect(gerarPlano({ ...p, peso: 87 }).waterMl).toBe(3050); // 87*35=3045 -> 3050
  });

  it("respeita restrição vegana (sem carne/peixe/ovo/laticínio)", () => {
    const plano = gerarPlano(p, "vegano");
    const proibidos = ["Frango", "Patinho", "Peixe", "Carne", "Ovo", "Iogurte", "Queijo", "Presunto", "Whey", "Requeijão", "Leite"];
    for (const meal of plano.meals)
      for (const opt of meal.options)
        for (const f of opt.foods)
          expect(proibidos.some((x) => f.name.includes(x))).toBe(false);
  });
});
