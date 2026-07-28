import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#F3F4F6" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/manus-storage/nutrix-logo-new_2a35045d.jpeg" alt="NutriX" className="h-16 w-16 rounded-full object-cover mb-3 shadow" />
          <h1 className="font-montserrat text-xl font-bold" style={{ color: "#1B5E20" }}>Recuperar senha</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">Digite seu email para receber o link de recuperação</p>
        </div>
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#E8F5E9" }}>
              <Mail size={24} style={{ color: "#43A047" }} />
            </div>
            <p className="text-sm text-gray-700 font-medium">Email enviado!</p>
            <p className="text-xs text-gray-500 mt-1">Verifique sua caixa de entrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#43A047]" />
            <button
              onClick={() => { if (!email) { toast.error("Digite seu email."); return; } setSent(true); toast.success("Email de recuperação enviado!"); }}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: "#1B5E20" }}
            >
              Enviar link de recuperação
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

