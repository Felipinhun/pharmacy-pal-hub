import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { RankingTable } from "@/components/RankingTable";
import { Users, DollarSign, ShieldCheck, TrendingUp, UserPlus, Eye } from "lucide-react";
import { VisitadoraDashboard } from "@/components/visitadora/VisitadoraDashboard";
import { AtendenteDashboard } from "@/components/atendente/AtendenteDashboard";
import { PrescritorDashboard } from "@/components/prescritor/PrescritorDashboard";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  updateAdminUserRole,
} from "@/server/admin-users.client";

type AdminTab =
  | "overview"
  | "users"
  | "prescribers"
  | "rankings"
  | "sales"
  | "goals"
  | "visits"
  | "simulation";
type SimulatedRole = "visitadora" | "prescritor" | "atendente";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  role: string | null;
}

interface Sale {
  id: string;
  amount: number;
  description: string | null;
  sale_date: string;
  prescriber_id: string | null;
  atendente_id: string | null;
}

interface Prescriber {
  id: string;
  full_name: string;
  specialty: string | null;
  crm_crf: string | null;
  partnership_potential: "baixo" | "medio" | "alto" | null;
  visitadora_id: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  zip_code?: string;
  specialization?: string;
  best_visit_day?: string;
  best_visit_time?: string;
  clinic_name?: string;
  totalSales?: number;
  salesCount?: number;
  visitsCount?: number;
  visitadora_name?: string;
}

