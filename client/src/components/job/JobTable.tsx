import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, JobStatus } from "@/components/shared/StatusBadge";
import { Pencil, Check, X, Split, Merge, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  status: JobStatus;
  task: string;
  company: string;
  partNumber: string;
  jobNumber: string;
  sandMoldSize?: string;
  material: string;
  pourWeight?: string;
  owner?: string;
  quantityNeeded: string;
  moldsNeeded?: string;
  certs?: string;
  coresOrdered?: string;
  orderDate?: string;
  promisedDate?: string;
  heatTreat?: string;
  notes?: string;
  informMelt?: string;
  moldsSplitOff?: string;
  daysOnFloor?: number;
  taskChangedAt?: string;
  isSplitChild?: boolean;
  parentJobNumber?: string;
  splitIndex?: number;
  splitTotal?: number;
  childComplete?: boolean;
  isExpedite?: boolean;
  isRemake?: boolean;
  remakeReason?: string;
}

interface JobTableProps {
  jobs: Job[];
  columns?: string[];
  onRowClick?: (job: Job) => void;
  onRowDoubleClick?: (job: Job) => void;
  onEdit?: (job: Job) => void;
  onCellChange?: (jobId: string, field: string, value: string) => void;
  onSplit?: (job: Job) => void;
  onUnsplit?: (parentJobNumber: string) => void;
  onToggleChildComplete?: (job: Job) => void;
  onToggleRemake?: (job: Job) => void;
  selectedJobId?: string;
  editable?: boolean;
  editableColumns?: string[];
  statusColorMap?: Record<string, string>;
}

