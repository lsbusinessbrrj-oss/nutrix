import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toast } = useToast();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { navigate("/login"); },
  });

  if (!isAuthenticated) return null;

  const links = [
    { href: "/home", label: "Home" },
    { href: "/dietas", label: "Dietas" },
    { href: "/perfil", label: "Perfil" },
  ];
  const isAdmin = user?.role === "admin";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/home" className="flex items-center gap-2">
          <img src="/nutrix-logo.jpeg" alt="NutriX" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-montserrat font-800 text-lg" style={{ color: "#1B5E20" }}>
            Nutri<span style={{ color: "#E53935" }}>X</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${location === l.href ? "text-[#1B5E20] border-b-2 border-[#43A047] pb-0.5" : "text-gray-600 hover:text-[#1B5E20]"}`}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${location.startsWith("/admin") ? "text-[#1B5E20] border-b-2 border-[#43A047] pb-0.5" : "text-gray-600 hover:text-[#1B5E20]"}`}>
              <ShieldCheck size={15} /> Admin
            </Link>
          )}
          <button
            onClick={() => logoutMutation.mutate()}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-3">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className={`text-sm font-medium ${location === l.href ? "text-[#1B5E20]" : "text-gray-600"}`}>
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-1.5 text-sm font-medium ${location.startsWith("/admin") ? "text-[#1B5E20]" : "text-gray-600"}`}>
              <ShieldCheck size={15} /> Admin
            </Link>
          )}
          <button onClick={() => logoutMutation.mutate()} className="text-sm text-red-600 text-left">Sair</button>
        </div>
      )}
    </nav>
  );
}
