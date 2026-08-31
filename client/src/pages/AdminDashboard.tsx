import { trpc } from "@/lib/trpc";
import { Users, CreditCard, Salad, Dumbbell, TrendingUp, UserPlus, DollarSign, Percent, ShoppingCart } from "lucide-react";
import { Link } from "wouter";

function StatCard({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "20", color }}>{icon}</div>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-black font-montserrat text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// Gráfico de barras simples dos últimos 14 dias (cadastros x compras).
function Chart14({ serie }: { serie?: { cadastros: { dia: string; c: number }[]; compras: { dia: string; c: number }[] } }) {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0, 10)); }
  const cad: Record<string, number> = {}; (serie?.cadastros ?? []).forEach((x) => { cad[String(x.dia).slice(0, 10)] = x.c; });
  const com: Record<string, number> = {}; (serie?.compras ?? []).forEach((x) => { com[String(x.dia).slice(0, 10)] = x.c; });
  const max = Math.max(1, ...days.map((d) => Math.max(cad[d] ?? 0, com[d] ?? 0)));
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold text-gray-800">Últimos 14 dias</p>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#43A047" }} /> Cadastros</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#E53935" }} /> Compras</span>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-40">
        {days.map((d) => (
          <div key={d} className="flex-1 flex flex-col items-center justify-end gap-0.5 h-full" title={`${d}\nCadastros: ${cad[d] ?? 0} · Compras: ${com[d] ?? 0}`}>
            <div className="w-full flex items-end justify-center gap-0.5 h-full">
              <div className="w-1/2 rounded-t" style={{ height: `${((cad[d] ?? 0) / max) * 100}%`, background: "#43A047", minHeight: (cad[d] ?? 0) ? 2 : 0 }} />
              <div className="w-1/2 rounded-t" style={{ height: `${((com[d] ?? 0) / max) * 100}%`, background: "#E53935", minHeight: (com[d] ?? 0) ? 2 : 0 }} />
            </div>
            <span className="text-[9px] text-gray-400">{d.slice(8)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();
  const preco = stats?.precoUnitario ?? 9.99;
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-montserrat text-2xl font-black text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do NutriX — assinaturas, compras e receita</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 shadow-sm h-28 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Destaques */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<CreditCard size={20} />} label="Assinaturas ativas" value={stats?.assinantes ?? 0} color="#1B5E20" sub="clientes com plano ativo" />
            <StatCard icon={<ShoppingCart size={20} />} label="Compras" value={stats?.totalPayments ?? 0} color="#E53935" sub={`${stats?.comprasWeek ?? 0} nos últimos 7 dias`} />
            <StatCard icon={<DollarSign size={20} />} label="Receita" value={`R$ ${(stats?.receita ?? 0).toFixed(2)}`} color="#0B7A3B" sub={`R$ ${preco.toFixed(2)} por venda`} />
            <StatCard icon={<Percent size={20} />} label="Conversão" value={`${(stats?.conversao ?? 0).toFixed(1)}%`} color="#CA8A04" sub="assinantes / usuários" />
          </div>

          {/* Secundários */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users size={20} />} label="Total de usuários" value={stats?.totalUsers ?? 0} color="#43A047" />
            <StatCard icon={<UserPlus size={20} />} label="Novos (7 dias)" value={stats?.newUsersWeek ?? 0} color="#43A047" />
            <StatCard icon={<Salad size={20} />} label="Planos alimentares" value={stats?.totalDietPlans ?? 0} color="#43A047" />
            <StatCard icon={<Dumbbell size={20} />} label="Planos de treino" value={stats?.totalWorkoutPlans ?? 0} color="#C62828" />
          </div>

          <Chart14 serie={stats?.serie} />
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/usuarios">
          <a className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9", color: "#43A047" }}><Users size={22} /></div>
            <div>
              <p className="font-semibold text-gray-800 group-hover:text-[#1B5E20] transition">Gerenciar Usuários</p>
              <p className="text-xs text-gray-400 mt-0.5">Ver, buscar e alterar roles · exportar CSV</p>
            </div>
          </a>
        </Link>
        <Link href="/admin/pagamentos">
          <a className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#FFEBEE", color: "#E53935" }}><CreditCard size={22} /></div>
            <div>
              <p className="font-semibold text-gray-800 group-hover:text-[#C62828] transition">Gerenciar Pagamentos</p>
              <p className="text-xs text-gray-400 mt-0.5">Ver transações e status · exportar CSV</p>
            </div>
          </a>
        </Link>
      </div>
    </div>
  );
}
