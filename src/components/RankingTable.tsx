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

export function RankingTable({ title, entries, valueLabel = "Revenue" }: RankingTableProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-light text-foreground">{title}</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{valueLabel} Focus</span>
      </div>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.position}
            className={`group relative flex items-center justify-between rounded-2xl px-5 py-4 transition-all hover:scale-[1.01] ${
              entry.highlight
                ? "bg-primary/5 ring-1 ring-primary/20"
                : "bg-white/40 border border-white/60 hover:bg-white/60"
            }`}
          >
            <div className="flex items-center gap-4">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-transform group-hover:scale-110 shadow-sm ${
                  entry.position === 1
                    ? "bg-primary text-primary-foreground shadow-primary/20"
                    : entry.position === 2
                      ? "bg-muted-foreground/10 text-foreground"
                      : entry.position === 3
                        ? "bg-primary/20 text-primary uppercase"
                        : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {entry.position}
              </span>
              <span className={`text-sm font-medium tracking-tight ${entry.highlight ? "text-primary font-semibold" : "text-foreground"}`}>
                {entry.name}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">{entry.value}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{valueLabel}</div>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 select-none">
            <div className="h-12 w-12 rounded-full border-2 border-dashed border-current mb-3" />
            <p className="text-xs font-medium uppercase tracking-widest italic">No data records available</p>
          </div>
        )}
      </div>
    </div>
  );
}