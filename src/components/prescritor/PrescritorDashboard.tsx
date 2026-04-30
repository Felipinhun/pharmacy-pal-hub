import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { DollarSign, TrendingUp, Hash } from "lucide-react";

export function PrescritorDashboard() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Array<{ id: string; amount: number; description: string | null; sale_date: string }>>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [ranking, setRanking] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Get prescriber record linked to this user
    const { data: prescriber } = await supabase
      .from("prescribers")
      .select("id")
      .eq("prescritor_user_id", user.id)
      .limit(1)
      .single();

    if (!prescriber) return;

    const { data: salesData } = await supabase
      .from("sales")
      .select("id, amount, description, sale_date")
      .eq("prescriber_id", prescriber.id)
      .order("sale_date", { ascending: false });

    if (salesData) {
      setSales(salesData);
      setTotalSales(salesData.reduce((acc, s) => acc + Number(s.amount), 0));
    }

    // Simple ranking: count total sales per prescriber and find position
    const { data: allSales } = await supabase.from("sales").select("prescriber_id, amount");
    if (allSales) {
      const totals: Record<string, number> = {};
      allSales.forEach((s) => {
        if (s.prescriber_id) {
          totals[s.prescriber_id] = (totals[s.prescriber_id] || 0) + Number(s.amount);
        }
      });
      const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
      const pos = sorted.findIndex(([id]) => id === prescriber.id);
      setRanking(pos >= 0 ? pos + 1 : null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Painel do Prescritor</h1>
        <p className="text-muted-foreground">Acompanhe suas vendas e posição no ranking</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Vendido"
          value={`R$ ${totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <StatCard title="Nº de Vendas" value={sales.length} icon={TrendingUp} />
        <StatCard
          title="Sua Posição"
          value={ranking ? `${ranking}º` : "—"}
          icon={Hash}
          description="no ranking geral"
        />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Histórico de Vendas</h3>
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
    </div>
  );
}