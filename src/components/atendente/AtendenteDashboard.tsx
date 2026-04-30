import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { RankingTable } from "@/components/RankingTable";
import { DollarSign, TrendingUp, Hash, Target } from "lucide-react";

export function AtendenteDashboard() {
  const { user } = useAuth();
  const [totalSales, setTotalSales] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [ranking, setRanking] = useState<number | null>(null);
  const [goals, setGoals] = useState<Array<{ id: string; title: string; target_value: number; goal_type: string }>>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [salesRes, allSalesRes, goalsRes] = await Promise.all([
      supabase.from("sales").select("id, amount").eq("atendente_id", user.id),
      supabase.from("sales").select("atendente_id, amount"),
      supabase.from("goals").select("*").eq("target_role", "atendente").eq("is_active", true),
    ]);

    if (salesRes.data) {
      setSalesCount(salesRes.data.length);
      setTotalSales(salesRes.data.reduce((acc, s) => acc + Number(s.amount), 0));
    }

    if (allSalesRes.data) {
      const totals: Record<string, number> = {};
      allSalesRes.data.forEach((s) => {
        if (s.atendente_id) {
          totals[s.atendente_id] = (totals[s.atendente_id] || 0) + Number(s.amount);
        }
      });
      const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
      const pos = sorted.findIndex(([id]) => id === user.id);
      setRanking(pos >= 0 ? pos + 1 : null);
    }

    if (goalsRes.data) setGoals(goalsRes.data);
  };

  const ticketMedio = salesCount > 0 ? totalSales / salesCount : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Painel do Atendente</h1>
        <p className="text-muted-foreground">Acompanhe suas vendas, metas e posição no ranking</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vendido"
          value={`R$ ${totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <StatCard title="Nº de Vendas" value={salesCount} icon={TrendingUp} />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={Target}
        />
        <StatCard title="Sua Posição" value={ranking ? `${ranking}º` : "—"} icon={Hash} description="no ranking" />
      </div>

      {/* Competition section */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">🏆 Competições Ativas</h3>
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma competição ativa no momento. As metas serão definidas pelo admin.</p>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const current = goal.goal_type === "sales_amount" ? totalSales : goal.goal_type === "sales_count" ? salesCount : ticketMedio;
              const progress = Math.min((current / Number(goal.target_value)) * 100, 100);
              return (
                <div key={goal.id} className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{goal.title}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}