import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import {
  LogOut,
  Menu,
  X,
  MapPin,
  Users,
  BarChart3,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";

const roleConfig: Record<AppRole, { label: string; icon: typeof Users; color: string }> = {
  visitadora: { label: "Visitadora", icon: MapPin, color: "text-primary" },
  prescritor: { label: "Prescritor", icon: Stethoscope, color: "text-accent" },
  atendente: { label: "Atendente", icon: ClipboardList, color: "text-success" },
  admin: { label: "Admin", icon: ShieldCheck, color: "text-warning" },
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const config = role ? roleConfig[role] : null;
  const RoleIcon = config?.icon ?? Users;

  const handleSignOut = async () => {
    try {
      await signOut();
      // Use window.location as a fallback to ensure total state reset
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
      // Even if error, try to force redirect
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="flex min-h-screen bg-background selection:bg-primary/30">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-secondary/95 backdrop-blur-md px-6 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1">
            <img 
              src="https://s3.bioaurea.cloud/logoeimagens/IMG_6940.PNG" 
              alt="Logo Bio Aurea" 
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Bio Aurea</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-full p-2 text-white/80 hover:bg-white/10 transition-colors"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-border bg-secondary shadow-2xl transition-all duration-300 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:static overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          <div className="flex h-28 items-center gap-3 px-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-xl transition-all hover:scale-105">
              <img 
                src="https://s3.bioaurea.cloud/logoeimagens/IMG_6940.PNG" 
                alt="Logo Bio Aurea" 
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white leading-none">Bio Aurea</span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary-foreground/70">Central Lab</span>
            </div>
          </div>

          <div className="flex-1 px-4 py-6">
            <div className="mb-8 rounded-[1.5rem] bg-white/10 p-5 border border-white/10 backdrop-blur-md shadow-inner">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-white/15 ${config?.color}`}>
                  <RoleIcon className="h-6 w-6 brightness-125" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white tracking-wide uppercase">{config?.label}</p>
                  <p className="text-[10px] font-medium text-white/50 truncate mt-0.5">{user?.email}</p>
                </div>
              </div>
            </div>

            <nav className="space-y-2">
              {role && (
                <Link
                  to={`/${role}` as "/visitadora"}
                  className="group flex items-center gap-4 rounded-[1.25rem] px-5 py-3.5 text-sm font-bold text-white/80 transition-all hover:bg-white/10 hover:text-white active:scale-[0.97]"
                  activeProps={{ className: "!bg-primary !text-primary-foreground shadow-2xl shadow-primary/30" }}
                  onClick={() => setMobileOpen(false)}
                >
                  <BarChart3 className="h-5 w-5" />
                  Painel de Controle
                </Link>
              )}
            </nav>
          </div>

          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-pink-400 transition-all hover:bg-pink-400/10 active:scale-95"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sair da Conta
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 pt-16 md:pt-0 overflow-auto bg-neutral-50/50">
        <div className="max-w-6xl mx-auto p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}