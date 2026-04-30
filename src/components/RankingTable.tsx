interface RankingEntry {
  position: number;
  name: string;
  value: string | number;
  highlight?: boolean;
}

interface RankingTableProps {
  title: string;
  entries: RankingEntry[];
  valueLabel?: string;
}

export function RankingTable({ title, entries, valueLabel = "Vendas" }: RankingTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">{title}</h3>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.position}
            className={`flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
              entry.highlight
                ? "bg-primary/10 border border-primary/20"
                : "bg-muted/50 hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  entry.position === 1
                    ? "bg-warning text-warning-foreground"
                    : entry.position === 2
                      ? "bg-muted-foreground/20 text-foreground"
                      : entry.position === 3
                        ? "bg-warning/60 text-warning-foreground"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {entry.position}
              </span>
              <span className={`font-medium ${entry.highlight ? "text-primary" : "text-foreground"}`}>
                {entry.name}
              </span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-foreground">{entry.value}</span>
              <span className="ml-1 text-xs text-muted-foreground">{valueLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}