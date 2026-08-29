import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { User as UserIcon, Trophy, Mail, Pencil, Weight, Ruler, Activity, Target, Phone, Flame, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Rarity = "Common" | "Uncommon" | "Rare" | "Legendary";
const RARITY: Record<Rarity, { bg: string; color: string }> = {
  Common: { bg: "#F1F5F9", color: "#64748B" },
  Uncommon: { bg: "#DCFCE7", color: "#16A34A" },
  Rare: { bg: "#FEF9C3", color: "#CA8A04" },
  Legendary: { bg: "#FFEDD5", color: "#EA580C" },
};

interface Ach {
  id: string; emoji: string; title: string; desc: string;
  target: number; unit: string; rarity: Rarity; category: string; realtime?: boolean;
}
const ACHIEVEMENTS: Ach[] = [
  { id: "chama_eterna", emoji: "🔥", title: "Chama Eterna", desc: "Mantenha uma streak de 100 dias", target: 100, unit: "dias", rarity: "Legendary", category: "streak" },
  { id: "mestre", emoji: "🏆", title: "Mestre da Consistência", desc: "Registre refeições por 30 dias consecutivos", target: 30, unit: "dias", rarity: "Rare", category: "habitos" },
  { id: "semana", emoji: "📅", title: "Semana Consistente", desc: "Registre refeições por 7 dias consecutivos", target: 7, unit: "dias", rarity: "Uncommon", category: "habitos" },
  { id: "guardiao", emoji: "🛡️", title: "Guardião do Fogo", desc: "Mantenha uma streak de 10 dias", target: 10, unit: "dias", rarity: "Uncommon", category: "streak" },
  { id: "prog_cal", emoji: "⚡", title: "Progresso de Calorias", desc: "Acompanhe suas calorias em tempo real", target: 100, unit: "%", rarity: "Uncommon", category: "tempo_real", realtime: true },
  { id: "prog_calorico", emoji: "🍎", title: "Progresso Calórico", desc: "Bata sua meta calórica do dia", target: 100, unit: "%", rarity: "Uncommon", category: "dieta" },
  { id: "iniciador", emoji: "✨", title: "Iniciador de Fogo", desc: "Mantenha uma streak de 3 dias", target: 3, unit: "dias", rarity: "Common", category: "streak" },
];

const CATEGORIES = [
  { id: "todas", label: "Todas", emoji: "🏆" },
  { id: "dieta", label: "Dieta", emoji: "🍎" },
  { id: "exercicio", label: "Exercício", emoji: "💪" },
  { id: "saude", label: "Saúde", emoji: "❤️" },
  { id: "streak", label: "Streak", emoji: "🔥" },
  { id: "tempo_real", label: "Tempo Real", emoji: "⚡" },
  { id: "habitos", label: "Hábitos", emoji: "🌱" },
];

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Emagrecimento", definition: "Definição Muscular",
  muscle_gain: "Ganho de Massa", health: "Saúde e Bem-estar", maintenance: "Manutenção",
};

