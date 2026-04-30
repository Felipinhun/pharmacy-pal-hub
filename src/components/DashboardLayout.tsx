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
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">💊 FarmaGestão</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:static`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-6">
          <span className="text-xl font-bold text-primary">💊</span>
          <span className="text-lg font-bold text-foreground">FarmaGestão</span>
        </div>

        <div className="p-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <RoleIcon className={`h-5 w-5 ${config?.color}`} />
              <div>
                <p className="text-sm font-semibold text-foreground">{config?.label}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {role && (
            <Link
              to={`/${role}` as "/visitadora"}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Link>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 pt-14 md:pt-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}