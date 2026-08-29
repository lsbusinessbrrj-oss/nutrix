import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { CreditCard, QrCode, Check, ShieldCheck, Loader2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function Pagamento() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [metodo, setMetodo] = useState<"cartao" | "pix">("cartao");
  const [pix, setPix] = useState<any>(null);
  const [sucesso, setSucesso] = useState<any>(null);
  const [card, setCard] = useState({ numero: "", nome: "", validade: "", cvv: "" });

  const criarPix = trpc.payment.criarPix.useMutation();
  const simular = trpc.payment.simularAprovacao.useMutation();

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/login"); }, [loading, isAuthenticated, navigate]);
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F8F7" }}><Loader2 className="w-8 h-8 animate-spin text-[#43A047]" /></div>;
  if (!isAuthenticated) return null;

  async function liberar() {
    const r = await simular.mutateAsync();
    setSucesso(r.entrega);
  }

  async function assinarCartao() {
    const numeros = card.numero.replace(/\D/g, "");
    if (numeros.length < 13 || !card.nome || card.validade.length < 4 || card.cvv.length < 3) {
      toast.error("Preencha os dados do cartão.");
      return;
    }
    try { await liberar(); } catch (e) { toast.error((e as Error).message); }
  }

  async function gerarPix() {
    try { setPix(await criarPix.mutateAsync()); } catch (e) { toast.error((e as Error).message); }
  }

  if (sucesso) return <Sucesso entrega={sucesso} onContinue={() => navigate("/dietas")} />;

  return (
    <div className="min-h-screen" style={{ background: "#F7F8F7" }}>
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Plano */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500">Sua dieta está pronta! Ative o plano para liberar.</p>
          <div className="mt-3">
            <span className="text-4xl font-black" style={{ color: "#166534" }}>R$ 9,99</span>
            <span className="text-gray-500">/mês</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Assinatura mensal · cancele quando quiser</p>
        </div>

        {/* Método */}
        <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {([["cartao", "Cartão", CreditCard], ["pix", "Pix", QrCode]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setMetodo(id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
              style={metodo === id ? { background: "#166534", color: "white" } : { background: "transparent", color: "#9CA3AF" }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {metodo === "cartao" ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-xl mb-1" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
              <ShieldCheck size={18} style={{ color: "#EA580C" }} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: "#9A3412" }}>Ao cadastrar o cartão, você ativa a <b>assinatura mensal</b> de R$ 9,99 (cobrança automática todo mês). Cancele quando quiser.</p>
            </div>
            <Campo label="Número do cartão" value={card.numero} onChange={(v) => setCard({ ...card, numero: v.replace(/[^\d ]/g, "") })} placeholder="0000 0000 0000 0000" />
            <Campo label="Nome no cartão" value={card.nome} onChange={(v) => setCard({ ...card, nome: v.toUpperCase() })} placeholder="COMO ESTÁ NO CARTÃO" />
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Validade" value={card.validade} onChange={(v) => setCard({ ...card, validade: v.replace(/[^\d/]/g, "") })} placeholder="MM/AA" />
              <Campo label="CVV" value={card.cvv} onChange={(v) => setCard({ ...card, cvv: v.replace(/\D/g, "") })} placeholder="123" />
            </div>
            <button onClick={assinarCartao} disabled={simular.isPending}
              className="w-full py-4 rounded-xl font-bold text-white text-base disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "#166534" }}>
              {simular.isPending ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              {simular.isPending ? "Ativando..." : "Ativar assinatura · R$ 9,99/mês"}
            </button>
            <p className="text-center text-[11px] text-gray-400">🔒 Pagamento processado pelo Mercado Pago</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            {!pix ? (
              <button onClick={gerarPix} disabled={criarPix.isPending}
                className="w-full py-4 rounded-xl font-bold text-white text-base disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "#00A868" }}>
                {criarPix.isPending ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                Gerar Pix de R$ 9,99
              </button>
            ) : (
              <>
                <p className="text-sm text-gray-500 text-center">Pague com o Pix copia-e-cola:</p>
                <div className="p-3 rounded-xl text-[11px] break-all text-gray-500" style={{ background: "#F7F8F7", border: "1px solid #e2e8e4" }}>
                  {pix.copiaECola}
                </div>
                <button onClick={() => { navigator.clipboard?.writeText(pix.copiaECola); toast.success("Código Pix copiado!"); }}
                  className="w-full py-3 rounded-xl font-bold text-white" style={{ background: "#00A868" }}>Copiar código Pix</button>
                {pix.simulado && (
                  <button onClick={liberar} disabled={simular.isPending}
                    className="w-full py-3 rounded-xl font-bold border-2 disabled:opacity-60" style={{ borderColor: "#166534", color: "#166534" }}>
                    {simular.isPending ? "Confirmando..." : "Simular pagamento aprovado (teste)"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Simular (teste) para o cartão também */}
        {metodo === "cartao" && (
          <button onClick={liberar} disabled={simular.isPending}
            className="w-full text-xs text-gray-400 underline">
            Simular pagamento aprovado (teste)
          </button>
        )}
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#43A047]" />
    </div>
  );
}

function Sucesso({ entrega, onContinue }: { entrega: any; onContinue: () => void }) {
  const emailOk = entrega?.email?.ok;
  const waOk = entrega?.whatsapp?.ok;
  const simulado = entrega?.email?.simulado || entrega?.whatsapp?.simulado;
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F7F8F7" }}>
      <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "#DCFCE7" }}>
          <Check size={32} style={{ color: "#166534" }} />
        </div>
        <h2 className="text-xl font-black" style={{ color: "#166534" }}>Pagamento aprovado! 🎉</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">Sua dieta foi liberada e enviada:</p>
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F7F8F7" }}>
            <Mail size={18} style={{ color: emailOk ? "#166534" : "#9CA3AF" }} />
            <span className="text-sm text-gray-700 flex-1">E-mail {entrega?.email?.destino ? `· ${entrega.email.destino}` : ""}</span>
            {emailOk && <Check size={16} style={{ color: "#166534" }} />}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F7F8F7" }}>
            <MessageCircle size={18} style={{ color: waOk ? "#166534" : "#9CA3AF" }} />
            <span className="text-sm text-gray-700 flex-1">WhatsApp {entrega?.whatsapp?.destino ? `· ${entrega.whatsapp.destino}` : ""}</span>
            {waOk && <Check size={16} style={{ color: "#166534" }} />}
          </div>
        </div>
        {simulado && <p className="text-[11px] text-gray-400 mt-3">(Envio simulado — configure as chaves para enviar de verdade.)</p>}
        <button onClick={onContinue} className="w-full mt-6 py-3.5 rounded-xl font-bold text-white" style={{ background: "#166534" }}>
          Ver minha dieta
        </button>
      </div>
    </div>
  );
}
