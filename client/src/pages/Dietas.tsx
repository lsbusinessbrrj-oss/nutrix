import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Sparkles, ChevronDown, Flame, CalendarDays } from "lucide-react";
import WorkoutWizard from "@/components/WorkoutWizard";
import { toast } from "sonner";

type TabId = "dieta" | "treino" | "progresso";

export default function Dietas() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("dieta");
  const [showQuick, setShowQuick] = useState(false);

  const { data: dietPlan } = trpc.diet.getActivePlan.useQuery(undefined, { enabled: isAuthenticated });
  const { data: profileData } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F3F4F6" }}>
      <div className="w-10 h-10 rounded-full border-4 border-[#43A047] border-t-transparent animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  const meals = (dietPlan?.planData as any)?.meals ?? [];
  const totalCals = dietPlan?.totalCalories ?? 0;

  const quickActions = [
    { emoji: "🛒", label: "Lista Compras", action: () => toast.info("Lista de compras em breve!") },
    { emoji: "👩‍⚕️", label: "Consulta", action: () => toast.info("Agendamento em breve!") },
    { emoji: "📚", label: "Guias", action: () => toast.info("Guias em breve!") },
    { emoji: "📥", label: "Baixar PDF", action: () => toast.info("Download em breve!") },
    { emoji: "👤", label: "Perfil", action: () => navigate("/perfil") },
  ];

  const tabs: { id: TabId; label: string; novo?: boolean }[] = [
    { id: "dieta", label: "Dieta" },
    { id: "treino", label: "Treino" },
    { id: "progresso", label: "Progresso", novo: true },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F7F8F7" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Acesso Rápido ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button onClick={() => setShowQuick(!showQuick)}
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors">
            <span className="flex items-center gap-2.5 font-bold text-lg" style={{ color: "#111827" }}>
              <Sparkles size={20} style={{ color: "#43A047" }} />
              Acesso Rápido
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-400">
              Baixar PDF e muito mais
              <ChevronDown size={18} className={`transition-transform ${showQuick ? "rotate-180" : ""}`} />
            </span>
          </button>
          {showQuick && (
            <div className="flex flex-wrap justify-center gap-4 px-6 pb-6 pt-1">
              {quickActions.map(a => (
                <button key={a.label} onClick={a.action}
                  className="flex flex-col items-center gap-2 w-20 group">
                  <span className="w-16 h-16 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                    {a.emoji}
                  </span>
                  <span className="text-xs text-gray-500 text-center leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Pill Tabs ── */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-gray-100">
            {tabs.map(tab => (
              <div key={tab.id} className="relative">
                {tab.novo && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap" style={{ color: "#43A047" }}>
                    Novo ✨
                  </span>
                )}
                <button onClick={() => setActiveTab(tab.id)}
                  className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
                  style={activeTab === tab.id
                    ? { background: "#111827", color: "white" }
                    : { background: "transparent", color: "#6B7280" }}>
                  {tab.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {activeTab === "dieta" && (
          <DietaTab meals={meals} totalCals={totalCals} hasPlan={!!dietPlan} navigate={navigate} />
        )}
        {activeTab === "treino" && <WorkoutWizard />}
        {activeTab === "progresso" && <ProgressoTab profileData={profileData} />}
      </div>
    </div>
  );
}

function DietaTab({ meals, totalCals, hasPlan, navigate }: any) {
  if (!hasPlan) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#E8F5E9" }}>
          <span className="text-3xl">🥗</span>
        </div>
        <p className="font-bold text-gray-700 mb-1">Nenhum plano ativo</p>
        <p className="text-sm text-gray-500 mb-5">Monte sua dieta personalizada agora mesmo!</p>
        <button onClick={() => navigate("/home")}
          className="px-8 py-3 rounded-xl font-bold text-sm text-white shadow-md"
          style={{ background: "#1B5E20" }}>
          Montar minha dieta
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm text-gray-600">
        <Flame size={16} style={{ color: "#F97316" }} />
        Total: <b className="text-gray-900">{totalCals} kcal</b>
      </p>
      {meals.map((meal: any, i: number) => <MealCard key={i} meal={meal} />)}

      {/* Agendar consulta */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#E8F5E9" }}>
            <CalendarDays size={20} style={{ color: "#1B5E20" }} />
          </span>
          <h3 className="font-bold text-lg text-gray-900">Agendar consulta 👩‍⚕️</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Faça uma consulta com nossa nutricionista e receba um atendimento personalizado por um preço acessível.
        </p>
        <button onClick={() => toast.info("Agendamento em breve!")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: "#1B5E20" }}>
          <CalendarDays size={16} /> Agendar
        </button>
      </div>
    </div>
  );
}

const MEAL_ICONS: Record<string, string> = {
  "Café da manhã": "☕", "Café da Manhã": "☕",
  "Lanche da Manhã": "🍏", "Lanche da manhã": "🍏",
  "Almoço": "🥗",
  "Lanche da Tarde": "🍎", "Lanche da tarde": "🍎",
  "Jantar": "🍲",
};

function MealCard({ meal }: { meal: any }) {
  const [opt, setOpt] = useState(0);
  const options = meal.options ?? [{ foods: meal.foods ?? [] }];
  const foods = options[opt]?.foods ?? [];
  const icon = MEAL_ICONS[meal.name] ?? "🍽️";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-bold text-gray-900">{meal.name}</p>
            {meal.time && <p className="text-xs text-gray-400">{meal.time}</p>}
          </div>
        </div>
        <span className="font-bold text-gray-900">{meal.calories} kcal</span>
      </div>

      {/* option segmented control */}
      {options.length > 1 && (
        <div className="flex p-1 rounded-full bg-gray-100 mb-4">
          {options.map((_: any, i: number) => (
            <button key={i} onClick={() => setOpt(i)}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
              style={opt === i
                ? { background: "white", color: "#111827", boxShadow: "0 1px 3px rgba(0,0,0,.1)" }
                : { background: "transparent", color: "#6B7280" }}>
              Opção {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* foods */}
      <div className="space-y-3">
        {foods.map((food: any, j: number) => (
          <div key={j} className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-gray-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
              </svg>
              {food.name}
            </span>
            <span className="text-sm text-gray-400">{food.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressoTab({ profileData }: any) {
  const streak = (profileData as any)?.currentStreak ?? 0;
  const weight = (profileData as any)?.weight;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#E8F5E9" }}>
        <span className="text-3xl">📈</span>
      </div>
      <p className="font-bold text-gray-900 mb-1">Acompanhe sua evolução</p>
      <p className="text-sm text-gray-500 mb-6">Seu progresso de peso, calorias e sequência em um só lugar.</p>
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {[
          { label: "Peso atual", value: weight ? `${weight} kg` : "—", emoji: "⚖️" },
          { label: "Dias seguidos", value: `${streak}`, emoji: "🔥" },
        ].map(m => (
          <div key={m.label} className="p-4 rounded-xl" style={{ background: "#F7F8F7" }}>
            <span className="text-2xl">{m.emoji}</span>
            <p className="font-bold text-lg mt-1" style={{ color: "#1B5E20" }}>{m.value}</p>
            <p className="text-xs text-gray-500">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
