import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
}

export function ChartCard({
  title,
  description,
  action,
  children,
  empty,
  emptyMessage = "No data for this period yet.",
}: ChartCardProps) {
  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="text-sm font-medium text-slate-100">{title}</h3>
          {description && <p className="text-xs text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">
        {empty ? (
          <p className="flex h-[220px] items-center justify-center text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
