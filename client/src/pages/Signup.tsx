import { useState } from "react";
import { Link, useLocation } from "wouter";
import { startLogin } from "@/const";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [terms, setTerms] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#F3F4F6" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/manus-storage/nutrix-logo-new_2a35045d.jpeg" alt="NutriX" className="h-20 w-20 rounded-full object-cover mb-3 shadow" />
          <h1 className="font-montserrat text-2xl font-bold" style={{ color: "#1B5E20" }}>Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1">Comece sua jornada NutriX</p>
        </div>

        <button
          onClick={() => startLogin()}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/></svg>
          Continuar com Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#43A047]" />
          <input type="tel" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#43A047]" />
          <div className="relative">
            <input type={showPass ? "text" : "password"} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#43A047] pr-10" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5 accent-[#43A047]" />
            <span className="text-xs text-gray-600">
              Eu aceito os{" "}
              <a href="#" className="text-[#43A047] underline">Termos e Condições</a>{" "}
              e a{" "}
              <a href="#" className="text-[#43A047] underline">Política de Privacidade</a>
            </span>
          </label>
          <button
            onClick={() => { if (!terms) { toast.error("Aceite os termos para continuar."); return; } startLogin(); }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition active:scale-[0.97]"
            style={{ background: "#1B5E20" }}
          >
            <UserPlus size={16} /> Criar conta
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-5">
          Já tem conta?{" "}
          <Link href="/login" className="text-[#43A047] font-semibold hover:underline">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}

