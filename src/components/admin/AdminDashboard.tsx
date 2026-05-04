import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { RankingTable } from "@/components/RankingTable";
import { Users, DollarSign, ShieldCheck, TrendingUp, UserPlus, Eye } from "lucide-react";
import { VisitadoraDashboard } from "@/components/visitadora/VisitadoraDashboard";
import { AtendenteDashboard } from "@/components/atendente/AtendenteDashboard";
import { PrescritorDashboard } from "@/components/prescritor/PrescritorDashboard";

type AdminTab = "overview" | "users" | "rankings" | "sales" | "goals" | "simulation";
type SimulatedRole = "visitadora" | "prescritor" | "atendente";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [simulatedRole, setSimulatedRole] = useState<SimulatedRole>("visitadora");
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
    { key: "users", label: "Gestão de Usuários" },
    { key: "rankings", label: "Performance" },
    { key: "sales", label: "Vendas" },
    { key: "goals", label: "Metas" },
    { key: "simulation", label: "Simulação" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-foreground">
            Painel <span className="font-semibold text-primary">Administrativo</span>
          </h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            BIO AUREA — SUÍTE EXECUTIVA
          </p>
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
            <StatCard title="Usuários Ativos" value={stats.totalUsers} icon={Users} />
            <StatCard
              title="Receita Acumulada"
              value={`R$ ${stats.totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
              icon={DollarSign}
            />
            <StatCard title="Prescritores Parceiros" value={stats.totalPrescribers} icon={ShieldCheck} />
            <StatCard title="Operações de Campo" value={stats.totalVisits} icon={TrendingUp} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2.5rem] border border-white bg-white/40 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
               <RankingTable title="Ranking de Prescritores" entries={prescriberRanking.slice(0, 5)} />
            </div>
            <div className="rounded-[2.5rem] border border-white bg-white/40 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
               <RankingTable title="Performance da Equipe" entries={atendenteRanking.slice(0, 5)} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && <div className="animate-in fade-in duration-500"><UsersManagement users={users} onRefresh={loadData} /></div>}
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
      {activeTab === "sales" && <div className="animate-in fade-in duration-500"><SalesList sales={allSales} /></div>}
      {activeTab === "goals" && <div className="animate-in fade-in duration-500"><GoalsManagement /></div>}
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

function UsersManagement({
  users,
  onRefresh,
}: {
  users: Array<{ id: string; full_name: string; email: string | null; role: string | null }>;
  onRefresh: () => void;
}) {
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ full_name: "", email: "", role: "atendente" });
  const [creating, setCreating] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // In Supabase, if the admin inserts into profiles, the user will "link" once they sign up with that email
      const { data, error } = await supabase.from("profiles").insert([{
        id: crypto.randomUUID(),
        full_name: newUser.full_name,
        email: newUser.email,
      }]).select();

      if (data && data[0]) {
        await supabase.from("user_roles").insert({
          user_id: data[0].id,
          role: newUser.role as any
        });
      }
      setNewUser({ full_name: "", email: "", role: "atendente" });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    await supabase.from("user_roles").delete().eq("user_id", userId);
    if (newRole) {
      await supabase.from("user_roles").insert({ user_id: userId, role: newRole as "visitadora" | "prescritor" | "atendente" | "admin" });
    }
    setChangingRole(null);
    onRefresh();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Deseja realmente excluir este usuário? Todos os dados vinculados podem ser afetados.")) return;
    
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    onRefresh();
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
        <form onSubmit={handleCreateUser} className="grid gap-4 sm:grid-cols-3">
          <input 
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm" 
            placeholder="Nome Completo" 
            value={newUser.full_name}
            onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
            required 
          />
          <input 
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm" 
            placeholder="Email" 
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            required 
          />
          <div className="flex gap-2">
            <select 
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm"
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
            >
              {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
            <div key={u.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
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
                    <option key={key} value={key}>{label}</option>
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", target_value: "", goal_type: "", target_role: "" });
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

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("goals").update({ is_active: !currentActive }).eq("id", id);
    loadGoals();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    loadGoals();
  };

  const startEdit = (g: { id: string; title: string; target_value: number; goal_type: string; target_role: string }) => {
    setEditingId(g.id);
    setEditForm({ title: g.title, target_value: String(g.target_value), goal_type: g.goal_type, target_role: g.target_role });
  };

  const handleSaveEdit = async (id: string) => {
    await supabase.from("goals").update({
      title: editForm.title,
      target_value: parseFloat(editForm.target_value),
      goal_type: editForm.goal_type,
      target_role: editForm.target_role as "visitadora" | "prescritor" | "atendente" | "admin",
    }).eq("id", id);
    setEditingId(null);
    loadGoals();
  };

  const inputClass = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

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
          <input className={inputClass} placeholder="Título da meta" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className={inputClass} type="number" placeholder="Valor alvo" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} required />
          <select className={inputClass} value={form.goal_type} onChange={(e) => setForm({ ...form, goal_type: e.target.value })}>
            <option value="sales_amount">Valor de Vendas</option>
            <option value="sales_count">Nº de Vendas</option>
            <option value="ticket_medio">Ticket Médio</option>
            <option value="prescriber_count">Nº de Prescritores</option>
            <option value="visit_count">Nº de Visitas</option>
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
        <h3 className="mb-4 text-lg font-semibold text-foreground">Metas & Gamificações Existentes</h3>
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma meta criada.</p>
        ) : (
          <div className="space-y-2">
            {goals.map((g) =>
              editingId === g.id ? (
                <div key={g.id} className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input className={inputClass} value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                    <input className={inputClass} type="number" value={editForm.target_value} onChange={(e) => setEditForm({ ...editForm, target_value: e.target.value })} />
                    <select className={inputClass} value={editForm.goal_type} onChange={(e) => setEditForm({ ...editForm, goal_type: e.target.value })}>
                      {Object.entries(goalTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select className={inputClass} value={editForm.target_role} onChange={(e) => setEditForm({ ...editForm, target_role: e.target.value })}>
                      {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => handleSaveEdit(g.id)} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Salvar</button>
                    <button onClick={() => setEditingId(null)} className="rounded-lg bg-muted px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted/80">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div key={g.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{g.title}</p>
                    <p className="text-xs text-muted-foreground">{roleLabels[g.target_role] ?? g.target_role} · {goalTypeLabels[g.goal_type] ?? g.goal_type}</p>
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
                    <button onClick={() => startEdit(g)} className="rounded-lg bg-muted px-2 py-1 text-xs text-foreground hover:bg-muted/80">✏️</button>
                    <button onClick={() => handleDelete(g.id)} className="rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20">🗑️</button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}