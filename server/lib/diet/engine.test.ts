import { describe, it, expect } from "vitest";
import { calcularTMB, calcularMetas, type PerfilNutri } from "./engine";
import { gerarPlano } from "./generatePlan";

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

  it("retorna 5 refeições com 5 opções cada", () => {
    const plano = gerarPlano(p);
    expect(plano.meals).toHaveLength(5);
    for (const meal of plano.meals) {
      expect(meal.options).toHaveLength(5);
      expect(meal.calories).toBeGreaterThan(0);
      for (const opt of meal.options) expect(opt.foods.length).toBeGreaterThan(0);
    }
  });

  it("soma das calorias das refeições bate com o total (±5%)", () => {
    const plano = gerarPlano(p);
    const soma = plano.meals.reduce((s, m) => s + m.calories, 0);
    const desvio = Math.abs(soma - plano.totalCalories) / plano.totalCalories;
    expect(desvio).toBeLessThan(0.05);
  });

  it("respeita restrição vegana (sem carne/peixe/ovo/laticínio)", () => {
    const plano = gerarPlano(p, "vegan");
    const proibidos = ["frango", "Patinho", "Tilápia", "Carne", "Atum", "Ovo", "Iogurte", "cottage", "Whey"];
    for (const meal of plano.meals)
      for (const opt of meal.options)
        for (const f of opt.foods)
          expect(proibidos.some((x) => f.name.includes(x))).toBe(false);
  });
});
