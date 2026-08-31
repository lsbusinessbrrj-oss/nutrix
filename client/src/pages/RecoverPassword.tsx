import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const solicitar = trpc.auth.solicitarResetSenha.useMutation();

  const enviar = async () => {
    if (!email) { toast.error("Digite seu email."); return; }
    try {
      await solicitar.mutateAsync({ email: email.trim() });
      setSent(true);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Não foi possível enviar o e-mail.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#F3F4F6" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/nutrix-logo.jpeg" alt="NutriX" className="h-16 w-16 rounded-full object-cover mb-3 shadow" />
          <h1 className="font-montserrat text-xl font-bold" style={{ color: "#1B5E20" }}>Recuperar senha</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">Digite seu email para receber o link de recuperação</p>
        </div>
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#E8F5E9" }}>
              <Mail size={24} style={{ color: "#43A047" }} />
            </div>
            <p className="text-sm text-gray-700 font-medium">E-mail enviado!</p>
            <p className="text-xs text-gray-500 mt-1">Se existir uma conta com esse e-mail, você receberá um link para criar uma nova senha. Verifique também o spam.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") enviar(); }}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#43A047]" />
            <button
              onClick={enviar}
              disabled={solicitar.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#1B5E20" }}
            >
              {solicitar.isPending && <Loader2 size={16} className="animate-spin" />}
              {solicitar.isPending ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </div>
        )}
        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-[#43A047] mt-5">
          <ArrowLeft size={14} /> Voltar ao login
        </Link>
      </div>
    </div>
  );
}