const columnToField: Record<string, keyof Job> = {
  "Task": "task",
  "Company": "company",
  "Part Number": "partNumber",
  "Job Number": "jobNumber",
  "Sand Mold": "sandMoldSize",
  "Material": "material",
  "Pour Weight": "pourWeight",
  "Owner": "owner",
  "Quantity Needed": "quantityNeeded",
  "Molds Needed": "moldsNeeded",
  "Certs": "certs",
  "Cores Ordered": "coresOrdered",
  "Order Date": "orderDate",
  "Promised": "promisedDate",
  "Heat Treat": "heatTreat",
  "Notes": "notes",
  "Inform Melt": "informMelt",
  "Molds Split Off": "moldsSplitOff",
  "Days on Floor": "daysOnFloor",
  "Time in WC": "taskChangedAt"
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function calcDaysInWC(taskChangedAt?: string): number | null {
  if (!taskChangedAt) return null;
  const changed = new Date(taskChangedAt);
  if (isNaN(changed.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - changed.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

const nonEditableColumns = ["Task", "Actions", "Time in WC", "Order Date"];

export function JobTable({ jobs, columns, onRowClick, onRowDoubleClick, onEdit, onCellChange, onSplit, onUnsplit, onToggleChildComplete, onToggleRemake, selectedJobId, editable = false, editableColumns, statusColorMap }: JobTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingCell, setEditingCell] = useState<{ jobId: string; column: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const updateWidths = () => {
      setScrollWidth(container.scrollWidth);
      setClientWidth(container.clientWidth);
    };

    updateWidths();
    const resizeObserver = new ResizeObserver(updateWidths);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [jobs]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleTableScroll = useCallback(() => {
    if (isSyncing || !tableContainerRef.current || !scrollbarRef.current) return;
    setIsSyncing(true);
    scrollbarRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    requestAnimationFrame(() => setIsSyncing(false));
  }, [isSyncing]);

  const handleScrollbarScroll = useCallback(() => {
    if (isSyncing || !tableContainerRef.current || !scrollbarRef.current) return;
    setIsSyncing(true);
    tableContainerRef.current.scrollLeft = scrollbarRef.current.scrollLeft;
    requestAnimationFrame(() => setIsSyncing(false));
  }, [isSyncing]);

  const startEditing = (job: Job, column: string, e: React.MouseEvent) => {
    const isColumnEditable = editableColumns
      ? editableColumns.includes(column)
      : (editable && !nonEditableColumns.includes(column));
    if (!isColumnEditable) return;
    e.stopPropagation();
    const field = columnToField[column];
    const currentValue = field ? String(job[field] ?? "") : "";
    setEditValue(currentValue);
    setEditingCell({ jobId: job.id, column });
  };

  const saveEdit = () => {
    if (editingCell && onCellChange) {
      const field = columnToField[editingCell.column];
      if (field) {
        onCellChange(editingCell.jobId, field as string, editValue);
      }
    }
    setEditingCell(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const allColumns = columns || [
    "Task",
    "Company",
    "Part Number",
    "Job Number",
    "Sand Mold",
    "Material",
    "Pour Weight",
    "Owner",
    "Quantity Needed",
    "Molds Needed",
    "Certs",
    "Cores Ordered",
    "Promised",
    "Heat Treat",
    "Notes",
    "Inform Melt",
    "Molds Split Off",
    "Days on Floor",
    "Actions"
  ];

  const renderCell = (column: string, job: Job) => {
    const textClass = "text-[13px] leading-5 whitespace-nowrap";
    const emptyValue = <span className={cn(textClass, "text-muted-foreground")}>—</span>;
    const isEditing = editingCell?.jobId === job.id && editingCell?.column === column;
    const isEditableCell = editableColumns
      ? editableColumns.includes(column)
      : (editable && !nonEditableColumns.includes(column));

    if (isEditing) {
      return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="h-6 text-[13px] px-1 py-0 min-w-[60px]"
            data-testid={`input-cell-${job.id}-${column}`}
          />
        </div>
      );
    }

    const cellContent = (() => {
      switch (column) {
        case "Task":
          return <StatusBadge status={job.task as JobStatus} colorMap={statusColorMap} />;
        case "Company":
          return <span className={textClass}>{job.company || '—'}</span>;
        case "Part Number":
          return <span className={textClass}>{job.partNumber || '—'}</span>;
        case "Job Number":
          return (
            <span className={cn(textClass, "flex items-center gap-1")}>
              {job.isSplitChild && (
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1 rounded">
                  {job.splitIndex}/{job.splitTotal}
                </span>
              )}
              <span className="font-medium">{job.jobNumber}</span>
              {job.childComplete && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
              )}
              {job.isRemake && (
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded" data-testid={`badge-remake-${job.id}`}>
                  REMAKE
                </span>
              )}
            </span>
          );
        case "Sand Mold":
          return <span className={textClass}>{job.sandMoldSize || job.designInfo?.sandMoldSize || '—'}</span>;
        case "Material":
          return <span className={textClass}>{job.material || '—'}</span>;
        case "Pour Weight":
          return <span className={textClass}>{job.pourWeight || '—'}</span>;
        case "Owner":
          return <span className={textClass}>{job.owner || '—'}</span>;
        case "Quantity Needed":
          return <span className={textClass}>{job.quantityNeeded || '—'}</span>;
        case "Molds Needed":
          return <span className={textClass}>{job.moldsNeeded || '—'}</span>;
        case "Certs":
          return <span className={textClass}>{job.certs || '—'}</span>;
        case "Cores Ordered":
          return <span className={textClass}>{job.coresOrdered || '—'}</span>;
        case "Order Date":
          return <span className={textClass}>{formatDate(job.orderDate)}</span>;
        case "Promised":
          return <span className={textClass}>{formatDate(job.promisedDate)}</span>;
        case "Heat Treat":
          return <span className={textClass}>{job.heatTreat || '—'}</span>;
        case "Notes":
          return <span className={cn(textClass, "max-w-[14rem] truncate inline-block")} title={job.notes}>{job.notes || '—'}</span>;
        case "Inform Melt":
          return <span className={textClass}>{job.informMelt || '—'}</span>;
        case "Molds Split Off":
          return <span className={textClass}>{job.moldsSplitOff || '—'}</span>;
        case "Days on Floor":
          return job.daysOnFloor !== undefined ? (
            <span className={cn(
              "inline-flex px-1 py-0.5 rounded font-medium whitespace-nowrap",
              textClass,
              job.daysOnFloor > 5 ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
            )}>
              {job.daysOnFloor}d
            </span>
          ) : emptyValue;
        case "Time in WC": {
          const days = calcDaysInWC(job.taskChangedAt);
          if (days === null) return emptyValue;
          return (
            <span className={cn(
              "inline-flex px-1.5 py-0.5 rounded font-medium whitespace-nowrap",
              textClass,
              days > 14 ? "bg-destructive/20 text-destructive" : days > 7 ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"
            )}>
              {days}d
            </span>
          );
        }
        case "Actions":
          return (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEdit?.(job); }}
                data-testid={`button-edit-${job.id}`}
                title="Edit job"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onToggleRemake?.(job); }}
                data-testid={`button-remake-${job.id}`}
                title={job.isRemake ? "Clear remake flag" : "Mark as remake (scrap)"}
              >
                <RotateCcw className={cn("w-4 h-4", job.isRemake ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")} />
              </Button>
              {job.isSplitChild ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onToggleChildComplete?.(job); }}
                    data-testid={`button-complete-${job.id}`}
                    title={job.childComplete ? "Mark incomplete" : "Mark complete"}
                  >
                    <CheckCircle2 className={cn("w-4 h-4", job.childComplete ? "text-green-600 dark:text-green-400" : "text-muted-foreground")} />
                  </Button>
                  {job.splitIndex === 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); onUnsplit?.(job.parentJobNumber!); }}
                      data-testid={`button-unsplit-${job.id}`}
                      title="Unsplit (merge back)"
                    >
                      <Merge className="w-4 h-4" />
                    </Button>
                  )}
                </>
              ) : (
                onSplit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onSplit(job); }}
                    data-testid={`button-split-${job.id}`}
                    title="Split job"
                  >
                    <Split className="w-4 h-4" />
                  </Button>
                )
              )}
            </div>
          );
        default:
          return emptyValue;
      }
    })();

    if (isEditableCell) {
      return (
        <div 
          className="cursor-text hover:bg-primary/5 -mx-2 -my-1.5 px-2 py-1.5 rounded-sm transition-colors"
          onClick={(e) => startEditing(job, column, e)}
          data-testid={`cell-editable-${job.id}-${column}`}
        >
          {cellContent}
        </div>
      );
    }

    return cellContent;
  };

  const showFloatingScrollbar = scrollWidth > clientWidth;

  return (
    <div className="rounded-md border relative flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
      <div 
        ref={tableContainerRef}
        data-scroll-container="job-table"
        className="overflow-auto flex-1"
        onScroll={handleTableScroll}
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--muted-foreground) / 0.4) hsl(var(--muted))'
        }}
      >
        <table className="w-max min-w-full text-[13px] leading-5">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              {allColumns.map((col) => (
                <th 
                  key={col} 
                  className={cn(
                    "px-2 py-1.5 text-left font-semibold whitespace-nowrap text-[13px] border-r border-border/50",
                    col === "Task" && "sticky left-0 bg-muted/50 z-20 w-[120px]",
                    col === "Company" && "sticky left-[120px] bg-muted/50 z-20 w-[100px]",
                    col === "Actions" && "sticky right-0 bg-muted/50 z-20"
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, idx) => {
              const rowBg = job.isExpedite
                ? "expedite-row"
                : job.isRemake
                  ? "remake-row"
                  : idx % 2 === 0 ? "bg-background" : "bg-muted/30";
              return (
              <tr
                key={job.id}
                onClick={() => !editingCell && onRowClick?.(job)}
                onDoubleClick={() => onRowDoubleClick?.(job)}
                className={cn(
                  "border-t cursor-pointer hover-elevate transition-colors",
                  rowBg,
                  selectedJobId === job.id && "bg-primary/10",
                  job.isSplitChild && "border-l-2 border-l-primary/40",
                  job.childComplete && "opacity-60",
                  job.isExpedite && "font-bold",
                  job.isRemake && !job.isExpedite && "border-l-2 border-l-blue-500"
                )}
                data-testid={`row-job-${job.id}`}
              >
                {allColumns.map((column) => (
                  <td 
                    key={column} 
                    className={cn(
                      "px-2 py-1.5 border-r border-border/30",
                      column === "Task" && cn("sticky left-0 z-10 w-[120px]", rowBg),
                      column === "Company" && cn("sticky left-[120px] z-10 w-[100px]", rowBg),
                      column === "Actions" && cn("sticky right-0 z-10", rowBg)
                    )}
                  >
                    {renderCell(column, job)}
                  </td>
                ))}
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
      {showFloatingScrollbar && (
        <div 
          ref={scrollbarRef}
          className="flex-shrink-0 overflow-x-auto bg-muted/50 border-t z-30"
          onScroll={handleScrollbarScroll}
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsl(var(--muted-foreground) / 0.5) hsl(var(--muted))',
            height: '14px'
          }}
        >
          <div 
            ref={scrollContentRef}
            style={{ width: scrollWidth, height: '1px' }} 
          />
        </div>
      )}
    </div>
  );
}
