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

  const utils = trpc.useUtils();
  const { data: dietPlan } = trpc.diet.getActivePlan.useQuery(undefined, { enabled: isAuthenticated });
  const { data: profileData } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const gerar = trpc.diet.generatePlan.useMutation({
    onSuccess: async () => { await utils.diet.getActivePlan.invalidate(); toast.success("Sua dieta foi gerada!"); },
    onError: (e) => toast.error(e.message),
  });
  const verificarAssin = trpc.payment.verificarAssinatura.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated]);

  // Volta do Mercado Pago após assinar (?preapproval_id=...) → confirma na hora.
  useEffect(() => {
    if (!isAuthenticated) return;
    const pid = new URLSearchParams(window.location.search).get("preapproval_id");
    if (!pid) return;
    window.history.replaceState({}, "", "/dietas");
    verificarAssin.mutate({ preapprovalId: pid }, {
      onSuccess: async (r) => {
        if (r.aprovado) {
          await utils.auth.me.invalidate();
          await utils.diet.getActivePlan.invalidate();
          toast.success("Assinatura ativada! Sua dieta está liberada. 🎉");
        }
      },
    });
  }, [isAuthenticated]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F3F4F6" }}>
      <div className="w-10 h-10 rounded-full border-4 border-[#43A047] border-t-transparent animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  const meals = (dietPlan?.planData as any)?.meals ?? [];
  const totalCals = dietPlan?.totalCalories ?? 0;
  const waterMl = (dietPlan?.planData as any)?.waterMl ?? 0;
  const orientacao = (dietPlan?.planData as any)?.orientacao ?? [];

  const quickActions = [
    { emoji: "🛒", label: "Lista Compras", action: () => toast.info("Lista de compras em breve!") },
    { emoji: "👩‍⚕️", label: "Consulta", action: () => toast.info("Agendamento em breve!") },
    { emoji: "📚", label: "Guias", action: () => toast.info("Guias em breve!") },
    { emoji: "📥", label: "Baixar PDF", action: () => {
      if (!(me as any)?.hasPaidPlan) { toast.error("Libere sua dieta para baixar o PDF."); return; }
      window.open("/api/dieta/pdf", "_blank");
    } },
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
          <DietaTab meals={meals} totalCals={totalCals} waterMl={waterMl} orientacao={orientacao} hasPlan={!!dietPlan}
            paid={!!(me as any)?.hasPaidPlan} onGerar={() => gerar.mutate()} gerando={gerar.isPending} navigate={navigate} />
        )}
        {activeTab === "treino" && <WorkoutWizard />}
        {activeTab === "progresso" && <ProgressoTab profileData={profileData} />}
      </div>
    </div>
  );
}

function DietaTab({ meals, totalCals, waterMl, orientacao, hasPlan, paid, onGerar, gerando, navigate }: any) {
  const [showOrient, setShowOrient] = useState(false);
  if (!hasPlan) {
    // Já pagou mas o plano ainda não foi gerado → gera na hora (rede de segurança).
    if (paid) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#E8F5E9" }}>
            <span className="text-3xl">🥗</span>
          </div>
          <p className="font-bold text-gray-700 mb-1">Vamos gerar sua dieta</p>
          <p className="text-sm text-gray-500 mb-5">Seu acesso está liberado. Clique para montar seu plano personalizado.</p>
          <button onClick={onGerar} disabled={gerando}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-60"
            style={{ background: "#1B5E20" }}>
            {gerando ? "Gerando..." : "Gerar minha dieta agora"}
          </button>
          <p className="text-[11px] text-gray-400 mt-3">Se aparecer erro de perfil, toque em "Perfil" e confirme peso, altura, idade e sexo.</p>
        </div>
      );
    }
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
      {/* Total + água */}
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-gray-600">
          <Flame size={16} style={{ color: "#F97316" }} />
          Total: <b className="text-gray-900">{totalCals} kcal</b>
        </span>
        {waterMl > 0 && (
          <span className="flex items-center gap-1.5 font-semibold" style={{ color: "#0284C7" }}>
            💧 {(waterMl / 1000).toFixed(1).replace(".", ",")} L de água/dia
          </span>
        )}
      </div>

      {/* Orientação nutricional */}
      {orientacao?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => setShowOrient(!showOrient)}
            className="w-full flex items-center justify-between px-5 py-4">
            <span className="flex items-center gap-2 font-bold text-gray-900">🍽️ Orientação nutricional</span>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${showOrient ? "rotate-180" : ""}`} />
          </button>
          {showOrient && (
            <ul className="px-5 pb-5 space-y-2">
              {orientacao.map((o: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span style={{ color: "#43A047" }}>•</span> {o}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
        {foods.map((food: any, j: number) => <FoodRow key={j} food={food} />)}
      </div>

      {options[opt]?.obs && (
        <p className="mt-4 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
          <span className="font-semibold text-gray-600">Observação: </span>{options[opt].obs}
        </p>
      )}
    </div>
  );
}

function FoodRow({ food }: { food: any }) {
  const [open, setOpen] = useState(false);
  const subs = food.substituicoes ?? [];
  return (
    <div className="border-b border-gray-50 last:border-0 pb-2.5 last:pb-0">
      <div className="flex items-start justify-between">
        <span className="flex items-center gap-2.5 text-gray-800">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
          </svg>
          <span>
            <span className="block">{food.name}</span>
            <span className="text-sm text-gray-400">{food.quantity}</span>
          </span>
        </span>
      </div>
      {subs.length > 0 && (
        <div className="pl-7 mt-1">
          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: "#F1F5F9", color: "#475569" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-4 4" /><path d="M3 7h18" /><path d="M7 21l-4-4 4-4" /><path d="M21 17H3" /></svg>
            Ver opções de substituição
          </button>
          {open && (
            <div className="mt-2 space-y-1.5">
              <p className="text-xs text-gray-400">Opções para substituir (mesma quantidade nutricional):</p>
              {subs.map((s: any, k: number) => (
                <div key={k} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#F8FAFC" }}>
                  <span className="text-sm text-gray-700">{s.name}</span>
                  <span className="text-xs text-gray-400">{s.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
