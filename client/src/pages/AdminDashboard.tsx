 import { trpc } from "@/lib/trpc";
 import { Users, CreditCard, Salad, Dumbbell, TrendingUp, UserPlus } from "lucide-react";
 import { Link } from "wouter";

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "20", color }}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-black font-montserrat text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-montserrat text-2xl font-black text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral da plataforma NutriX</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 shadow-sm h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<Users size={22} />} label="Total de Usuários" value={stats?.totalUsers ?? 0} color="#43A047" />
          <StatCard icon={<UserPlus size={22} />} label="Novos (7 dias)" value={stats?.newUsersWeek ?? 0} color="#1B5E20" />
          <StatCard icon={<CreditCard size={22} />} label="Pagamentos Concluídos" value={stats?.totalPayments ?? 0} color="#E53935" />
          <StatCard icon={<Salad size={22} />} label="Planos Alimentares" value={stats?.totalDietPlans ?? 0} color="#43A047" />
          <StatCard icon={<Dumbbell size={22} />} label="Planos de Treino" value={stats?.totalWorkoutPlans ?? 0} color="#C62828" />
          <StatCard icon={<TrendingUp size={22} />} label="Receita Total" value={`R$ ${((stats?.totalPayments ?? 0) * 9.99).toFixed(2)}`} color="#1B5E20" />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/usuarios">
          <a className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9", color: "#43A047" }}><Users size={22} /></div>
            <div>
              <p className="font-semibold text-gray-800 group-hover:text-[#1B5E20] transition">Gerenciar Usuários</p>
              <p className="text-xs text-gray-400 mt-0.5">Ver, buscar e alterar roles</p>
            </div>
          </a>
        </Link>
        <Link href="/admin/pagamentos">
          <a className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#FFEBEE", color: "#E53935" }}><CreditCard size={22} /></div>
            <div>
              <p className="font-semibold text-gray-800 group-hover:text-[#C62828] transition">Gerenciar Pagamentos</p>
              <p className="text-xs text-gray-400 mt-0.5">Ver transações e status</p>
            </div>
          </a>
        </Link>
      </div>
    </div>
  );
}
