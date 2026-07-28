import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface Props {
  component: React.ComponentType;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ component: Component, adminOnly = false }: Props) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      startLogin();
    }
    if (!loading && isAuthenticated && adminOnly && user?.role !== "admin") {
      navigate("/home");
    }
  }, [loading, isAuthenticated, adminOnly, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="flex flex-col items-center gap-3">
          <img src="/manus-storage/nutrix-logo-new_2a35045d.jpeg" alt="NutriX" className="w-16 h-16 rounded-full object-cover shadow" />
          <Loader2 className="w-6 h-6 animate-spin text-[#43A047]" />
          <span className="text-sm text-gray-500">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (adminOnly && user?.role !== "admin") return null;

  return <Component />;
}

