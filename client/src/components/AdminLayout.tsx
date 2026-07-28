import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LogOut,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/admin",             icon: LayoutDashboard, label: "Dashboard"   },
  { href: "/admin/usuarios",    icon: Users,           label: "Usuários"    },
  { href: "/admin/pagamentos",  icon: CreditCard,      label: "Pagamentos"  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex bg-[#F3F4F6]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1B5E20] text-white flex flex-col shadow-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <img src="/manus-storage/nutrix-logo-new_2a35045d.jpeg" alt="NutriX" className="h-10 w-10 rounded-full object-cover border-2 border-white/30" />
          <div>
            <p className="font-extrabold text-lg leading-tight">
              Nutri<span className="text-[#E53935]">X</span>
            </p>
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Painel Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <a className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${active ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Divider + link para área do usuário */}
        <div className="px-3 pb-2">
          <Link href="/home">
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
              <span className="text-base">🏠</span>
              Área do Usuário
            </a>
          </Link>
        </div>

        {/* User info + logout */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name ?? "Admin"}</p>
              <p className="text-[10px] text-white/50 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

