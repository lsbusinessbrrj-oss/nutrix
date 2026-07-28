import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Camera, Flame, MessageCircle, Trophy, ChevronRight, Settings, LogOut, Star, Zap, Target } from "lucide-react";
import { toast } from "sonner";

const ACHIEVEMENTS_DEFAULT = [
  { id: "first_plan", icon: "🥗", title: "Primeira Dieta", description: "Criou seu primeiro plano alimentar", color: "#43A047", unlocked: false },
  { id: "streak_7", icon: "🔥", title: "7 Dias Seguidos", description: "Manteve a sequência por 7 dias", color: "#FF6F00", unlocked: false },
  { id: "streak_30", icon: "⚡", title: "30 Dias de Fogo", description: "Manteve a sequência por 30 dias", color: "#E53935", unlocked: false },
  { id: "first_workout", icon: "💪", title: "Primeiro Treino", description: "Configurou seu plano de treino", color: "#1B5E20", unlocked: false },
  { id: "weight_goal", icon: "🎯", title: "Meta Alcançada", description: "Atingiu seu objetivo de peso", color: "#1565C0", unlocked: false },
  { id: "premium", icon: "⭐", title: "Membro Premium", description: "Assinou o plano Premium NutriX", color: "#C62828", unlocked: false },
];

export default function Perfil() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("perfil");

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: streakData } = trpc.profile.getStreak.useQuery(undefined, { enabled: isAuthenticated });
  const { data: achievements } = trpc.profile.getAchievements.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F3F4F6" }}>
      <div className="w-10 h-10 rounded-full border-4 border-[#43A047] border-t-transparent animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  const bmi = profile?.weight && profile?.height
    ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
    : null;
  const bmiLabel = bmi ? (
    +bmi < 18.5 ? { label: "Abaixo do peso", color: "#1565C0" } :
    +bmi < 25   ? { label: "Peso normal",     color: "#1B5E20" } :
    +bmi < 30   ? { label: "Sobrepeso",        color: "#E65100" } :
                  { label: "Obesidade",         color: "#C62828" }
  ) : null;

  const goalLabels: Record<string, string> = {
    weight_loss: "Emagrecimento 🔥",
    muscle_definition: "Definição 💪",
    muscle_gain: "Ganho de Massa ⚡",
    weight_loss_muscle: "Emagrecer + Massa 🎯",
    definition_muscle: "Definição + Massa 🏆",
  };

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i);
    return d;
  });
  const streakDates = new Set(streakData?.map((s: any) => s.date) ?? []);
  const currentStreak = (profile as any)?.currentStreak ?? 0;
  const firstName = user?.name?.split(" ")[0] ?? "Usuário";

  const unlockedAchievements = achievements ?? [];
  const allAchievements = ACHIEVEMENTS_DEFAULT.map(a => ({
    ...a,
    unlocked: unlockedAchievements.some((u: any) => u.type === a.id),
  }));

  return (
    <div className="min-h-screen" style={{ background: "#F3F4F6" }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Profile Header Card ── */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-20 relative" style={{ background: "linear-gradient(135deg,#1B5E20 0%,#43A047 50%,#E53935 100%)" }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          </div>
          {/* Avatar + info */}
          <div className="bg-white px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gray-100 flex items-center justify-center overflow-hidden">
                  {(profile as any)?.avatarUrl
                    ? <img src={(profile as any).avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                    : <span className="text-4xl">👤</span>}
                </div>
                <button onClick={() => toast.info("Upload de foto em breve!")}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md"
                  style={{ background: "#1B5E20" }}>
                  <Camera size={13} />
                </button>
              </div>
              <div className="flex gap-2 pb-1">
                <button onClick={() => toast.info("Configurações em breve!")}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                  <Settings size={16} className="text-gray-500" />
                </button>
                <button onClick={() => { logout(); navigate("/login"); }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-colors"
                  style={{ borderColor: "#FFCDD2", background: "#FFF5F5" }}>
                  <LogOut size={16} style={{ color: "#E53935" }} />
                </button>
              </div>
            </div>
            <h2 className="font-montserrat font-black text-xl text-gray-900">{user?.name ?? "Usuário"}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {currentStreak > 0 && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "#FFF3E0", color: "#FF6F00" }}>
                <Flame size={12} /> {currentStreak} dias de sequência 🔥
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: "perfil", label: "Perfil", icon: "👤" },
              { id: "conquistas", label: "Conquistas", icon: "🏆" },
              { id: "suporte", label: "Suporte", icon: "💬" },
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

          {/* ── Perfil Tab ── */}
          {activeTab === "perfil" && (
            <div className="p-4 space-y-4">
              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "⚖️", value: profile?.weight ? `${profile.weight} kg` : "—", label: "Peso", color: "#1B5E20" },
                  { icon: "📏", value: profile?.height ? `${profile.height} cm` : "—", label: "Altura", color: "#43A047" },
                  { icon: "📊", value: bmi ?? "—", label: "IMC", color: bmiLabel?.color ?? "#1B5E20", sub: bmiLabel?.label },
                  { icon: "🎯", value: goalLabels[profile?.goal ?? ""] ?? profile?.goal ?? "—", label: "Objetivo", color: "#E53935" },
                ].map(m => (
                  <div key={m.label} className="p-4 rounded-xl text-center" style={{ background: "#F3F4F6" }}>
                    <span className="text-2xl">{m.icon}</span>
                    <p className="font-black text-lg mt-1 leading-tight" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{m.label}</p>
                    {m.sub && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block text-white" style={{ background: m.color }}>
                        {m.sub}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Streak calendar */}
              <div className="p-4 rounded-xl" style={{ background: "#F3F4F6" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FFF3E0" }}>
                      <Flame size={16} style={{ color: "#FF6F00" }} />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Sequência Ativa</span>
                  </div>
                  <span className="font-black text-2xl" style={{ color: "#FF6F00" }}>{currentStreak}</span>
                </div>
                <div className="flex gap-1.5">
                  {weekDays.map((d, i) => {
                    const dateStr = d.toISOString().split("T")[0];
                    const isToday = i === 3;
                    const hasStreak = streakDates.has(dateStr);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl"
                        style={{
                          background: isToday ? "#1B5E20" : hasStreak ? "#E8F5E9" : "white",
                          border: isToday ? "none" : "1px solid #E5E7EB",
                        }}>
                        <span className="text-[9px] font-semibold" style={{ color: isToday ? "rgba(255,255,255,0.7)" : "#9CA3AF" }}>
                          {["D","S","T","Q","Q","S","S"][d.getDay()]}
                        </span>
                        <span className="text-xs font-bold" style={{ color: isToday ? "white" : hasStreak ? "#1B5E20" : "#9CA3AF" }}>
                          {hasStreak && !isToday ? "✓" : d.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick links */}
              <div className="space-y-2">
                {[
                  { icon: "🥗", label: "Meu Plano Alimentar", action: () => navigate("/dietas"), color: "#1B5E20" },
                  { icon: "🏋️", label: "Meu Plano de Treino", action: () => navigate("/dietas"), color: "#E53935" },
                  { icon: "💳", label: "Meus Pagamentos", action: () => navigate("/pagamentos"), color: "#43A047" },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: item.color + "15" }}>
                        {item.icon}
                      </div>
                      <span className="font-semibold text-sm text-gray-700">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Conquistas Tab ── */}
          {activeTab === "conquistas" && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-800">Suas Conquistas</p>
                  <p className="text-xs text-gray-500">{allAchievements.filter(a => a.unlocked).length} de {allAchievements.length} desbloqueadas</p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: "#E8F5E9" }}>
                  <Trophy size={14} style={{ color: "#43A047" }} />
                  <span className="text-xs font-bold" style={{ color: "#1B5E20" }}>{allAchievements.filter(a => a.unlocked).length}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {allAchievements.map(a => (
                  <div key={a.id} className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: a.unlocked ? a.color + "15" : "#F3F4F6",
                      border: a.unlocked ? `2px solid ${a.color}40` : "2px solid transparent",
                      opacity: a.unlocked ? 1 : 0.5,
                    }}>
                    <span className="text-3xl block mb-2" style={{ filter: a.unlocked ? "none" : "grayscale(100%)" }}>{a.icon}</span>
                    <p className="font-bold text-xs text-gray-800 leading-tight mb-1">{a.title}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{a.description}</p>
                    {a.unlocked && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: a.color }}>
                        <Star size={8} /> Desbloqueada
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Suporte Tab ── */}
          {activeTab === "suporte" && (
            <div className="p-4 space-y-4">
              <div className="p-4 rounded-xl text-center" style={{ background: "linear-gradient(135deg,#E8F5E9,#F1F8E9)", border: "1px solid #C8E6C9" }}>
                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#1B5E20" }}>
                  <MessageCircle size={24} className="text-white" />
                </div>
                <p className="font-black text-gray-800 mb-1">Fale Conosco</p>
                <p className="text-xs text-gray-500 mb-4">Nossa equipe está pronta para ajudar você a alcançar seus objetivos!</p>
                <button onClick={() => toast.info("Chat de suporte disponível no botão flutuante abaixo!")}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white"
                  style={{ background: "#1B5E20" }}>
                  💬 Iniciar Chat de Suporte
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { icon: "📧", label: "Email", value: "suporte@nutrix.com.br", color: "#1B5E20" },
                  { icon: "📱", label: "WhatsApp", value: "(11) 99999-9999", color: "#43A047" },
                  { icon: "⏰", label: "Horário", value: "Seg–Sex, 8h–18h", color: "#E53935" },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: c.color + "15" }}>
                      {c.icon}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">{c.label}</p>
                      <p className="text-sm font-semibold text-gray-700">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl" style={{ background: "#FFF5F5", border: "1px solid #FFCDD2" }}>
                <p className="font-bold text-sm mb-2" style={{ color: "#C62828" }}>❓ Perguntas Frequentes</p>
                {[
                  "Como alterar minha dieta?",
                  "Como cancelar minha assinatura?",
                  "Como funciona o plano de treino?",
                ].map(q => (
                  <button key={q} onClick={() => toast.info("FAQ em breve!")}
                    className="w-full flex items-center justify-between py-2.5 border-b border-red-100 last:border-0 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {q}
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
