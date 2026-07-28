import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { data: messages, refetch } = trpc.profile.getSupportMessages.useQuery(undefined, { enabled: isAuthenticated && open });
  const { data: unreadCount } = trpc.profile.getUnreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30000 });
  const sendMutation = trpc.profile.sendSupportMessage.useMutation({
    onSuccess: () => { setMessage(""); refetch(); },
    onError: () => toast.error("Erro ao enviar mensagem"),
  });

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: "420px" }}>
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "linear-gradient(135deg,#1B5E20,#43A047)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Suporte NutriX</p>
                <p className="text-[10px] opacity-80">Resposta em até 24h</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {!messages || messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500">Olá! Como podemos ajudar?</p>
                <p className="text-xs text-gray-400 mt-1">Envie sua mensagem abaixo 👇</p>
              </div>
            ) : (
              messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.isFromSupport ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${msg.isFromSupport ? "bg-white text-gray-800 shadow-sm" : "text-white"}`}
                    style={!msg.isFromSupport ? { background: "#1B5E20" } : {}}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && message.trim()) sendMutation.mutate({ message: message.trim() }); }}
              placeholder="Digite sua mensagem..."
              className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#43A047]"
            />
            <button
              onClick={() => { if (message.trim()) sendMutation.mutate({ message: message.trim() }); }}
              disabled={!message.trim() || sendMutation.isPending}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition"
              style={{ background: "#1B5E20" }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white relative transition active:scale-95"
        style={{ background: open ? "#E53935" : "linear-gradient(135deg,#1B5E20,#43A047)" }}>
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && (unreadCount ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

