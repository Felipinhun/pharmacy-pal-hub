import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { PrescriberForm } from "@/components/visitadora/PrescriberForm";
import { PrescriberMap } from "@/components/visitadora/PrescriberMap";
import { GamificationPanel } from "@/components/visitadora/GamificationPanel";
import { VisitCheckin } from "@/components/visitadora/VisitCheckin";
import { AgendaPanel } from "@/components/visitadora/AgendaPanel";
import { Users, Calendar, TrendingUp, MapPin, ClipboardCheck, CalendarDays } from "lucide-react";

type TabType = "dashboard" | "agenda" | "cadastro" | "checkin" | "mapa" | "gamificacao";

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
    { key: "dashboard", label: "Overview", icon: TrendingUp },
    { key: "agenda", label: "Schedule", icon: CalendarDays },
    { key: "cadastro", label: "New Prescriber", icon: Users },
    { key: "checkin", label: "Visit Logs", icon: ClipboardCheck },
    { key: "mapa", label: "Atlas", icon: MapPin },
    { key: "gamificacao", label: "Pulse", icon: Calendar },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-foreground">
            Visitadora <span className="font-semibold text-primary">Intelligence</span>
          </h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            BIO AUREA PROFESSIONAL SUITE
          </p>
        </div>
        <div className="flex bg-white/40 p-1 rounded-2xl border border-white/20 backdrop-blur-sm self-start">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-white/50"
              }`}
            >
              <tab.icon className={`h-3.5 w-3.5 ${activeTab === tab.key ? "text-primary" : ""}`} />
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Prescribers" value={prescriberCount} icon={Users} description="Active in your network" />
            <StatCard title="Awaiting Visits" value={pendingVisits} icon={Calendar} trend={pendingVisits > 0 ? "up" : "neutral"} />
            <StatCard
              title="Revenue Generated"
              value={`R$ ${totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
              icon={TrendingUp}
              trend="up"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-white bg-white/40 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-light text-foreground">Daily <span className="font-semibold">Schedule</span></h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mt-1">Pending actions for today</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CalendarDays className="h-6 w-6" />
                </div>
              </div>
              <VisitsList userId={user?.id} />
            </div>
            
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white bg-secondary p-8 text-white shadow-2xl shadow-primary/20">
               <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
               <div className="relative">
                  <h3 className="text-2xl font-light">Network <span className="font-semibold italic">Density</span></h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mt-1">Geographic footprint</p>
                  
                  <div className="mt-8 flex flex-col gap-6">
                    <div className="h-32 w-full rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center italic text-white/30 text-xs">
                      Map preview optimized for professional analysis
                    </div>
                    <button 
                      onClick={() => setActiveTab('mapa')}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-xl shadow-primary/20 transition-transform active:scale-95"
                    >
                      Open Global Atlas <MapPin className="h-4 w-4" />
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "cadastro" && (
        <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
           <PrescriberForm onSuccess={loadData} />
        </div>
      )}

      {activeTab === "agenda" && <div className="animate-in fade-in duration-500"><AgendaPanel /></div>}
      {activeTab === "checkin" && <div className="animate-in fade-in duration-500"><VisitCheckin /></div>}
      {activeTab === "mapa" && <div className="animate-in fade-in duration-500"><PrescriberMap prescribers={prescribers} /></div>}
      {activeTab === "gamificacao" && <div className="animate-in fade-in duration-500"><GamificationPanel /></div>}
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