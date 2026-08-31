import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { LogOut, User, Settings, Image as ImageIcon, ShieldCheck, Trash2, Home, Utensils } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => navigate("/login") });
  const excluir = trpc.auth.excluirConta.useMutation();

  if (!isAuthenticated) return null;

  const u = user as any;
  const isAdmin = u?.role === "admin";
  const nome: string = u?.name || (u?.email ? u.email.split("@")[0] : "Cliente");
  const iniciais = nome.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();

  const links = [
    { href: "/home", label: "Início", icon: Home },
    { href: "/dietas", label: "Dietas", icon: Utensils },
    { href: "/perfil", label: "Perfil", icon: User },
  ];

  async function encerrarConta() {
    if (!window.confirm("ENCERRAR CONTA: isso cancela a assinatura e apaga TODOS os seus dados permanentemente. Não pode ser desfeito. Confirmar?")) return;
    try {
      await excluir.mutateAsync();
      await utils.auth.me.invalidate();
      toast.success("Conta encerrada.");
      navigate("/login");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/home" className="flex items-center gap-2">
          <img src="/nutrix-logo.jpeg" alt="NutriX" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-montserrat font-800 text-lg" style={{ color: "#1B5E20" }}>
            Nutri<span style={{ color: "#E53935" }}>X</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {/* Links rápidos (desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`text-sm font-medium transition-colors ${location === l.href ? "text-[#1B5E20] border-b-2 border-[#43A047] pb-0.5" : "text-gray-600 hover:text-[#1B5E20]"}`}>
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${location.startsWith("/admin") ? "text-[#1B5E20] border-b-2 border-[#43A047] pb-0.5" : "text-gray-600 hover:text-[#1B5E20]"}`}>
                <ShieldCheck size={15} /> Admin
              </Link>
            )}
          </div>

          {/* Menu do usuário (avatar) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none focus:ring-2 focus:ring-[#43A047]/40">
              <Avatar className="h-9 w-9 border border-gray-200">
                {u?.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={nome} /> : null}
                <AvatarFallback className="bg-[#E8F5E9] text-[#1B5E20] font-bold text-sm">{iniciais}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="flex items-center gap-3 py-3">
                <Avatar className="h-10 w-10">
                  {u?.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={nome} /> : null}
                  <AvatarFallback className="bg-[#E8F5E9] text-[#1B5E20] font-bold">{iniciais}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{nome}</p>
                  <p className="text-xs text-gray-400 truncate">{u?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Navegação (aparece também no mobile) */}
              <div className="md:hidden">
                {links.map(l => (
                  <DropdownMenuItem key={l.href} onClick={() => navigate(l.href)} className="gap-2">
                    <l.icon size={16} className="text-gray-500" /> {l.label}
                  </DropdownMenuItem>
                ))}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2">
                    <ShieldCheck size={16} className="text-gray-500" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </div>

              <DropdownMenuItem onClick={() => navigate("/perfil")} className="gap-2">
                <User size={16} className="text-gray-500" /> Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/perfil?s=foto")} className="gap-2">
                <ImageIcon size={16} className="text-gray-500" /> Personalizar / foto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/perfil?s=config")} className="gap-2">
                <Settings size={16} className="text-gray-500" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="gap-2">
                <LogOut size={16} className="text-gray-500" /> Sair
              </DropdownMenuItem>
              <DropdownMenuItem onClick={encerrarConta} className="gap-2 text-red-600 focus:text-red-600">
                <Trash2 size={16} /> Encerrar conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
