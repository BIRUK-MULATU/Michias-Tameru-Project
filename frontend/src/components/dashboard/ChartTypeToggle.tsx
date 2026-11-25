import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChartKind = "line" | "bar" | "pie";

const ICONS: Record<ChartKind, typeof BarChart3> = {
  line: LineChartIcon,
  bar: BarChart3,
  pie: PieChartIcon,
};

const LABELS: Record<ChartKind, string> = {
  line: "Line chart",
  bar: "Bar chart",
  pie: "Pie chart",
};

interface ChartTypeToggleProps {
  value: ChartKind;
  onChange: (kind: ChartKind) => void;
  options: ChartKind[];
}

export function ChartTypeToggle({ value, onChange, options }: ChartTypeToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-black/20 p-0.5 ring-1 ring-white/10" role="group" aria-label="Chart type">
      {options.map((option) => {
        const Icon = ICONS[option];
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={active}
            aria-label={LABELS[option]}
            title={LABELS[option]}
            className={cn(
              "rounded-md p-1.5 text-slate-400 transition-colors hover:text-white",
              active && "bg-white/10 text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
