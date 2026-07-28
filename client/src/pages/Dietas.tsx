import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Flame, FileText, ShoppingCart, Calendar, BookOpen, Download, User, TrendingUp, Dumbbell, ChevronRight, Droplets, Apple, Scale, Clock } from "lucide-react";
import WorkoutWizard from "@/components/WorkoutWizard";
import { toast } from "sonner";

const WEEK_DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export default function Dietas() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dieta");
  const [showQuickAccess, setShowQuickAccess] = useState(false);

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
  const firstName = user?.name?.split(" ")[0] ?? "você";
  const streak = (profileData as any)?.currentStreak ?? 0;
  const today = new Date();
  const todayDay = today.getDay();

  const quickActions = [
    { icon: <FileText size={16} />, label: "Modificar Dieta", action: () => navigate("/home"), color: "#1B5E20" },
    { icon: <ShoppingCart size={16} />, label: "Lista de Compras", action: () => toast.info("Lista de compras em breve!"), color: "#43A047" },
    { icon: <Calendar size={16} />, label: "Agendar Consulta", action: () => toast.info("Agendamento em breve!"), color: "#E53935" },
    { icon: <BookOpen size={16} />, label: "Guias", action: () => toast.info("Guias em breve!"), color: "#1B5E20" },
    { icon: <Download size={16} />, label: "Baixar PDF", action: () => toast.info("Download em breve!"), color: "#C62828" },
    { icon: <User size={16} />, label: "Perfil", action: () => navigate("/perfil"), color: "#43A047" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F3F4F6" }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Greeting + Streak ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Bem-vindo de volta!</p>
              <h1 className="font-montserrat text-xl font-black" style={{ color: "#1B5E20" }}>
                Olá, {firstName}! 👋
              </h1>
            </div>
            <img src="/nutrix-logo.jpeg" alt="NutriX" className="h-12 w-12 rounded-full object-cover shadow" />
          </div>

          {/* Streak banner */}
          {streak > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: "linear-gradient(135deg,#FFF3E0,#FFF8E1)", border: "1px solid #FFB300" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FF6F00" }}>
                <Flame size={20} className="text-white" />
              </div>
              <div>
                <p className="font-black text-base" style={{ color: "#E65100" }}>{streak} {streak === 1 ? "dia seguido" : "dias seguidos"}! 🔥</p>
                <p className="text-xs text-orange-600">Continue assim, você está arrasando!</p>
              </div>
            </div>
          )}

          {/* Week streak calendar */}
          <div className="flex gap-1.5">
            {WEEK_DAYS.map((day, i) => {
              const isToday = i === todayDay;
              const isPast = i < todayDay;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-semibold" style={{ color: isToday ? "#E53935" : "#9CA3AF" }}>{day}</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                    style={{
                      background: isToday ? "#E53935" : isPast && streak > 0 ? "#1B5E20" : "#F3F4F6",
                      color: isToday || (isPast && streak > 0) ? "white" : "#9CA3AF",
                      transform: isToday ? "scale(1.15)" : "scale(1)",
                    }}>
                    {isPast && streak > 0 ? "✓" : today.getDate() - (todayDay - i)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Flame size={18} />, label: "Calorias hoje", value: totalCals > 0 ? `${totalCals} kcal` : "—", sub: "Meta diária", color: "#E53935", bg: "#FFF5F5" },
            { icon: <Droplets size={18} />, label: "Hidratação", value: "2,0 L", sub: "Beba mais água!", color: "#1565C0", bg: "#EFF6FF" },
            { icon: <Scale size={18} />, label: "Peso atual", value: (profileData as any)?.weight ? `${(profileData as any).weight} kg` : "—", sub: "Registrado", color: "#1B5E20", bg: "#F0FDF4" },
            { icon: <Apple size={18} />, label: "Refeições", value: `${meals.length}/5`, sub: "Plano ativo", color: "#43A047", bg: "#F0FDF4" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 font-medium truncate">{stat.label}</p>
                <p className="font-black text-base leading-tight" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] text-gray-400">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => setShowQuickAccess(!showQuickAccess)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold transition-colors hover:bg-gray-50"
            style={{ color: "#1B5E20" }}>
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ background: "#1B5E20" }}>✦</span>
              Acesso Rápido
            </span>
            <ChevronRight size={16} className={`text-gray-400 transition-transform ${showQuickAccess ? "rotate-90" : ""}`} />
          </button>
          {showQuickAccess && (
            <div className="grid grid-cols-3 gap-0 border-t border-gray-100">
              {quickActions.map(action => (
                <button key={action.label} onClick={action.action}
                  className="flex flex-col items-center gap-2 p-4 hover:bg-gray-50 transition-colors border-r border-b border-gray-100 last:border-r-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: action.color + "15", color: action.color }}>
                    {action.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Main Tabs ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            {[
              { id: "dieta", label: "Dieta", icon: "🥗" },
              { id: "treino", label: "Treino", icon: "🏋️" },
              { id: "progresso", label: "Progresso", icon: "📈" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3.5 text-xs font-bold transition-all relative"
                style={{ color: activeTab === tab.id ? "#1B5E20" : "#9CA3AF" }}>
                <span className="text-base">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: "#1B5E20" }} />
                )}
              </button>
            ))}
          </div>

          {/* ── Dieta Tab ── */}
          {activeTab === "dieta" && (
            <div className="p-4">
              {!dietPlan ? (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#E8F5E9" }}>
                    <span className="text-3xl">🥗</span>
                  </div>
                  <p className="font-bold text-gray-700 mb-1">Nenhum plano ativo</p>
                  <p className="text-xs text-gray-500 mb-5">Monte sua dieta personalizada com IA agora mesmo!</p>
                  <button onClick={() => navigate("/home")}
                    className="px-8 py-3 rounded-xl font-black text-sm text-white shadow-md"
                    style={{ background: "linear-gradient(135deg,#1B5E20,#43A047)" }}>
                    Montar minha dieta
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Total calories banner */}
                  <div className="flex items-center justify-between p-3 rounded-xl mb-3" style={{ background: "linear-gradient(135deg,#1B5E20,#43A047)" }}>
                    <div className="flex items-center gap-2">
                      <Flame size={18} className="text-white" />
                      <span className="text-sm font-bold text-white">Total diário</span>
                    </div>
                    <span className="font-black text-white text-lg">{totalCals} kcal</span>
                  </div>
                  {meals.map((meal: any, i: number) => (
                    <MealCard key={i} meal={meal} />
                  ))}
                  {/* Consult CTA */}
                  <div className="mt-4 p-4 rounded-xl text-center" style={{ background: "linear-gradient(135deg,#E8F5E9,#F1F8E9)", border: "1px solid #C8E6C9" }}>
                    <p className="text-sm font-bold mb-1" style={{ color: "#1B5E20" }}>👩‍⚕️ Consulta com Nutricionista</p>
                    <p className="text-xs text-gray-500 mb-3">Receba atendimento personalizado e tire todas as suas dúvidas.</p>
                    <button onClick={() => toast.info("Agendamento em breve!")}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: "#43A047" }}>
                      Agendar Consulta
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Treino Tab ── */}
          {activeTab === "treino" && (
            <div className="p-4">
              <WorkoutWizard />
            </div>
          )}

          {/* ── Progresso Tab ── */}
          {activeTab === "progresso" && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#E8F5E9" }}>
                <TrendingUp size={28} style={{ color: "#43A047" }} />
              </div>
              <p className="font-black text-gray-800 mb-1">Acompanhe sua Evolução</p>
              <p className="text-xs text-gray-500 mb-5">Disponível em breve no aplicativo NutriX para uma experiência completa.</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Peso inicial", value: "—", icon: "⚖️" },
                  { label: "Peso atual", value: (profileData as any)?.weight ? `${(profileData as any).weight} kg` : "—", icon: "📊" },
                  { label: "IMC", value: "—", icon: "💪" },
                  { label: "Dias ativos", value: `${streak}`, icon: "🔥" },
                ].map(m => (
                  <div key={m.label} className="p-3 rounded-xl text-center" style={{ background: "#F3F4F6" }}>
                    <span className="text-2xl">{m.icon}</span>
                    <p className="font-black text-base mt-1" style={{ color: "#1B5E20" }}>{m.value}</p>
                    <p className="text-[10px] text-gray-500">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => toast.info("Em breve na Google Play!")}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                  style={{ background: "#1B5E20" }}>
                  Google Play
                </button>
                <button onClick={() => toast.info("Em breve na App Store!")}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white bg-gray-900">
                  App Store
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function MealCard({ meal }: { meal: any }) {
  const [activeOption, setActiveOption] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const options = meal.options ?? [{ foods: meal.foods ?? [] }];
  const currentFoods = options[activeOption]?.foods ?? [];

  const mealIcons: Record<string, string> = {
    "Café da manhã": "☕", "Café da Manhã": "☕",
    "Lanche da Manhã": "🍏", "Lanche da manhã": "🍏",
    "Almoço": "🥗",
    "Lanche da Tarde": "🍎", "Lanche da tarde": "🍎",
    "Jantar": "🍲",
  };
  const icon = mealIcons[meal.name] ?? "🍽️";

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ border: "1px solid #E5E7EB" }}>
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "#E8F5E9" }}>
            {icon}
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-gray-800">{meal.name}</p>
            {meal.time && (
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <Clock size={9} /> {meal.time}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-sm px-2.5 py-1 rounded-full" style={{ background: "#E8F5E9", color: "#1B5E20" }}>
            {meal.calories} kcal
          </span>
          <ChevronRight size={14} className={`text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ background: "#FAFAFA", borderTop: "1px solid #F3F4F6" }}>
          {/* Option tabs */}
          {options.length > 1 && (
            <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto">
              {options.map((_: any, i: number) => (
                <button key={i} onClick={() => setActiveOption(i)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 flex-shrink-0"
                  style={activeOption === i
                    ? { background: "#1B5E20", color: "white", borderColor: "#1B5E20" }
                    : { background: "white", color: "#6B7280", borderColor: "#E5E7EB" }}>
                  Opção {i + 1}
                </button>
              ))}
            </div>
          )}
          {/* Foods list */}
          <div className="px-4 py-3 space-y-2">
            {currentFoods.map((food: any, j: number) => (
              <div key={j} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5E9" }}>
                    <span className="text-[10px]" style={{ color: "#43A047" }}>✓</span>
                  </div>
                  <span className="text-sm text-gray-700">{food.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{food.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