export default function Perfil() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"perfil" | "conquistas">("perfil");

  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F8F7" }}>
      <div className="w-10 h-10 rounded-full border-4 border-[#43A047] border-t-transparent animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  const p = profile as any;
  const streak = p?.currentStreak ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#F7F8F7" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Tabs (segmented) ── */}
        <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100">
          {([["perfil", "Perfil", UserIcon], ["conquistas", "Conquistas", Trophy]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
              style={tab === id ? { background: "#FEF9C3", color: "#CA8A04" } : { background: "transparent", color: "#9CA3AF" }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {tab === "perfil" ? (
          <PerfilTab user={user} p={p} streak={streak} navigate={navigate} />
        ) : (
          <ConquistasTab streak={streak} />
        )}
      </div>
    </div>
  );
}

function PerfilTab({ user, p, streak, navigate }: any) {
  const bmi = p?.weight && p?.height ? (p.weight / ((p.height / 100) ** 2)) : null;
  const bmiLabel = bmi == null ? null
    : bmi < 18.5 ? { label: "Abaixo do peso", color: "#1565C0" }
    : bmi < 25 ? { label: "Peso normal", color: "#16A34A" }
    : bmi < 30 ? { label: "Sobrepeso", color: "#EA580C" }
    : { label: "Obesidade", color: "#DC2626" };
  const lastAccess = p?.lastSignedIn ? new Date(p.lastSignedIn) : null;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 3 + i); return d;
  });

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mx-auto">
            {p?.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
              : <UserIcon size={36} className="text-gray-300" />}
          </div>
          <button onClick={() => toast.info("Editar foto em breve!")}
            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center shadow">
            <Pencil size={13} />
          </button>
        </div>
        <p className="flex items-center justify-center gap-2 mt-4 text-gray-800 font-medium">
          <Mail size={16} className="text-gray-400" /> {user?.email}
        </p>
        {lastAccess && (
          <p className="text-xs text-gray-400 mt-1">
            Último acesso: {lastAccess.toLocaleDateString("pt-BR")}, {lastAccess.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* Stats card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-2 gap-y-6">
          <Stat icon={<Weight size={18} />} value={p?.weight ?? "—"} label="Peso (kg)" />
          <Stat icon={<Ruler size={18} />} value={p?.height ?? "—"} label="Altura (cm)" />
          <Stat icon={<Activity size={18} />} value={bmi ? bmi.toFixed(0) : "—"} label="IMC"
            badge={bmiLabel ? { text: bmiLabel.label, color: bmiLabel.color } : undefined} />
          <Stat icon={<Target size={18} />} value={GOAL_LABELS[p?.goal ?? ""] ?? "—"} label="Objetivo" small />
        </div>
        {p?.phone && (
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Telefone</p>
              <p className="font-bold text-gray-900">{p.phone}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sequência Ativa */}
      <div className="rounded-2xl shadow-sm p-6" style={{ background: "linear-gradient(135deg,#FFF7ED,#FFFBEB)", border: "1px solid #FED7AA" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#F97316" }}>
              <Flame size={20} className="text-white" />
            </span>
            <div>
              <p className="font-bold text-gray-900">🔥 Sequência Ativa</p>
              <p className="text-sm font-semibold" style={{ color: "#EA580C" }}>{streak} {streak === 1 ? "dia consecutivo" : "dias consecutivos"}</p>
            </div>
          </div>
          <span className="text-4xl font-black" style={{ color: "#EA580C" }}>{streak}</span>
        </div>
        <div className="flex gap-2 mt-4">
          {weekDays.map((d, i) => {
            const isToday = i === 3;
            return (
              <div key={i} className="flex-1 flex flex-col items-center py-2 rounded-xl bg-white/70">
                <span className="text-[10px] text-gray-400">{["dom","seg","ter","qua","qui","sex","sáb"][d.getDay()]}</span>
                <span className="text-sm font-bold text-gray-600">{d.getDate()}</span>
                {isToday && <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: "#F97316" }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fale Conosco */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#E8F5E9" }}>
            <MessageCircle size={18} style={{ color: "#16A34A" }} />
          </span>
          <div>
            <p className="font-bold text-gray-900">Fale Conosco</p>
            <p className="text-sm text-gray-400">Estamos aqui para ajudar</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">Precisa de ajuda ou tem alguma dúvida? Fale com nossa equipe pelo chat ao vivo.</p>
        <button onClick={() => toast.info("Chat de suporte no botão flutuante abaixo!")}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white"
          style={{ background: "#16A34A" }}>
          <MessageCircle size={16} /> Falar com o suporte
        </button>
      </div>

      <ContaSection navigate={navigate} />
    </div>
  );
}

function ContaSection({ navigate }: { navigate: (to: string) => void }) {
  const utils = trpc.useUtils();
  const cancelar = trpc.auth.cancelarAssinatura.useMutation();
  const excluir = trpc.auth.excluirConta.useMutation();

  async function handleCancelar() {
    if (!window.confirm("Deseja cancelar sua assinatura? Você deixa de ter acesso ao plano e não haverá novas cobranças.")) return;
    try { await cancelar.mutateAsync(); toast.success("Assinatura cancelada."); }
    catch (e) { toast.error((e as Error).message); }
  }
  async function handleExcluir() {
    if (!window.confirm("EXCLUIR CONTA: isso cancela a assinatura e apaga TODOS os seus dados permanentemente. Não pode ser desfeito. Confirmar?")) return;
    try {
      await excluir.mutateAsync();
      await utils.auth.me.invalidate();
      toast.success("Conta excluída.");
      navigate("/login");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="mt-10 pt-5 border-t border-gray-100 flex flex-col items-center gap-2">
      <p className="text-[10px] uppercase tracking-wider text-gray-300 font-semibold">Conta</p>
      <button onClick={handleCancelar} disabled={cancelar.isPending}
        className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50">Cancelar assinatura</button>
      <button onClick={handleExcluir} disabled={excluir.isPending}
        className="text-xs text-gray-300 hover:text-red-500 disabled:opacity-50">Excluir minha conta</button>
    </div>
  );
}

function Stat({ icon, value, label, badge, small }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 text-gray-400 mb-1">{icon}</div>
      <p className={`font-black text-gray-900 ${small ? "text-base leading-tight" : "text-3xl"}`}>{value}</p>
      <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mt-0.5">{label}</p>
      {badge && (
        <span className="inline-block mt-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
          style={{ color: badge.color, borderColor: badge.color + "66" }}>{badge.text}</span>
      )}
    </div>
  );
}

function ConquistasTab({ streak }: { streak: number }) {
  const [cat, setCat] = useState("todas");

  const progressOf = (a: Ach) => a.unit === "dias" ? Math.min(streak, a.target) : 0;
  const list = ACHIEVEMENTS.filter(a => cat === "todas" || a.category === cat);
  const unlocked = ACHIEVEMENTS.filter(a => progressOf(a) >= a.target).length;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "#F59E0B" }}>🏆</span>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Conquistas</h2>
            <p className="text-sm text-gray-400">Acompanhe seu progresso e desbloqueie conquistas</p>
          </div>
        </div>
        <p className="text-center mt-4">
          <span className="text-3xl font-black" style={{ color: "#EA580C" }}>{unlocked}</span>
          <span className="text-2xl font-black text-gray-300"> / {ACHIEVEMENTS.length}</span>
        </p>
        <p className="text-center text-sm text-gray-400 -mt-1">conquistas desbloqueadas</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={cat === c.id ? { background: "#111827", color: "white" } : { background: "white", color: "#6B7280", border: "1px solid #E5E7EB" }}>
            <span>{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>

      {/* Achievement cards */}
      <div className="grid grid-cols-2 gap-4">
        {list.map(a => {
          const prog = progressOf(a);
          const done = prog >= a.target;
          const r = RARITY[a.rarity];
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center relative">
              <span className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-3"
                style={{ background: done ? r.bg : "#F1F5F9", filter: done ? "none" : "grayscale(60%)" }}>
                {done ? a.emoji : "🔒"}
              </span>
              <p className="font-bold text-gray-800 leading-tight mb-1">{a.title}</p>
              <p className="text-xs text-gray-400 leading-tight mb-3">{a.desc}</p>
              <div className="text-left">
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Progresso</span><span>{prog}/{a.target}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (prog / a.target) * 100)}%`, background: r.color }} />
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: r.bg, color: r.color }}>{a.rarity}</span>
                {a.realtime && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF9C3", color: "#CA8A04" }}>⚡ Tempo Real</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
