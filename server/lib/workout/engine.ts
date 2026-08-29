// Gerador determinístico de treino (substitui a IA do Manus).
// A partir de local, nível, dias/semana, grupos musculares e objetivo,
// monta um split semanal com exercícios reais.

export type Local = "gym" | "home";
export type Nivel = "beginner" | "intermediate" | "advanced";

export interface EntradaTreino {
  location: Local;
  level: Nivel;
  daysPerWeek: number;
  muscleGroups: string[];
  workoutGoal: string;
}

export interface Exercicio { name: string; sets: number; reps: string; rest: string; notes?: string }
export interface DiaTreino { day: string; focus: string; exercises: Exercicio[]; durationMin: number }
export interface PlanoTreino { summary: string; days: DiaTreino[] }

// Exercícios por grupo muscular e local.
const EXERCICIOS: Record<string, { gym: string[]; home: string[] }> = {
  Peito: { gym: ["Supino reto", "Supino inclinado", "Crucifixo", "Crossover"], home: ["Flexão de braço", "Flexão inclinada", "Flexão diamante"] },
  Costas: { gym: ["Puxada frontal", "Remada curvada", "Remada baixa", "Pulldown"], home: ["Remada com toalha", "Superman", "Remada invertida na mesa"] },
  Ombros: { gym: ["Desenvolvimento militar", "Elevação lateral", "Elevação frontal", "Remada alta"], home: ["Elevação lateral com garrafa", "Pike push-up", "Elevação frontal com mochila"] },
  Bíceps: { gym: ["Rosca direta", "Rosca alternada", "Rosca scott"], home: ["Rosca com mochila", "Rosca isométrica"] },
  Tríceps: { gym: ["Tríceps na corda", "Tríceps testa", "Mergulho no banco"], home: ["Mergulho no banco", "Flexão fechada"] },
  Abdômen: { gym: ["Abdominal supra", "Prancha", "Elevação de pernas"], home: ["Abdominal supra", "Prancha", "Abdominal bicicleta"] },
  Glúteos: { gym: ["Elevação pélvica", "Cadeira abdutora", "Agachamento"], home: ["Ponte de glúteo", "Afundo", "Agachamento sumô"] },
  Quadríceps: { gym: ["Leg press", "Cadeira extensora", "Agachamento livre"], home: ["Agachamento livre", "Afundo", "Agachamento búlgaro"] },
  Posterior: { gym: ["Mesa flexora", "Stiff", "Cadeira flexora"], home: ["Stiff com mochila", "Ponte unilateral"] },
  Panturrilha: { gym: ["Panturrilha em pé", "Panturrilha sentado"], home: ["Panturrilha em pé", "Panturrilha unilateral"] },
};

const GOAL_CFG: Record<string, { sets: number; reps: string; rest: string }> = {
  "Hipertrofia (ganho de massa)": { sets: 4, reps: "8-12", rest: "60-90s" },
  "Emagrecimento": { sets: 3, reps: "15-20", rest: "30-45s" },
  "Condicionamento físico": { sets: 3, reps: "12-15", rest: "45s" },
  "Força e potência": { sets: 5, reps: "3-6", rest: "2-3min" },
  "Definição muscular": { sets: 3, reps: "12-15", rest: "45s" },
};

const PERNAS = new Set(["Quadríceps", "Posterior", "Glúteos", "Panturrilha"]);
const DIAS_SEMANA = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

function focoDoDia(muscles: string[]): string {
  if (muscles.length > 1 && muscles.every((m) => PERNAS.has(m))) return "Pernas";
  return muscles.join(" e ");
}

export function gerarTreino(input: EntradaTreino): PlanoTreino {
  const dias = Math.max(1, Math.min(7, input.daysPerWeek));
  const grupos = input.muscleGroups.length ? input.muscleGroups : ["Peito", "Costas", "Pernas"];
  const cfg = GOAL_CFG[input.workoutGoal] ?? GOAL_CFG["Hipertrofia (ganho de massa)"];
  const sets = input.level === "beginner" ? Math.max(2, cfg.sets - 1) : cfg.sets;
  const exPorGrupo = input.level === "advanced" ? 3 : 2;

  // Distribui os grupos musculares entre os dias (round-robin).
  const buckets: string[][] = Array.from({ length: dias }, () => []);
  grupos.forEach((g, i) => buckets[i % dias].push(g));
  // Dias vazios (menos grupos que dias) recebem um grupo por rotação.
  buckets.forEach((b, i) => { if (b.length === 0) b.push(grupos[i % grupos.length]); });

  const days: DiaTreino[] = buckets.map((muscles, i) => {
    const exercises: Exercicio[] = [];
    for (const m of muscles) {
      const fonte = EXERCICIOS[m];
      const nomes = (fonte ? fonte[input.location] : []) ?? [];
      nomes.slice(0, exPorGrupo).forEach((name) => {
        exercises.push({ name, sets, reps: cfg.reps, rest: cfg.rest });
      });
    }
    // Garante um mínimo de exercícios no dia.
    const durationMin = exercises.length * 6;
    return { day: DIAS_SEMANA[i] ?? `Dia ${i + 1}`, focus: focoDoDia(muscles), exercises, durationMin };
  });

  const localLabel = input.location === "gym" ? "academia" : "casa";
  return {
    summary: `Treino de ${dias}x por semana, na ${localLabel}, focado em ${input.workoutGoal.toLowerCase()}.`,
    days,
  };
}
