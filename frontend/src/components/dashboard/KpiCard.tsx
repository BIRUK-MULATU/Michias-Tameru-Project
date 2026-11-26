import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  dotColor: string;
  deltaPct: number | null;
  subLabel?: string;
  hideDelta?: boolean;
}

export function KpiCard({ label, value, dotColor, deltaPct, subLabel, hideDelta }: KpiCardProps) {
  const up = deltaPct !== null && deltaPct > 0;
  const down = deltaPct !== null && deltaPct < 0;

  return (
    <div className="rounded-xl bg-white/5 p-3.5 ring-1 ring-white/10">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
        {label}
      </div>
      <p className="mt-1.5 text-xl font-semibold text-white">{value}</p>
      {!hideDelta && (
        <div className="mt-1 flex items-center gap-1 text-xs">
          {deltaPct !== null ? (
            <span className={cn("font-medium", up && "text-emerald-400", down && "text-red-400", !up && !down && "text-slate-400")}>
              {up ? "▲" : down ? "▼" : "–"} {Math.abs(deltaPct).toFixed(1)}%
            </span>
          ) : (
            <span className="text-slate-500">No prior data</span>
          )}
          {subLabel && <span className="text-slate-500">{subLabel}</span>}
        </div>
      )}
      {hideDelta && subLabel && <p className="mt-1 text-xs text-slate-500">{subLabel}</p>}
    </div>
  );
}
