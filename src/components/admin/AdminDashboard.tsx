import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { RankingTable } from "@/components/RankingTable";
import { Users, DollarSign, ShieldCheck, TrendingUp, UserPlus } from "lucide-react";

type AdminTab = "overview" | "users" | "rankings" | "sales" | "goals";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState({ totalUsers: 0, totalSales: 0, totalPrescribers: 0, totalVisits: 0 });
  const [prescriberRanking, setPrescriberRanking] = useState<Array<{ position: number; name: string; value: string }>>([]);
  const [atendenteRanking, setAtendenteRanking] = useState<Array<{ position: number; name: string; value: string }>>([]);
  const [allSales, setAllSales] = useState<Array<{ id: string; amount: number; description: string | null; sale_date: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string; email: string | null; role: string | null }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [profilesRes, salesRes, prescribersRes, visitsRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("sales").select("*").order("sale_date", { ascending: false }),
      supabase.from("prescribers").select("id, full_name"),
      supabase.from("visits").select("id"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const profiles = profilesRes.data ?? [];
    const sales = salesRes.data ?? [];
    const prescribers = prescribersRes.data ?? [];
    const roles = rolesRes.data ?? [];

    setStats({
      totalUsers: profiles.length,
      totalSales: sales.reduce((acc, s) => acc + Number(s.amount), 0),
      totalPrescribers: prescribers.length,
      totalVisits: visitsRes.data?.length ?? 0,
    });

    setAllSales(sales);

    // Build user list with roles
    const roleMap: Record<string, string> = {};
    roles.forEach((r) => { roleMap[r.user_id] = r.role; });
    setUsers(profiles.map((p) => ({ ...p, role: roleMap[p.id] ?? null })));

    // Prescriber ranking by sales
    const prescriberTotals: Record<string, number> = {};
    const prescriberNames: Record<string, string> = {};
    prescribers.forEach((p) => { prescriberNames[p.id] = p.full_name; });
    sales.forEach((s) => {
      if (s.prescriber_id) {
        prescriberTotals[s.prescriber_id] = (prescriberTotals[s.prescriber_id] || 0) + Number(s.amount);
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

    // Atendente ranking
    const atendenteTotals: Record<string, number> = {};
    sales.forEach((s) => {
      if (s.atendente_id) {
        atendenteTotals[s.atendente_id] = (atendenteTotals[s.atendente_id] || 0) + Number(s.amount);
      }
    });
    const profileMap: Record<string, string> = {};
    profiles.forEach((p) => { profileMap[p.id] = p.full_name; });
    const sortedAtendentes = Object.entries(atendenteTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([id, total], i) => ({
        position: i + 1,
        name: profileMap[id] ?? "—",
        value: `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      }));
    setAtendenteRanking(sortedAtendentes);
  };

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "overview", label: "Visão Geral" },
    { key: "users", label: "Usuários" },
    { key: "rankings", label: "Rankings" },
    { key: "sales", label: "Vendas" },
    { key: "goals", label: "Metas" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground">Visão completa de todo o sistema</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Usuários" value={stats.totalUsers} icon={Users} />
            <StatCard
              title="Vendas Totais"
              value={`R$ ${stats.totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
            />
            <StatCard title="Prescritores" value={stats.totalPrescribers} icon={ShieldCheck} />
            <StatCard title="Visitas" value={stats.totalVisits} icon={TrendingUp} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <RankingTable title="Top Prescritores" entries={prescriberRanking.slice(0, 5)} />
            <RankingTable title="Top Atendentes" entries={atendenteRanking.slice(0, 5)} />
          </div>
        </div>
      )}

      {activeTab === "users" && <UsersManagement users={users} onRefresh={loadData} />}
      {activeTab === "rankings" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <RankingTable title="Ranking de Prescritores" entries={prescriberRanking} />
          <RankingTable title="Ranking de Atendentes" entries={atendenteRanking} />
        </div>
      )}
      {activeTab === "sales" && <SalesList sales={allSales} />}
      {activeTab === "goals" && <GoalsManagement />}
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);

    // Delete existing role
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // Insert new role
    if (newRole) {
      await supabase.from("user_roles").insert({ user_id: userId, role: newRole as "visitadora" | "prescritor" | "atendente" | "admin" });
    }

    setChangingRole(null);
    onRefresh();
  };

  const roleLabels: Record<string, string> = {
    visitadora: "Visitadora",
    prescritor: "Prescritor",
    atendente: "Atendente",
    admin: "Admin",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Gerenciamento de Usuários</h3>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div>
              <p className="font-medium text-foreground">{u.full_name || u.email}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={u.role ?? ""}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                disabled={changingRole === u.id}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sem papel</option>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesList({ sales }: { sales: Array<{ id: string; amount: number; description: string | null; sale_date: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Todas as Vendas</h3>
      {sales.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => (
            <div key={sale.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
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
  const [goals, setGoals] = useState<Array<{ id: string; title: string; target_value: number; goal_type: string; target_role: string; is_active: boolean }>>([]);
  const [form, setForm] = useState({ title: "", target_value: "", goal_type: "sales_amount", target_role: "atendente" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const { data } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
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

  const inputClass = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Nova Meta / Competição</h3>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input className={inputClass} placeholder="Título da meta" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className={inputClass} type="number" placeholder="Valor alvo" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} required />
          <select className={inputClass} value={form.goal_type} onChange={(e) => setForm({ ...form, goal_type: e.target.value })}>
            <option value="sales_amount">Valor de Vendas</option>
            <option value="sales_count">Nº de Vendas</option>
            <option value="ticket_medio">Ticket Médio</option>
          </select>
          <select className={inputClass} value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })}>
            <option value="atendente">Atendente</option>
            <option value="visitadora">Visitadora</option>
            <option value="prescritor">Prescritor</option>
          </select>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {submitting ? "Criando..." : "Criar Meta"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Metas Existentes</h3>
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma meta criada.</p>
        ) : (
          <div className="space-y-2">
            {goals.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{g.title}</p>
                  <p className="text-xs text-muted-foreground">{g.target_role} · {g.goal_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {g.goal_type === "sales_count" ? g.target_value : `R$ ${Number(g.target_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${g.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {g.is_active ? "Ativa" : "Inativa"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}