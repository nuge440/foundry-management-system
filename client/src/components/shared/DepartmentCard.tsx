import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DepartmentCardProps {
  name: string;
  activeCount: number;
  waitingCount: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export function DepartmentCard({ name, activeCount, waitingCount, onClick, isSelected }: DepartmentCardProps) {
  const total = activeCount + waitingCount;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-md px-3 py-2 cursor-pointer transition-all duration-200 min-w-[120px] flex-shrink-0 bg-muted/50",
        "hover-elevate active-elevate-2",
        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background"
      )}
      data-testid={`dept-card-${name.toLowerCase().replace(/[\s\/]+/g, '-')}`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold leading-tight truncate max-w-[110px]" title={name}>
          {name}
        </span>
        <div className="flex items-center gap-1.5">
          {activeCount > 0 && (
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate text-[10px] px-1.5 py-0 h-4 bg-green-600/20 text-green-700 dark:text-green-400">
              {activeCount}
            </Badge>
          )}
          {waitingCount > 0 && (
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-700 dark:text-amber-400">
              {waitingCount}
            </Badge>
          )}
          {total === 0 && (
            <span className="text-[10px] text-muted-foreground">0</span>
          )}
        </div>
      </div>
    </div>
  );
}
