import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { trackInitiateCheckout, trackPurchase } from "@/lib/tracking";
import { CreditCard, QrCode, Check, ShieldCheck, Loader2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

// Modo teste: quando ligado (VITE_MODO_TESTE=1) esconde o pagamento e libera a dieta direto.
const MODO_TESTE = import.meta.env.VITE_MODO_TESTE === "1" || import.meta.env.VITE_MODO_TESTE === "true";

export default function Pagamento() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [metodo, setMetodo] = useState<"cartao" | "pix">("cartao");
  const [pix, setPix] = useState<any>(null);
  const [sucesso, setSucesso] = useState<any>(null);

  const criarPix = trpc.payment.criarPix.useMutation();
  const criarAssinatura = trpc.payment.criarAssinatura.useMutation();
  const simular = trpc.payment.simularAprovacao.useMutation();

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/login"); }, [loading, isAuthenticated, navigate]);
  // Início do checkout (rastreamento de tráfego pago).
  useEffect(() => { trackInitiateCheckout(); }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F8F7" }}><Loader2 className="w-8 h-8 animate-spin text-[#43A047]" /></div>;
  if (!isAuthenticated) return null;

  async function liberar() {
    try {
      const r = await simular.mutateAsync();
      trackPurchase(); // conversão (compra/assinatura)
      if (r.entrega) setSucesso(r.entrega);
      else navigate("/dietas"); // pago, mas a entrega falhou → segue pro app
    } catch (e) {
      toast.error((e as Error)?.message ?? "Não foi possível liberar agora. Tente novamente.");
    }
  }

  async function assinarCartao() {
    try {
      const a = await criarAssinatura.mutateAsync();
      if (!a.simulado && a.url) {
        // Vai para a página SEGURA do Mercado Pago (o cartão é digitado lá).
        window.location.href = a.url;
        return;
      }
      // Sem chave (simulação): libera e entrega direto.
      await liberar();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function gerarPix() {
    try { setPix(await criarPix.mutateAsync()); } catch (e) { toast.error((e as Error).message); }
  }

  async function copiarPix() {
    const code = (pix?.copiaECola ?? "") as string;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código Pix copiado! Cole no seu banco em 'Pix Copia e Cola'.");
    } catch {
      // Fallback p/ navegadores que bloqueiam a área de transferência.
      const ta = document.createElement("textarea");
      ta.value = code; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand("copy"); toast.success("Código Pix copiado!"); }
      catch { toast.error("Não consegui copiar automaticamente — segure no código e copie."); }
      document.body.removeChild(ta);
    }
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

        {MODO_TESTE ? (
          /* MODO TESTE — sem pagamento, libera direto */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 text-center">
            <div className="flex items-start gap-2 p-3 rounded-xl text-left" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <ShieldCheck size={18} style={{ color: "#2563EB" }} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: "#1E40AF" }}>
                <b>Ambiente de teste.</b> O pagamento está desativado nesta fase. Clique abaixo para liberar sua dieta e testar a entrega por e-mail/WhatsApp.
              </p>
            </div>
            <button onClick={liberar} disabled={simular.isPending}
              className="w-full py-4 rounded-xl font-bold text-white text-base disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "#166534" }}>
              {simular.isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {simular.isPending ? "Liberando..." : "Acessar minha dieta (modo teste)"}
            </button>
          </div>
        ) : (
        <>
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
              <p className="text-xs" style={{ color: "#9A3412" }}>Você vai para a página <b>segura do Mercado Pago</b> para informar o cartão e ativar a <b>assinatura mensal</b> de R$ 9,99 (cobrança automática todo mês). Cancele quando quiser.</p>
            </div>
            <button onClick={assinarCartao} disabled={criarAssinatura.isPending}
              className="w-full py-4 rounded-xl font-bold text-white text-base disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "#166534" }}>
              {criarAssinatura.isPending ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              {criarAssinatura.isPending ? "Abrindo..." : "Assinar · R$ 9,99/mês"}
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
                {pix.qrBase64 && (
                  <div className="text-center">
                    <img src={`data:image/png;base64,${pix.qrBase64}`} alt="QR Code Pix" className="w-52 h-52 mx-auto rounded-lg" />
                    <p className="text-xs text-gray-400 mt-1">Escaneie o QR no app do seu banco</p>
                  </div>
                )}
                <p className="text-sm text-gray-500 text-center">ou copie o código Pix:</p>
                <div className="p-3 rounded-xl text-[11px] break-all text-gray-500" style={{ background: "#F7F8F7", border: "1px solid #e2e8e4" }}>
                  {pix.copiaECola}
                </div>
                <button onClick={copiarPix}
                  className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2" style={{ background: "#00A868" }}>
                  <Check size={16} /> Copiar código Pix
                </button>
                <p className="text-center text-[11px] text-gray-400">No seu banco, escolha <b>“Pix Copia e Cola”</b> e cole o código.</p>
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
        </>
        )}
      </div>
    </div>
  );
}

function Sucesso({ entrega, onContinue }: { entrega: any; onContinue: () => void }) {
  const emailOk = entrega?.email?.ok;
  const simulado = entrega?.email?.simulado;
  const negocio = (import.meta.env.VITE_WHATSAPP_NEGOCIO ?? "").replace(/\D/g, "");
  const waLink = negocio
    ? `https://wa.me/${negocio}?text=${encodeURIComponent("Oi! Acabei de assinar e quero receber minha dieta NutriX 🥗")}`
    : null;
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F7F8F7" }}>
      <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "#DCFCE7" }}>
          <Check size={32} style={{ color: "#166534" }} />
        </div>
        <h2 className="text-xl font-black" style={{ color: "#166534" }}>Pagamento aprovado! 🎉</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">Sua dieta está liberada. Veja como recebê-la:</p>

        <div className="flex items-center gap-3 p-3 rounded-xl text-left mb-3" style={{ background: "#F7F8F7" }}>
          <Mail size={18} style={{ color: emailOk ? "#166534" : "#9CA3AF" }} />
          <span className="text-sm text-gray-700 flex-1">
            Enviada no e-mail{entrega?.email?.destino ? ` · ${entrega.email.destino}` : ""}
          </span>
          {emailOk && <Check size={16} style={{ color: "#166534" }} />}
        </div>

        {/* Caminho B: o cliente inicia a conversa no WhatsApp para receber o PDF */}
        <a href={waLink ?? "#"} target="_blank" rel="noopener noreferrer"
          onClick={(e) => { if (!waLink) { e.preventDefault(); toast.info("WhatsApp do negócio ainda não configurado."); } }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white"
          style={{ background: "#25D366" }}>
          <MessageCircle size={18} /> Receber no WhatsApp
        </a>
        <p className="text-[11px] text-gray-400 mt-2">Toque acima e envie a mensagem — respondemos com o PDF da sua dieta.</p>

        {simulado && <p className="text-[11px] text-gray-400 mt-2">(E-mail em modo simulação — configure as chaves para enviar de verdade.)</p>}
        <button onClick={onContinue} className="w-full mt-5 py-3.5 rounded-xl font-bold text-white" style={{ background: "#166534" }}>
          Ver minha dieta
        </button>
      </div>
    </div>
  );
}