interface Visit {
  id: string;
  visit_date: string;
  checkin_at: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  status: string;
  visitadora_id: string;
  prescriber_id: string;
  prescribers: { full_name: string } | null;
  profiles: { full_name: string } | null;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [selectedVisitadoraId, setSelectedVisitadoraId] = useState<string>("all");
  const [simulatedRole, setSimulatedRole] = useState<SimulatedRole>("visitadora");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSales: 0,
    totalPrescribers: 0,
    totalVisits: 0,
  });
  const [prescriberRanking, setPrescriberRanking] = useState<
    Array<{ position: number; name: string; value: string }>
  >([]);
  const [atendenteRanking, setAtendenteRanking] = useState<
    Array<{ position: number; name: string; value: string }>
  >([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [prescribersList, setPrescribersList] = useState<Prescriber[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [adminUsers, profilesRes, salesRes, prescribersRes, visitsRes] = await Promise.all([
        listAdminUsers(),
        supabase.from("profiles").select("id, full_name, email, role"),
        supabase.from("sales").select("*").order("sale_date", { ascending: false }),
        supabase.from("prescribers").select("*"),
        supabase
          .from("visits")
          .select("*, prescribers(full_name)")
          .order("created_at", { ascending: false }),
      ]);

      if (profilesRes.error || salesRes.error || visitsRes.error) {
        console.warn("Alguns dados não puderam ser carregados devido a permissões de RLS:", {
          profiles: profilesRes.error,
          sales: salesRes.error,
          visits: visitsRes.error,
        });
      }

      const profiles = (profilesRes.data ?? []) as Profile[];
      const sales = (salesRes.data ?? []) as Sale[];
      const prescribers = (prescribersRes.data ?? []) as Prescriber[];
      const visitsRaw = (visitsRes.data ?? []) as any[];

      const profileMap: Record<string, string> = {};
      profiles.forEach((p) => {
        profileMap[p.id] = p.full_name;
      });

      // Enrich visits with profiles manually
      const enrichedVisits = visitsRaw.map((v) => ({
        ...v,
        profiles: { full_name: profileMap[v.visitadora_id] ?? "Desconhecida" },
      })) as Visit[];

      // Enrich prescribers with sales and visitadora info
      const enrichedPrescribers = prescribers.map((p) => {
        const prescriberSales = sales.filter((s) => s.prescriber_id === p.id);
        const totalAmount = prescriberSales.reduce((acc, s) => acc + Number(s.amount), 0);
        const prescriberVisits = enrichedVisits.filter((v) => v.prescriber_id === p.id);

        return {
          ...p,
          totalSales: totalAmount,
          salesCount: prescriberSales.length,
          visitsCount: prescriberVisits.length,
          visitadora_name: profileMap[p.visitadora_id] ?? "Não atribuída",
        } as Prescriber;
      });

      setPrescribersList(enrichedPrescribers);
      setAllSales(sales);
      setUsers(adminUsers as Profile[]);
      setVisits(enrichedVisits);

      // Filtering logic for initial overview
      const currentSales =
        selectedVisitadoraId === "all"
          ? sales
          : sales.filter((s) => {
              const presc = prescribers.find((p) => p.id === s.prescriber_id);
              return presc?.visitadora_id === selectedVisitadoraId;
            });

      const currentVisits =
        selectedVisitadoraId === "all"
          ? enrichedVisits
          : enrichedVisits.filter((v) => v.visitadora_id === selectedVisitadoraId);

      const currentPrescribers =
        selectedVisitadoraId === "all"
          ? prescribers
          : prescribers.filter((p) => p.visitadora_id === selectedVisitadoraId);

      setStats({
        totalUsers: adminUsers.length,
        totalSales: currentSales.reduce((acc, s) => acc + Number(s.amount), 0),
        totalPrescribers: currentPrescribers.length,
        totalVisits: currentVisits.length,
      });

      // Prescriber ranking by sales
      const prescriberTotals: Record<string, number> = {};
      const prescriberNames: Record<string, string> = {};
      prescribers.forEach((p) => {
        prescriberNames[p.id] = p.full_name;
      });
      currentSales.forEach((s) => {
        if (s.prescriber_id) {
          prescriberTotals[s.prescriber_id] =
            (prescriberTotals[s.prescriber_id] || 0) + Number(s.amount);
        }
      });
      const sortedPrescribers = Object.entries(prescriberTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([id, total], i) => ({
          position: i + 1,
          name: prescriberNames[id] ?? "—",
          value: `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        }));
      setPrescriberRanking(sortedPrescribers);

      // Atendente ranking (filtered by sales related to the selected visitadora if needed, but normally global)
      const atendenteTotals: Record<string, number> = {};
      currentSales.forEach((s) => {
        if (s.atendente_id) {
          atendenteTotals[s.atendente_id] =
            (atendenteTotals[s.atendente_id] || 0) + Number(s.amount);
        }
      });
      const sortedAtendentes = Object.entries(atendenteTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([id, total], i) => ({
          position: i + 1,
          name: profileMap[id] ?? "—",
          value: `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        }));
      setAtendenteRanking(sortedAtendentes);
    } catch (err) {
      console.error("Erro ao carregar dados do painel:", err);
    }
  };

  // Re-load stats when filter changes
  useEffect(() => {
    if (users.length > 0) {
      // Re-trigger loadData OR filter locally for better performance
      // Let's filter locally for a snappier experience
      const profileMap: Record<string, string> = {};
      users.forEach((u) => {
        profileMap[u.id] = u.full_name;
      });

      const currentPrescribers =
        selectedVisitadoraId === "all"
          ? prescribersList
          : prescribersList.filter((p) => p.visitadora_id === selectedVisitadoraId);

      const currentVisits =
        selectedVisitadoraId === "all"
          ? visits
          : visits.filter((v) => v.visitadora_id === selectedVisitadoraId);

      const currentSales =
        selectedVisitadoraId === "all"
          ? allSales
          : allSales.filter((s) => {
              const presc = prescribersList.find((p) => p.id === s.prescriber_id);
              return presc?.visitadora_id === selectedVisitadoraId;
            });

      setStats({
        totalUsers: users.length,
        totalSales: currentSales.reduce((acc, s) => acc + Number(s.amount), 0),
        totalPrescribers: currentPrescribers.length,
        totalVisits: currentVisits.length,
      });

      // Update Rankings reactively
      const prescriberTotals: Record<string, number> = {};
      currentSales.forEach((s) => {
        if (s.prescriber_id) {
          prescriberTotals[s.prescriber_id] =
            (prescriberTotals[s.prescriber_id] || 0) + Number(s.amount);
        }
      });
      const sortedPrescribers = Object.entries(prescriberTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([id, total], i) => ({
          position: i + 1,
          name: prescribersList.find((p) => p.id === id)?.full_name ?? "—",
          value: `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        }));
      setPrescriberRanking(sortedPrescribers);
    }
  }, [selectedVisitadoraId, users, prescribersList, visits, allSales]);

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "overview", label: "Visão Geral" },
    { key: "users", label: "Usuários" },
    { key: "prescribers", label: "Prescritores" },
    { key: "rankings", label: "Performance" },
    { key: "sales", label: "Vendas" },
    { key: "goals", label: "Metas" },
    { key: "visits", label: "Visitas" },
    { key: "simulation", label: "Simulação" },
  ];

  const visitadoras = users.filter((u) => u.role === "visitadora");

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-foreground">
              Painel <span className="font-semibold text-primary">Administrativo</span>
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              BIO AUREA — SISTEMA DE GESTÃO ESTRATÉGICA
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Filtrar por Visitadora:
            </span>
            <select
              value={selectedVisitadoraId}
              onChange={(e) => setSelectedVisitadoraId(e.target.value)}
              className="bg-white/50 border border-white/20 rounded-xl px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-sm"
            >
              <option value="all">Todas as Profissionais</option>
              {visitadoras.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex bg-white/40 p-1 rounded-2xl border border-white/20 backdrop-blur-sm self-start overflow-x-auto max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-white/50"
              }`}
            >
              <span className="">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total de Usuários" value={stats.totalUsers} icon={Users} />
            <StatCard
              title="Receita Gerada"
              value={`R$ ${stats.totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
              icon={DollarSign}
            />
            <StatCard
              title="Prescritores Ativos"
              value={stats.totalPrescribers}
              icon={ShieldCheck}
            />
            <StatCard title="Visitas Realizadas" value={stats.totalVisits} icon={TrendingUp} />
          </div>

          {selectedVisitadoraId !== "all" && (
            <div className="rounded-[2.5rem] border border-primary/20 bg-primary/5 p-8 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold">
                  {users.find((u) => u.id === selectedVisitadoraId)?.full_name?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Performance de {users.find((u) => u.id === selectedVisitadoraId)?.full_name}
                  </h3>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                    Análise Individual de Campo
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white p-6 rounded-3xl border border-black/5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Conversão Vendas/Visitas
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.totalVisits > 0
                      ? (stats.totalSales / stats.totalVisits).toFixed(2)
                      : "0.00"}
                    <span className="text-sm ml-1 opacity-50">R$/Visita</span>
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-black/5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Média por Prescritor
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    R${" "}
                    {stats.totalPrescribers > 0
                      ? (stats.totalSales / stats.totalPrescribers).toLocaleString("pt-BR", {
                          maximumFractionDigits: 0,
                        })
                      : "0"}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-black/5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Atendimento Coberto
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {prescribersList.filter((p) => p.visitadora_id === selectedVisitadoraId).length}
                    <span className="text-sm ml-1 opacity-50">Médicos</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2.5rem] border border-white bg-white/40 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
              <RankingTable
                title="Top Prescritores (Receita)"
                entries={prescriberRanking.slice(0, 8)}
              />
            </div>
            <div className="rounded-[2.5rem] border border-white bg-white/40 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
              <RankingTable
                title="Performance de Atendentes"
                entries={atendenteRanking.slice(0, 8)}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="animate-in fade-in duration-500">
          <UsersManagement users={users} onRefresh={loadData} />
        </div>
      )}
      {activeTab === "prescribers" && (
        <div className="animate-in fade-in duration-500">
          <PrescribersManagement
            prescribers={
              selectedVisitadoraId === "all"
                ? prescribersList
                : prescribersList.filter((p) => p.visitadora_id === selectedVisitadoraId)
            }
            visits={visits}
            sales={allSales}
          />
        </div>
      )}
      {activeTab === "rankings" && (
        <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in duration-500">
          <div className="rounded-[2.5rem] border border-white bg-white/40 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
            <RankingTable title="Hall da Fama de Prescritores" entries={prescriberRanking} />
          </div>
          <div className="rounded-[2.5rem] border border-white bg-white/40 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
            <RankingTable title="Quadro de Conquistas da Equipe" entries={atendenteRanking} />
          </div>
        </div>
      )}
      {activeTab === "sales" && (
        <div className="animate-in fade-in duration-500">
          <SalesList
            sales={
              selectedVisitadoraId === "all"
                ? allSales
                : allSales.filter((s) => {
                    const presc = prescribersList.find((p) => p.id === s.prescriber_id);
                    return presc?.visitadora_id === selectedVisitadoraId;
                  })
            }
          />
        </div>
      )}
      {activeTab === "goals" && (
        <div className="animate-in fade-in duration-500">
          <GoalsManagement />
        </div>
      )}
      {activeTab === "visits" && (
        <div className="animate-in fade-in duration-500">
          <VisitsReport
            visits={
              selectedVisitadoraId === "all"
                ? visits
                : visits.filter((v) => v.visitadora_id === selectedVisitadoraId)
            }
          />
        </div>
      )}
      {activeTab === "simulation" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <Eye className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-primary">Modo de Simulação Administrativa</p>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setSimulatedRole("visitadora")}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${simulatedRole === "visitadora" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-primary/10"}`}
              >
                Visitadora
              </button>
              <button
                onClick={() => setSimulatedRole("atendente")}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${simulatedRole === "atendente" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-primary/10"}`}
              >
                Atendente
              </button>
              <button
                onClick={() => setSimulatedRole("prescritor")}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${simulatedRole === "prescritor" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-primary/10"}`}
              >
                Prescritor
              </button>
            </div>
          </div>

          <div className="border-t border-dashed border-primary/20 pt-10">
            {simulatedRole === "visitadora" && <VisitadoraDashboard />}
            {simulatedRole === "atendente" && <AtendenteDashboard />}
            {simulatedRole === "prescritor" && <PrescritorDashboard />}
          </div>
        </div>
      )}
    </div>
  );
}

function PrescribersManagement({
  prescribers,
  visits,
  sales,
}: {
  prescribers: Prescriber[];
  visits: Visit[];
  sales: Sale[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescriber, setSelectedPrescriber] = useState<Prescriber | null>(null);

  const filteredPrescribers = prescribers.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.crm_crf?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-foreground">Gestão de Prescritores</h3>
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por nome, especialidade ou CRM..."
            className="w-full rounded-xl border border-border bg-white/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPrescribers.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedPrescriber(p)}
            className="group cursor-pointer rounded-3xl border border-white bg-white/40 p-6 shadow-sm shadow-primary/5 backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-primary/10 active:scale-95"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                  {p.full_name}
                </h4>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">
                  {p.specialty || "Sem especialidade"} · {p.crm_crf || "Sem CRM"}
                </p>
              </div>
              <div
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  p.partnership_potential === "alto"
                    ? "bg-success/10 text-success"
                    : p.partnership_potential === "medio"
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {p.partnership_potential || "Neutro"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                  Visitas
                </p>
                <p className="text-lg font-bold text-foreground">
                  {visits.filter((v) => v.prescriber_id === p.id).length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                  Receita Total
                </p>
                <p className="text-lg font-bold text-primary">
                  R${" "}
                  {sales
                    .filter((s) => s.prescriber_id === p.id)
                    .reduce((acc, s) => acc + Number(s.amount), 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground italic">
                Sempre visitado(a) por: <span className="font-bold">{p.visitadora_name}</span>
              </p>
              <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPrescriber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-black/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {selectedPrescriber.full_name}
                </h2>
                <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">
                  Ficha Detalhada do Prescritor
                </p>
              </div>
              <button
                onClick={() => setSelectedPrescriber(null)}
                className="rounded-full bg-muted/50 p-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="col-span-2 grid grid-cols-2 gap-6 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                  <div>
                    <h5 className="text-[10px] font-bold text-primary uppercase mb-2">
                      Dados Técnicos
                    </h5>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Especialidade</p>
                        <p className="font-semibold">{selectedPrescriber.specialty || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Especialização Principal</p>
                        <p className="font-semibold">{selectedPrescriber.specialization || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CRM / CRF</p>
                        <p className="font-semibold">{selectedPrescriber.crm_crf || "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-primary uppercase mb-2">Visitação</h5>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Melhor Dia</p>
                        <p className="font-semibold">{selectedPrescriber.best_visit_day || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Melhor Horário</p>
                        <p className="font-semibold">{selectedPrescriber.best_visit_time || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nome da Clínica</p>
                        <p className="font-semibold">{selectedPrescriber.clinic_name || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 p-6 rounded-3xl border border-border/50">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-4">
                    Localização
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Endereço</p>
                      <p className="text-sm font-medium">
                        {selectedPrescriber.street}, {selectedPrescriber.number}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bairro / Cidade</p>
                      <p className="text-sm font-medium">
                        {selectedPrescriber.neighborhood} · {selectedPrescriber.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CEP</p>
                      <p className="text-sm font-medium">{selectedPrescriber.zip_code || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" /> Histórico de Relatórios (Campo)
                  </h5>
                  <div className="space-y-3">
                    {visits.filter((v) => v.prescriber_id === selectedPrescriber.id).slice(0, 5)
                      .length === 0 && (
                      <p className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-2xl">
                        Nenhuma visita registrada para este prescritor.
                      </p>
                    )}
                    {visits
                      .filter((v) => v.prescriber_id === selectedPrescriber.id)
                      .slice(0, 5)
                      .map((v) => (
                        <div key={v.id} className="p-4 rounded-2xl bg-white border border-black/5">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {v.visit_date}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Por: {v.profiles?.full_name}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 line-clamp-3">
                            {v.notes ? `"${v.notes}"` : "Sem observações."}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <DollarSign className="h-3 w-3" /> Registro de Conversões (Vendas)
                  </h5>
                  <div className="space-y-3">
                    {sales.filter((s) => s.prescriber_id === selectedPrescriber.id).slice(0, 5)
                      .length === 0 && (
                      <p className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-2xl">
                        Nenhuma venda vinculada a este prescritor ainda.
                      </p>
                    )}
                    {sales
                      .filter((s) => s.prescriber_id === selectedPrescriber.id)
                      .slice(0, 5)
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-white border border-black/5"
                        >
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {s.description || "Venda Registrada"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{s.sale_date}</p>
                          </div>
                          <span className="font-bold text-success">
                            R${" "}
                            {Number(s.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-muted/50 border-t border-black/5 flex justify-end">
              <button
                onClick={() => setSelectedPrescriber(null)}
                className="px-6 py-2 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-90 transition-all"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersManagement({
  users,
  onRefresh,
}: {
  users: Array<{ id: string; full_name: string; email: string | null; role: string | null }>;
  onRefresh: () => void;
}) {
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "atendente",
  });
  const [creating, setCreating] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createAdminUser({ data: newUser });

      alert(`Usuário ${newUser.full_name} criado com sucesso! A senha inicial já foi definida.`);
      setNewUser({ full_name: "", email: "", password: "", role: "atendente" });
      await onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Falha na criação profissional: ${message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    try {
      await updateAdminUserRole({
        data: { userId, role: newRole as "visitadora" | "prescritor" | "atendente" | "admin" },
      });
      await onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Não foi possível alterar o cargo: ${message}`);
    } finally {
      setChangingRole(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Deseja realmente excluir este usuário? Todos os dados vinculados podem ser afetados.",
      )
    )
      return;

    await deleteAdminUser({ data: { userId } });
    await onRefresh();
  };

  const roleLabels: Record<string, string> = {
    visitadora: "Visitadora",
    prescritor: "Prescritor",
    atendente: "Atendente",
    admin: "Admin",
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Novo Usuário / Convite</h3>
        <form onSubmit={handleCreateUser} className="grid gap-4 sm:grid-cols-4">
          <input
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm"
            placeholder="Nome Completo"
            value={newUser.full_name}
            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm"
            placeholder="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm"
            placeholder="Senha inicial"
            type="password"
            minLength={6}
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              {Object.entries(roleLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {creating ? "..." : "Adicionar"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Usuários Cadastrados</h3>
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{u.full_name || u.email}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={u.role ?? ""}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  disabled={changingRole === u.id}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sem papel</option>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"
                  title="Excluir Usuário"
                >
                  <span className="text-lg">🗑️</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SalesList({
  sales,
}: {
  sales: Array<{ id: string; amount: number; description: string | null; sale_date: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Todas as Vendas</h3>
      {sales.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{sale.description ?? "Venda"}</p>
                <p className="text-xs text-muted-foreground">{sale.sale_date}</p>
              </div>
              <span className="font-semibold text-success">
                R$ {Number(sale.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalsManagement() {
  const [goals, setGoals] = useState<
    Array<{
      id: string;
      title: string;
      target_value: number;
      goal_type: string;
      target_role: string;
      is_active: boolean;
    }>
  >([]);
  const [form, setForm] = useState({
    title: "",
    target_value: "",
    goal_type: "sales_amount",
    target_role: "atendente",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    target_value: "",
    goal_type: "",
    target_role: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setGoals(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from("goals").insert({
      title: form.title,
      target_value: parseFloat(form.target_value),
      goal_type: form.goal_type,
      target_role: form.target_role as "visitadora" | "prescritor" | "atendente" | "admin",
    });
    setForm({ title: "", target_value: "", goal_type: "sales_amount", target_role: "atendente" });
    setSubmitting(false);
    loadGoals();
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("goals").update({ is_active: !currentActive }).eq("id", id);
    loadGoals();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    loadGoals();
  };

  const startEdit = (g: {
    id: string;
    title: string;
    target_value: number;
    goal_type: string;
    target_role: string;
  }) => {
    setEditingId(g.id);
    setEditForm({
      title: g.title,
      target_value: String(g.target_value),
      goal_type: g.goal_type,
      target_role: g.target_role,
    });
  };

  const handleSaveEdit = async (id: string) => {
    await supabase
      .from("goals")
      .update({
        title: editForm.title,
        target_value: parseFloat(editForm.target_value),
        goal_type: editForm.goal_type,
        target_role: editForm.target_role as "visitadora" | "prescritor" | "atendente" | "admin",
      })
      .eq("id", id);
    setEditingId(null);
    loadGoals();
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  const goalTypeLabels: Record<string, string> = {
    sales_amount: "Valor de Vendas",
    sales_count: "Nº de Vendas",
    ticket_medio: "Ticket Médio",
    prescriber_count: "Nº de Prescritores",
    visit_count: "Nº de Visitas",
  };

  const roleLabels: Record<string, string> = {
    visitadora: "Visitadora",
    prescritor: "Prescritor",
    atendente: "Atendente",
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Nova Meta / Competição</h3>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Título da meta"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            className={inputClass}
            type="number"
            placeholder="Valor alvo"
            value={form.target_value}
            onChange={(e) => setForm({ ...form, target_value: e.target.value })}
            required
          />
          <select
            className={inputClass}
            value={form.goal_type}
            onChange={(e) => setForm({ ...form, goal_type: e.target.value })}
          >
            <option value="sales_amount">Valor de Vendas</option>
            <option value="sales_count">Nº de Vendas</option>
            <option value="ticket_medio">Ticket Médio</option>
            <option value="prescriber_count">Nº de Prescritores</option>
            <option value="visit_count">Nº de Visitas</option>
          </select>
          <select
            className={inputClass}
            value={form.target_role}
            onChange={(e) => setForm({ ...form, target_role: e.target.value })}
          >
            <option value="atendente">Atendente</option>
            <option value="visitadora">Visitadora</option>
            <option value="prescritor">Prescritor</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Criando..." : "Criar Meta"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Metas & Gamificações Existentes
        </h3>
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma meta criada.</p>
        ) : (
          <div className="space-y-2">
            {goals.map((g) =>
              editingId === g.id ? (
                <div key={g.id} className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                      className={inputClass}
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                    <input
                      className={inputClass}
                      type="number"
                      value={editForm.target_value}
                      onChange={(e) => setEditForm({ ...editForm, target_value: e.target.value })}
                    />
                    <select
                      className={inputClass}
                      value={editForm.goal_type}
                      onChange={(e) => setEditForm({ ...editForm, goal_type: e.target.value })}
                    >
                      {Object.entries(goalTypeLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <select
                      className={inputClass}
                      value={editForm.target_role}
                      onChange={(e) => setEditForm({ ...editForm, target_role: e.target.value })}
                    >
                      {Object.entries(roleLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(g.id)}
                      className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg bg-muted px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted/80"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{g.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabels[g.target_role] ?? g.target_role} ·{" "}
                      {goalTypeLabels[g.goal_type] ?? g.goal_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {["sales_count", "prescriber_count", "visit_count"].includes(g.goal_type)
                        ? g.target_value
                        : `R$ ${Number(g.target_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </span>
                    <button
                      onClick={() => handleToggleActive(g.id, g.is_active)}
                      className={`rounded-full px-2 py-0.5 text-xs cursor-pointer ${g.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                    >
                      {g.is_active ? "Ativa" : "Inativa"}
                    </button>
                    <button
                      onClick={() => startEdit(g)}
                      className="rounded-lg bg-muted px-2 py-1 text-xs text-foreground hover:bg-muted/80"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VisitsReport({
  visits,
}: {
  visits: Array<{
    id: string;
    visit_date: string;
    checkin_at: string | null;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
    status: string;
    prescribers: { full_name: string } | null;
    profiles: { full_name: string } | null;
  }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Relatórios de Visitas de Campo</h3>
      {visits.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma visita registrada ainda.</p>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => (
            <div key={visit.id} className="rounded-lg bg-muted/30 p-4 border border-border/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                <div>
                  <p className="font-bold text-foreground">
                    {visit.prescribers?.full_name || "Prescritor Desconhecido"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Visitadora:{" "}
                    <span className="font-medium text-primary">
                      {visit.profiles?.full_name || "Desconhecida"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <span>📅 {visit.visit_date}</span>
                  {visit.checkin_at && (
                    <span>🕒 {new Date(visit.checkin_at).toLocaleTimeString("pt-BR")}</span>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-white p-3 border border-black/5">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                  Observações:
                </p>
                <p className="text-sm text-foreground/80 italic">
                  {visit.notes ? `"${visit.notes}"` : "Sem observações registradas."}
                </p>
              </div>
              {visit.latitude && visit.longitude && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold">
                  📍 Local de Check-in: {visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
