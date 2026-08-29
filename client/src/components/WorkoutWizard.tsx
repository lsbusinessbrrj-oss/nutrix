import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Dumbbell, Home, Zap, Clock } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

const MUSCLE_GROUPS = ["Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Abdômen", "Glúteos", "Quadríceps", "Posterior", "Panturrilha"];

export default function WorkoutWizard() {
  const [step, setStep] = useState<Step>(1);
  const [location, setLocation] = useState<"gym" | "home" | null>(null);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced" | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [muscles, setMuscles] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const { data: existingPlan } = trpc.workout.getActivePlan.useQuery();
  const generateMutation = trpc.workout.generatePlan.useMutation({
    onSuccess: (data) => { setGeneratedPlan(data.plan); toast.success("Plano de treino gerado!"); },
    onError: () => toast.error("Erro ao gerar plano. Tente novamente."),
  });

  const toggleMuscle = (m: string) => {
    setMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const plan = generatedPlan ?? (existingPlan?.planData as any);

  if (plan) {
    const reset = () => { setGeneratedPlan(null); setStep(1); setLocation(null); setLevel(null); setDays(null); setMuscles([]); setGoal(""); };
    const dias = plan.days ?? [];
    const today = new Date();
    const sunday = new Date(today); sunday.setDate(today.getDate() - today.getDay());
    const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(sunday); d.setDate(sunday.getDate() + i); return d; });
    const dowLetters = ["D", "S", "T", "Q", "Q", "S", "S"];

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900">Meus Treinos</h2>
          <button onClick={reset} className="text-sm font-semibold" style={{ color: "#43A047" }}>Refazer</button>
        </div>

        {/* Esta Semana */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">Esta Semana</h3>
          <div className="flex gap-2 mb-4">
            {week.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs text-gray-400">{dowLetters[i]}</span>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={isToday ? { background: "#111827", color: "white" } : { background: "#F3F4F6", color: "#6B7280" }}>
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-600"><b className="text-gray-900">0</b> de {dias.length} treinos na semana</span>
            <span className="text-gray-400">0%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100" />
        </div>

        {/* Cards por dia */}
        {dias.map((d: any, i: number) => (
          <WorkoutDayCard key={i} day={d} label={i === 0 ? "Hoje" : i === 1 ? "Amanhã" : d.day} soon={i > 0} />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Progress */}
      <div className="flex items-center gap-1 mb-6">
        {[1,2,3,4,5].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? "bg-[#1B5E20]" : "bg-gray-200"}`} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 className="font-montserrat font-bold text-lg text-gray-800 mb-1">Onde você vai treinar?</h3>
          <p className="text-sm text-gray-500 mb-5">Escolha o local do seu treino</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "gym" as const, label: "Academia", icon: <Dumbbell size={28} />, desc: "Equipamentos completos" },
              { value: "home" as const, label: "Em Casa", icon: <Home size={28} />, desc: "Sem equipamentos" },
            ].map(opt => (
              <button key={opt.value} onClick={() => setLocation(opt.value)}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition ${location === opt.value ? "border-[#1B5E20] bg-[#E8F5E9]" : "border-gray-200 hover:border-gray-300"}`}>
                <span style={{ color: location === opt.value ? "#1B5E20" : "#9CA3AF" }}>{opt.icon}</span>
                <span className="font-semibold text-sm text-gray-800">{opt.label}</span>
                <span className="text-xs text-gray-500">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="font-montserrat font-bold text-lg text-gray-800 mb-1">Qual seu nível?</h3>
          <p className="text-sm text-gray-500 mb-5">Seja honesto para um treino adequado</p>
          <div className="space-y-3">
            {[
              { value: "beginner" as const, label: "Iniciante", desc: "Menos de 6 meses de treino", icon: "🌱" },
              { value: "intermediate" as const, label: "Intermediário", desc: "6 meses a 2 anos", icon: "💪" },
              { value: "advanced" as const, label: "Avançado", desc: "Mais de 2 anos", icon: "🏆" },
            ].map(opt => (
              <button key={opt.value} onClick={() => setLevel(opt.value)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ${level === opt.value ? "border-[#1B5E20] bg-[#E8F5E9]" : "border-gray-200"}`}>
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="font-montserrat font-bold text-lg text-gray-800 mb-1">Quantos dias por semana?</h3>
          <p className="text-sm text-gray-500 mb-5">Escolha sua frequência semanal</p>
          <div className="grid grid-cols-4 gap-2">
            {[2,3,4,5,6,7].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`py-4 rounded-2xl border-2 font-bold text-lg transition ${days === d ? "border-[#1B5E20] bg-[#E8F5E9] text-[#1B5E20]" : "border-gray-200 text-gray-600"}`}>
                {d}x
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h3 className="font-montserrat font-bold text-lg text-gray-800 mb-1">Grupos musculares</h3>
          <p className="text-sm text-gray-500 mb-5">Selecione os que deseja trabalhar</p>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map(m => (
              <button key={m} onClick={() => toggleMuscle(m)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${muscles.includes(m) ? "text-white border-[#1B5E20]" : "border-gray-300 text-gray-600 hover:border-[#43A047]"}`}
                style={muscles.includes(m) ? { background: "#1B5E20" } : {}}>
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h3 className="font-montserrat font-bold text-lg text-gray-800 mb-1">Qual seu objetivo?</h3>
          <p className="text-sm text-gray-500 mb-5">Isso vai direcionar seu treino</p>
          <div className="space-y-2">
            {["Hipertrofia (ganho de massa)", "Emagrecimento", "Condicionamento físico", "Força e potência", "Definição muscular"].map(g => (
              <button key={g} onClick={() => setGoal(g)}
                className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-sm font-medium transition ${goal === g ? "border-[#1B5E20] bg-[#E8F5E9] text-[#1B5E20]" : "border-gray-200 text-gray-700"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button onClick={() => setStep((step - 1) as Step)}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ChevronLeft size={16} /> Voltar
          </button>
        )}
        {step < 5 ? (
          <button
            onClick={() => {
              if (step === 1 && !location) { toast.error("Selecione o local de treino"); return; }
              if (step === 2 && !level) { toast.error("Selecione seu nível"); return; }
              if (step === 3 && !days) { toast.error("Selecione os dias por semana"); return; }
              if (step === 4 && muscles.length === 0) { toast.error("Selecione ao menos um grupo muscular"); return; }
              setStep((step + 1) as Step);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-semibold text-white transition active:scale-[0.97]"
            style={{ background: "#1B5E20" }}>
            Próximo <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => {
              if (!goal) { toast.error("Selecione seu objetivo"); return; }
              generateMutation.mutate({ location: location!, level: level!, daysPerWeek: days!, muscleGroups: muscles, workoutGoal: goal });
            }}
            disabled={generateMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition active:scale-[0.97] disabled:opacity-60"
            style={{ background: "#E53935" }}>
            {generateMutation.isPending ? "Gerando..." : <><Zap size={15} /> Gerar Treino</>}
          </button>
        )}
      </div>
    </div>
  );
}

function WorkoutDayCard({ day, label, soon }: { day: any; label: string; soon?: boolean }) {
  const [open, setOpen] = useState(false);
  const exercises = day.exercises ?? [];
  const duration = day.durationMin ?? exercises.length * 6;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <button onClick={() => setOpen(!open)} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-2 font-bold text-gray-900">🏋️ {label}</span>
          <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#43A047" }}>
            Veja seu treino <ChevronRight size={15} className={`transition-transform ${open ? "rotate-90" : ""}`} />
          </span>
        </div>
        <p className="text-sm text-gray-400 text-left">{day.day}</p>
        <p className="font-bold text-gray-900 text-left mb-3">{day.focus}</p>
        <div className="flex items-center gap-5 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Zap size={15} style={{ color: "#F59E0B" }} /> Exercícios: <b className="text-gray-800">{exercises.length}</b></span>
          <span className="flex items-center gap-1.5"><Clock size={15} /> Duração: <b className="text-gray-800">{duration} min</b></span>
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {exercises.map((ex: any, j: number) => (
            <div key={j} className="flex items-start justify-between text-sm">
              <div>
                <span className="font-medium text-gray-800">{ex.name}</span>
                {ex.notes && <p className="text-xs text-gray-400">{ex.notes}</p>}
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{ex.sets}x {ex.reps} · {ex.rest}</span>
            </div>
          ))}
        </div>
      )}
      {soon && !open && <p className="text-xs text-gray-400 mt-3">Em breve</p>}
    </div>
  );
}

