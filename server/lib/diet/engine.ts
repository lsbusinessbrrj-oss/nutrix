// Motor de cálculo nutricional — calorias e macros corretos.
//
// Substitui o "chute" da IA por cálculo determinístico:
// TMB (Mifflin-St Jeor) × fator de atividade → ajuste pelo objetivo,
// com proteína fixada por kg de peso (o parâmetro que faltava).
//
// Usa exatamente os valores do quiz do NutriX (Home.tsx / saveFormData).

export type Sexo = "male" | "female";
export type Objetivo =
  | "weight_loss"
  | "definition"
  | "muscle_gain"
  | "health"
  | "maintenance";
export type Atividade =
  | "sedentario"
  | "leve"
  | "moderado"
  | "muito_ativo"
  | "extremamente_ativo";

export interface PerfilNutri {
  sexo: Sexo;
  peso: number; // kg
  altura: number; // cm
  idade: number; // anos
  objetivo: Objetivo;
  atividade: Atividade;
}

export interface Metas {
  tmb: number;
  tdee: number;
  calorias: number;
  proteinaG: number;
  carboidratoG: number;
  gorduraG: number;
  aguaMl: number;
  proteinaPorKg: number;
}

const FATOR_ATIVIDADE: Record<Atividade, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  muito_ativo: 1.725,
  extremamente_ativo: 1.9,
};

// Ajuste calórico sobre o TDEE, por objetivo.
const AJUSTE: Record<Objetivo, number> = {
  weight_loss: -0.2,
  definition: -0.15,
  muscle_gain: 0.12,
  health: 0,
  maintenance: 0,
};

// Proteína (g/kg de peso) por objetivo — o que garante a "proteína exata".
const PROTEINA_KG: Record<Objetivo, number> = {
  weight_loss: 2.0,
  definition: 2.2,
  muscle_gain: 2.0,
  health: 1.6,
  maintenance: 1.8,
};

const GORDURA_KG = 0.9;

export function calcularTMB(sexo: Sexo, peso: number, altura: number, idade: number): number {
  const base = 10 * peso + 6.25 * altura - 5 * idade;
  return sexo === "male" ? base + 5 : base - 161;
}

export function calcularMetas(p: PerfilNutri): Metas {
  const tmb = calcularTMB(p.sexo, p.peso, p.altura, p.idade);
  const tdee = tmb * (FATOR_ATIVIDADE[p.atividade] ?? 1.55);
  let calorias = tdee * (1 + (AJUSTE[p.objetivo] ?? 0));

  // Piso de segurança: nunca abaixo da TMB nem de um mínimo por sexo.
  const minimo = p.sexo === "male" ? 1500 : 1200;
  calorias = Math.max(calorias, tmb, minimo);

  const proteinaPorKg = PROTEINA_KG[p.objetivo] ?? 1.8;
  const proteinaG = proteinaPorKg * p.peso;
  const gorduraG = GORDURA_KG * p.peso;
  const kcalRestante = Math.max(calorias - proteinaG * 4 - gorduraG * 9, 0);
  const carboidratoG = kcalRestante / 4;

  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    calorias: Math.round(calorias),
    proteinaG: Math.round(proteinaG),
    carboidratoG: Math.round(carboidratoG),
    gorduraG: Math.round(gorduraG),
    // Água: ~35 ml por kg de peso, com piso de 2,5 L (como na orientação).
    aguaMl: Math.max(2500, Math.round((p.peso * 35) / 50) * 50),
    proteinaPorKg,
  };
}
