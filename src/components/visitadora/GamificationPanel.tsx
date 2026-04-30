import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Star, Target } from "lucide-react";

export function GamificationPanel() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Array<{ id: string; title: string; description: string | null; badge_icon: string | null; earned_at: string }>>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [prescriberCount, setPrescriberCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [achRes, prescRes, salesRes] = await Promise.all([
      supabase.from("achievements").select("*").eq("user_id", user.id).order("earned_at", { ascending: false }),
      supabase.from("prescribers").select("id").eq("visitadora_id", user.id),
      supabase.from("sales").select("amount, prescriber_id"),
    ]);

    if (achRes.data) setAchievements(achRes.data);
    if (prescRes.data) {
      setPrescriberCount(prescRes.data.length);
      if (salesRes.data) {
        const ids = new Set(prescRes.data.map((p) => p.id));
        const total = salesRes.data
          .filter((s) => s.prescriber_id && ids.has(s.prescriber_id))
          .reduce((acc, s) => acc + Number(s.amount), 0);
        setTotalSales(total);
      }
    }
  };

  const goals = [
    { label: "Cadastrar 10 prescritores", current: prescriberCount, target: 10, icon: Star },
    { label: "Gerar R$ 5.000 em vendas", current: totalSales, target: 5000, icon: Target },
    { label: "Cadastrar 25 prescritores", current: prescriberCount, target: 25, icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {/* Progress goals */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Metas & Conquistas</h3>
        <div className="space-y-4">
          {goals.map((goal, i) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            return (
              <div key={i} className="rounded-lg bg-muted/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <goal.icon className={`h-5 w-5 ${progress >= 100 ? "text-success" : "text-primary"}`} />
                    <span className="text-sm font-medium text-foreground">{goal.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {progress >= 100 ? "✅ Concluída" : `${Math.round(progress)}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full transition-all ${progress >= 100 ? "bg-success" : "bg-primary"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Conquistas Obtidas</h3>
        {achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conquista ainda. Continue trabalhando!</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {achievements.map((ach) => (
              <div key={ach.id} className="flex items-center gap-3 rounded-lg bg-primary/5 p-4">
                <Trophy className="h-8 w-8 text-warning" />
                <div>
                  <p className="font-medium text-foreground">{ach.title}</p>
                  <p className="text-xs text-muted-foreground">{ach.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}