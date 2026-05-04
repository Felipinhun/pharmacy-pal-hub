import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white bg-white/50 p-6 shadow-xl shadow-primary/5 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-primary/10">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        <Icon size={80} />
      </div>
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-light tracking-tight text-foreground">{value}</h3>
          </div>
          {description && (
            <p className="text-xs font-medium text-muted-foreground/60">{description}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${
            trend === "up" ? "bg-success" : trend === "down" ? "bg-destructive" : "bg-muted-foreground"
          }`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground/60"
          }`}>
            {trend === "up" ? "Em Alta" : trend === "down" ? "Em Queda" : "Estável"}
          </span>
        </div>
      )}
    </div>
  );
}