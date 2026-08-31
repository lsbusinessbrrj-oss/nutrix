import { describe, it, expect } from "vitest";
import { calcularTMB, calcularMetas, type PerfilNutri } from "./engine";
import { gerarPlano } from "./generatePlan";

describe("engine — cálculo de calorias e macros", () => {
  it("TMB Mifflin-St Jeor (masculino)", () => {
    expect(Math.round(calcularTMB("male", 80, 180, 30))).toBe(1780);
  });
  it("TMB Mifflin-St Jeor (feminino)", () => {
    expect(Math.round(calcularTMB("female", 70, 165, 30))).toBe(1420);
  });
  it("emagrecer: déficit 20%, proteína 1,8 g/kg, gordura 30% kcal", () => {
    const m = calcularMetas({ sexo: "male", peso: 80, altura: 180, idade: 30, objetivo: "weight_loss", atividade: "moderado" });
    expect(m.tdee).toBe(2759);
    expect(m.calorias).toBe(2207);
    expect(m.proteinaG).toBe(144); // 1,8 × 80
  });

  it("bate EXATAMENTE com a planilha da nutri (Caio 88kg/1,71m/28a)", () => {
    const m = calcularMetas({ sexo: "male", peso: 88, altura: 171, idade: 28, objetivo: "weight_loss", atividade: "moderado" });
    expect(m.tmb).toBe(1814);
    expect(m.calorias).toBe(2249);
    expect(m.proteinaG).toBe(158);
    expect(m.gorduraG).toBe(75);
    expect(m.carboidratoG).toBe(235);
  });
  it("nunca prescreve abaixo do mínimo de segurança", () => {
    const m = calcularMetas({ sexo: "female", peso: 48, altura: 158, idade: 60, objetivo: "weight_loss", atividade: "sedentario" });
    expect(m.calorias).toBeGreaterThanOrEqual(1200);
  });
});

describe("generatePlan — templates da referência", () => {
  const homem87: PerfilNutri = { sexo: "male", peso: 87, altura: 177, idade: 30, objetivo: "weight_loss", atividade: "moderado" };

  it("tem as 5 refeições (com lanche da manhã)", () => {
    const plano = gerarPlano(homem87);
    expect(plano.meals.map((m) => m.name)).toEqual(["Café da manhã", "Lanche da manhã", "Almoço", "Café da Tarde", "Jantar"]);
    expect(plano.meals.find((m) => m.name === "Jantar")!.options).toHaveLength(3);
  });

  it("Café da manhã Op1 = ovo + pão + requeijão + banana + aveia + café", () => {
    const cafe = gerarPlano(homem87).meals[0].options[0].foods.map((f) => f.name);
    expect(cafe).toEqual(["Ovo de galinha cozido", "Pão francês", "Requeijão Cremoso Light", "Banana prata", "Aveia em flocos", "Café"]);
  });

  it("Almoço Op1 tem frango, arroz, feijão e brócolis", () => {
    const almoco = gerarPlano(homem87).meals.find((m) => m.name === "Almoço")!.options[0].foods.map((f) => f.name);
    expect(almoco).toContain("Filé de frango grelhado");
    expect(almoco).toContain("Arroz branco cozido");
    expect(almoco).toContain("Feijão preto cozido");
    expect(almoco).toContain("Brócolis");
  });

  it("substituições exatas por item (arroz → batata; ovo → queijo minas)", () => {
    const plano = gerarPlano(homem87);
    const arroz = plano.meals.find((m) => m.name === "Almoço")!.options[0].foods.find((f) => f.name === "Arroz branco cozido")!;
    expect(arroz.substituicoes.map((s) => s.name)).toContain("Batata inglesa cozida");
    const ovo = plano.meals[0].options[0].foods.find((f) => f.name === "Ovo de galinha cozido")!;
    expect(ovo.substituicoes.map((s) => s.name)).toContain("Queijo minas");
  });

  // Obs.: o motor agora usa 1,8 g/kg de proteína (planilha da nutri), não os
  // 2,05 g/kg do plano das fotos — então as quantidades no perfil de referência
  // ficam um pouco menores que as fotos. O que precisa valer é a "conta fechar":
  // cada opção soma o alvo diário de kcal e proteína.
  it("na escala de referência, cada opção fecha a conta diária (±6% kcal, ±10% prot)", () => {
    const plano = gerarPlano(homem87);
    const { linhas, metaKcal, metaProt } = (plano as any).resumo;
    expect(linhas).toHaveLength(3);
    for (const l of linhas) {
      expect(Math.abs(l.kcal - metaKcal) / metaKcal).toBeLessThanOrEqual(0.06);
      expect(Math.abs(l.protein - metaProt) / metaProt).toBeLessThanOrEqual(0.10);
    }
    // O primeiro item do café (ovo) sai numa quantidade sensata e positiva.
    const ovo = plano.meals[0].options[0].foods[0];
    expect(ovo.name).toBe("Ovo de galinha cozido");
    expect(ovo.quantity).toMatch(/\d/);
  });

  it("água calculada pelo peso (mín. 2,5 L)", () => {
    expect(gerarPlano(homem87).waterMl).toBeGreaterThanOrEqual(2500);
    expect(gerarPlano({ ...homem87, peso: 87 }).waterMl).toBe(3050);
  });

  it("Opção 1 = escolha do cliente no quiz (+ opções de referência)", () => {
    const plano = gerarPlano(homem87, null, { cafe_manha: ["cm_pao_ovo", "cm_banana"] });
    const cafe = plano.meals[0];
    expect(cafe.options).toHaveLength(3); // 1 do cliente + 2 de referência
    const nomes = cafe.options[0].foods.map((f) => f.name);
    expect(nomes).toContain("Ovo");
    expect(nomes).toContain("Banana prata");
    expect(nomes).toContain("Pão de forma");
    // substituições presentes em cada item escolhido
    expect(cafe.options[0].foods[0].substituicoes.length).toBeGreaterThan(0);
  });

  it("almoço só com fruta escolhida ainda traz proteína + carbo", () => {
    const plano = gerarPlano(homem87, null, { almoco: ["al_salada_alface"] });
    const cats = plano.meals.find((m) => m.name === "Almoço")!.options[0].foods
      .map((f) => alimentoCat(f.name))
      .filter(Boolean);
    expect(cats).toContain("proteina");
    expect(cats).toContain("carboidrato");
  });
});

import { alimento } from "./foods";
const alimentoCat = (n: string) => alimento(n)?.cat;
