import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from "lucide-react";

type StatusFilter = "all" | "completed" | "pending" | "failed";

export default function AdminPagamentos() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");

  const { data, isLoading } = trpc.admin.listPayments.useQuery({
    page, limit: 20, status: status === "all" ? undefined : status,
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    completed: { label: "Pago", icon: <CheckCircle size={13} />, cls: "bg-[#E8F5E9] text-[#1B5E20]" },
    pending: { label: "Pendente", icon: <Clock size={13} />, cls: "bg-yellow-50 text-yellow-700" },
    failed: { label: "Falhou", icon: <XCircle size={13} />, cls: "bg-red-50 text-red-600" },
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-montserrat text-2xl font-black text-gray-800">Pagamentos</h1>
        <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} transações encontradas</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "completed", "pending", "failed"] as StatusFilter[]).map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition border ${status === s ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
            style={status === s ? { background: s === "completed" ? "#43A047" : s === "failed" ? "#E53935" : s === "pending" ? "#F59E0B" : "#1F2937" } : {}}>
            {s === "all" ? "Todos" : s === "completed" ? "Concluídos" : s === "pending" ? "Pendentes" : "Falhou"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuário</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Plano</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Data</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">ID Stripe</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data?.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                  Nenhum pagamento encontrado
                </td>
              </tr>
            ) : data?.rows.map((p: any) => {
              const cfg = statusConfig[p.status] ?? statusConfig.pending;
              return (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800 leading-tight">{p.userName ?? "—"}</p>
                      <p className="text-xs text-gray-400">{p.userEmail ?? "—"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                      {cfg.icon}{cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-600 capitalize">{p.planType ?? "básico"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-400 font-mono truncate max-w-[120px] block">
                      {p.stripePaymentIntentId ?? "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
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
    </div>
  );
}
