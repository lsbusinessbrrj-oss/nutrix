import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Search, ChevronLeft, ChevronRight, Crown, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Emagrecimento", muscle_definition: "Definição", muscle_gain: "Ganho de Massa",
  weight_loss_muscle: "Emagrecer + Massa", definition_muscle: "Definição + Massa",
};

export default function AdminUsuarios() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = trpc.admin.listUsers.useQuery(
    { page, limit: 15, search: debouncedSearch || undefined }
  );

  const { data: detail } = trpc.admin.getUserDetail.useQuery(
    { userId: selectedUser! },
    { enabled: selectedUser !== null }
  );

  const setRoleMutation = trpc.admin.setUserRole.useMutation({
    onSuccess: () => {
      toast.success("Role atualizada com sucesso!");
      utils.admin.listUsers.invalidate();
      utils.admin.getUserDetail.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const totalPages = data ? Math.ceil(data.total / 15) : 1;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat text-2xl font-black text-gray-800">Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} usuários cadastrados</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input type="text" placeholder="Buscar por nome ou email..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#43A047] w-64 bg-white" />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Tabela */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuário</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Plano</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Cadastro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-40" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-16" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse w-16" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse w-24" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : data?.rows.map((u: any) => (
                <tr key={u.id}
                  onClick={() => setSelectedUser(u.id)}
                  className={`border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${selectedUser === u.id ? "bg-[#E8F5E9]" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: u.role === "admin" ? "#1B5E20" : "#43A047" }}>
                        {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 leading-tight">{u.name ?? "—"}</p>
                        <p className="text-xs text-gray-400">{u.email ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === "admin" ? "bg-[#1B5E20] text-white" : "bg-gray-100 text-gray-600"}`}>
                      {u.role === "admin" ? <><Crown size={10} /> Admin</> : <><UserIcon size={10} /> Usuário</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${u.hasPaidPlan ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-gray-100 text-gray-500"}`}>
                      {u.hasPaidPlan ? "Pago" : "Gratuito"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-[#43A047] font-medium hover:underline">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Painel de detalhes */}
        {selectedUser && detail && (
          <div className="w-72 flex-shrink-0 space-y-3">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ background: (detail as any).user.role === "admin" ? "#1B5E20" : "#43A047" }}>
                  {((detail as any).user.name ?? (detail as any).user.email ?? "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{(detail as any).user.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{(detail as any).user.email ?? "—"}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-600 mb-4">
                <div className="flex justify-between"><span className="text-gray-400">Objetivo</span><span>{GOAL_LABELS[(detail as any).user.goal ?? ""] ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Peso</span><span>{(detail as any).user.weight ? `${(detail as any).user.weight} kg` : "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Altura</span><span>{(detail as any).user.height ? `${(detail as any).user.height} cm` : "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Plano pago</span><span className={(detail as any).user.hasPaidPlan ? "text-[#1B5E20] font-semibold" : ""}>{(detail as any).user.hasPaidPlan ? "Sim" : "Não"}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Planos gerados</span><span>{(detail as any).dietPlans?.length ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Pagamentos</span><span>{(detail as any).payments?.length ?? 0}</span></div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Alterar Role</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRoleMutation.mutate({ userId: selectedUser, role: "user" })}
                    disabled={(detail as any).user.role === "user" || setRoleMutation.isPending}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-40"
                    style={{ borderColor: "#43A047", color: (detail as any).user.role === "user" ? "white" : "#43A047", background: (detail as any).user.role === "user" ? "#43A047" : "white" }}>
                    Usuário
                  </button>
                  <button
                    onClick={() => setRoleMutation.mutate({ userId: selectedUser, role: "admin" })}
                    disabled={(detail as any).user.role === "admin" || setRoleMutation.isPending}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-40"
                    style={{ borderColor: "#1B5E20", color: (detail as any).user.role === "admin" ? "white" : "#1B5E20", background: (detail as any).user.role === "admin" ? "#1B5E20" : "white" }}>
                    Admin
                  </button>
                </div>
              </div>
            </div>
            {(detail as any).payments?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">Pagamentos</p>
                <div className="space-y-2">
                  {(detail as any).payments.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.status === "completed" ? "bg-[#E8F5E9] text-[#1B5E20]" : p.status === "failed" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"}`}>
                        {p.status === "completed" ? "Pago" : p.status === "failed" ? "Falhou" : "Pendente"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
