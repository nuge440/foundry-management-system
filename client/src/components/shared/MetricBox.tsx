import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricBoxProps {
  label: string;
  count: number;
  icon: LucideIcon;
  urgency?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export function MetricBox({ label, count, icon: Icon, urgency = 0, onClick, isSelected }: MetricBoxProps) {
  const clampedUrgency = Math.max(0, Math.min(1, urgency));

  const bgStyle: React.CSSProperties = clampedUrgency > 0
    ? {
        background: `linear-gradient(135deg, transparent ${Math.round((1 - clampedUrgency) * 60)}%, rgba(239, 68, 68, ${0.2 + clampedUrgency * 0.5}) 100%)`,
      }
    : {};

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-md px-2 py-1.5 cursor-pointer transition-all duration-200 hover:scale-105 min-w-[70px] flex-shrink-0",
        "border border-border bg-card",
        "hover-elevate active-elevate-2",
        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105"
      )}
      style={bgStyle}
      data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex flex-col items-center justify-center gap-0 text-foreground">
        <Icon className="w-3 h-3 opacity-60" />
        <div className="text-lg font-bold leading-tight">{count}</div>
        <div className="text-[8px] uppercase tracking-wide opacity-70 text-center leading-tight max-w-[60px]">{label}</div>
      </div>
    </div>
  );
}
