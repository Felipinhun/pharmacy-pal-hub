import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { PrescriberForm } from "@/components/visitadora/PrescriberForm";
import { PrescriberMap } from "@/components/visitadora/PrescriberMap";
import { GamificationPanel } from "@/components/visitadora/GamificationPanel";
import { VisitCheckin } from "@/components/visitadora/VisitCheckin";
import { Users, Calendar, TrendingUp, MapPin, ClipboardCheck } from "lucide-react";

type TabType = "dashboard" | "cadastro" | "checkin" | "mapa" | "gamificacao";

export function VisitadoraDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [prescriberCount, setPrescriberCount] = useState(0);
  const [pendingVisits, setPendingVisits] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [prescribers, setPrescribers] = useState<Array<{
    id: string;
    full_name: string;
    specialty: string | null;
    partnership_potential: string | null;
    latitude: number | null;
    longitude: number | null;
  }>>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [prescRes, visitRes, salesRes] = await Promise.all([
      supabase.from("prescribers").select("id, full_name, specialty, partnership_potential, latitude, longitude").eq("visitadora_id", user.id),
      supabase.from("visits").select("id").eq("visitadora_id", user.id).eq("status", "pendente"),
      supabase.from("sales").select("amount, prescriber_id").not("prescriber_id", "is", null),
    ]);

    if (prescRes.data) {
      setPrescribers(prescRes.data);
      setPrescriberCount(prescRes.data.length);
    }
    if (visitRes.data) setPendingVisits(visitRes.data.length);

    // Calculate sales from prescribers linked to this visitadora
    if (salesRes.data && prescRes.data) {
      const prescriberIds = new Set(prescRes.data.map((p) => p.id));
      const total = salesRes.data
        .filter((s) => s.prescriber_id && prescriberIds.has(s.prescriber_id))
        .reduce((acc, s) => acc + Number(s.amount), 0);
      setTotalSales(total);
    }
  };

  const tabs: { key: TabType; label: string; icon: typeof Users }[] = [
    { key: "dashboard", label: "Dashboard", icon: TrendingUp },
    { key: "cadastro", label: "Cadastrar Prescritor", icon: Users },
    { key: "checkin", label: "Registro de Visita", icon: ClipboardCheck },
    { key: "mapa", label: "Mapa", icon: MapPin },
    { key: "gamificacao", label: "Gamificação", icon: Calendar },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Painel da Visitadora</h1>
        <p className="text-muted-foreground">Gerencie seus prescritores e acompanhe seus resultados</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Prescritores" value={prescriberCount} icon={Users} description="cadastrados" />
            <StatCard title="Visitas Pendentes" value={pendingVisits} icon={Calendar} trend={pendingVisits > 0 ? "up" : "neutral"} />
            <StatCard
              title="Vendas Geradas"
              value={`R$ ${totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
            />
          </div>

          {/* Pending visits list */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Visitas do Dia</h3>
            <VisitsList userId={user?.id} />
          </div>
        </div>
      )}

      {activeTab === "cadastro" && (
        <PrescriberForm onSuccess={loadData} />
      )}

      {activeTab === "checkin" && <VisitCheckin />}

      {activeTab === "mapa" && <PrescriberMap prescribers={prescribers} />}

      {activeTab === "gamificacao" && <GamificationPanel />}
    </div>
  );
}

function VisitsList({ userId }: { userId?: string }) {
  const [visits, setVisits] = useState<Array<{
    id: string;
    visit_date: string;
    notes: string | null;
    status: string;
    prescribers: { full_name: string } | null;
  }>>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("visits")
      .select("id, visit_date, notes, status, prescribers(full_name)")
      .eq("visitadora_id", userId)
      .order("visit_date", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        if (data) setVisits(data as typeof visits);
      });
  }, [userId]);

  if (visits.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma visita pendente para hoje.</p>;
  }

  return (
    <div className="space-y-2">
      {visits.map((visit) => (
        <div key={visit.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <div>
            <p className="font-medium text-foreground">{(visit.prescribers as { full_name: string } | null)?.full_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{visit.visit_date}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              visit.status === "concluida"
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            }`}
          >
            {visit.status === "concluida" ? "Concluída" : "Pendente"}
          </span>
        </div>
      ))}
    </div>
  );
}