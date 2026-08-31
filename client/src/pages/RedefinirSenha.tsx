import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function RedefinirSenha() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [show, setShow] = useState(false);
  const [ok, setOk] = useState(false);
  const redefinir = trpc.auth.redefinirSenha.useMutation();
  const utils = trpc.useUtils();

  const salvar = async () => {
    if (senha.length < 6) { toast.error("A senha precisa ter ao menos 6 caracteres."); return; }
    if (senha !== confirma) { toast.error("As senhas não conferem."); return; }
    try {
      await redefinir.mutateAsync({ token, novaSenha: senha });
      await utils.auth.me.invalidate();
      setOk(true);
      setTimeout(() => navigate("/home"), 1600);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Não foi possível redefinir a senha.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#F3F4F6" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/nutrix-logo.jpeg" alt="NutriX" className="h-16 w-16 rounded-full object-cover mb-3 shadow" />
          <h1 className="font-montserrat text-xl font-bold" style={{ color: "#1B5E20" }}>Criar nova senha</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">Escolha uma senha nova para sua conta NutriX</p>
        </div>

        {!token ? (
          <p className="text-sm text-center text-red-600">Link inválido. Abra o link direto do e-mail que você recebeu.</p>
        ) : ok ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#E8F5E9" }}>
              <CheckCircle2 size={26} style={{ color: "#43A047" }} />
            </div>
            <p className="text-sm text-gray-700 font-medium">Senha alterada com sucesso!</p>
            <p className="text-xs text-gray-500 mt-1">Redirecionando…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <input type={show ? "text" : "password"} placeholder="Nova senha" value={senha} onChange={e => setSenha(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#43A047] pr-10" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-gray-400">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <input type={show ? "text" : "password"} placeholder="Confirmar nova senha" value={confirma} onChange={e => setConfirma(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") salvar(); }}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#43A047]" />
            <button
              onClick={salvar}
              disabled={redefinir.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#1B5E20" }}
            >
              {redefinir.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {redefinir.isPending ? "Salvando..." : "Salvar nova senha"}
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
