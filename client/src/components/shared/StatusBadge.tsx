import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type JobStatus = 
  | "New"
  | "In Progress"
  | "Solidification/Casting"
  | "CAD Work"
  | "Waiting on CAM"
  | "Waiting on Sample"
  | "Completed"
  | "Waiting on Doug"
  | "Waiting On Customer"
  | "Waiting On PO"
  | "Waiting On CAD"
  | "Solidification / Gating"
  | "CAD (Mold Work)"
  | "Waiting On Molds"
  | "Ready For Robot"
  | "Running On Robot"
  | "Printing at Voxeljet"
  | "Waiting On Cores"
  | "Waiting to be Assembled"
  | "Being Assembled"
  | "Assembled"
  | "Ready to Pour"
  | "Cooling"
  | "Grinding Room"
  | "Heat Treat"
  | "Inspection"
  | "Shipping"
  | "SHIPPED"
  | "On Plastic Printer"
  | "Waiting on Pattern"
  | "At Foundry For Sample"
  | "On Hold For Review"
  | "At Machine Shop"
  | "At STL Precision"
  | "NDT Inspection";

const fallbackColorMap: Record<JobStatus, string> = {
  "New": "#3B82F6",
  "In Progress": "#10B981",
  "Solidification/Casting": "#8B5CF6",
  "CAD Work": "#F59E0B",
  "Waiting on CAM": "#6366F1",
  "Waiting on Sample": "#EC4899",
  "Completed": "#22C55E",
  "Waiting on Doug": "#EC4899",
  "Waiting On Customer": "#EC4899",
  "Waiting On PO": "#6366F1",
  "Waiting On CAD": "#F59E0B",
  "Solidification / Gating": "#8B5CF6",
  "CAD (Mold Work)": "#F59E0B",
  "Waiting On Molds": "#6366F1",
  "Ready For Robot": "#10B981",
  "Running On Robot": "#10B981",
  "Printing at Voxeljet": "#10B981",
  "Waiting On Cores": "#6366F1",
  "Waiting to be Assembled": "#6366F1",
  "Being Assembled": "#10B981",
  "Assembled": "#22C55E",
  "Ready to Pour": "#10B981",
  "Cooling": "#10B981",
  "Grinding Room": "#10B981",
  "Heat Treat": "#10B981",
  "Inspection": "#10B981",
  "Shipping": "#EC4899",
  "SHIPPED": "#22C55E",
  "On Plastic Printer": "#10B981",
  "Waiting on Pattern": "#6366F1",
  "At Foundry For Sample": "#EC4899",
  "On Hold For Review": "#EC4899",
  "At Machine Shop": "#10B981",
  "At STL Precision": "#10B981",
  "NDT Inspection": "#10B981",
};

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
  colorMap?: Record<string, string>;
}

export function StatusBadge({ status, className, colorMap }: StatusBadgeProps) {
  const color = colorMap?.[status.toLowerCase()] || fallbackColorMap[status] || "#6B7280";
  const textColor = getContrastColor(color);

  return (
    <Badge
      className={cn(
        "text-[11px] leading-tight font-medium whitespace-nowrap inline-flex px-1.5 py-0.5 min-w-[3.5rem] justify-center border-0",
        className
      )}
      style={{ backgroundColor: color, color: textColor }}
      title={status}
      data-testid={`badge-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {status}
    </Badge>
  );
}
