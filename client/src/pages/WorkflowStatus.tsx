import { useState, useMemo, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowStatusFormModal } from "@/components/WorkflowStatusFormModal";
import { Pencil, Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkflowStatus } from "@shared/schema";

interface JobTaskInfo {
  task: string;
  count: number;
}

export default function WorkflowStatusPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<WorkflowStatus | null>(null);
  const { toast } = useToast();

  const { data: workflowStatuses = [], isLoading } = useQuery<WorkflowStatus[]>({
    queryKey: ["/api/workflow-statuses"],
  });

  const { data: jobTasks = [] } = useQuery<JobTaskInfo[]>({
    queryKey: ["/api/mongo/jobs/meta/unique-tasks"],
  });

  const { unmatchedTasks, matchedTasks } = useMemo(() => {
    const statusNames = workflowStatuses.map(ws => ws.task.toLowerCase());
    const unmatched: JobTaskInfo[] = [];
    const matched: JobTaskInfo[] = [];
    jobTasks.forEach(jt => {
      if (statusNames.includes(jt.task.toLowerCase())) {
        matched.push(jt);
      } else {
        unmatched.push(jt);
      }
    });
    return { unmatchedTasks: unmatched, matchedTasks: matched };
  }, [workflowStatuses, jobTasks]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workflow-statuses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-statuses"] });
      toast({
        title: "Success",
        description: "Workflow status deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete workflow status",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await apiRequest("PUT", "/api/workflow-statuses/reorder", { orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-statuses"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder workflow statuses",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (status: WorkflowStatus) => {
    setEditingStatus(status);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this workflow status?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= workflowStatuses.length) return;

    const ids = workflowStatuses.map(s => s.id);
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    reorderMutation.mutate(ids);
  };

  const handleSave = async (_data: any) => {};

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-workflow-status">
        <h1 className="text-2xl font-semibold">Workflow Status Management</h1>
        <div className="text-center py-12 text-muted-foreground">Loading workflow statuses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-workflow-status">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workflow Status Management</h1>
        <Button onClick={() => { setEditingStatus(null); setIsModalOpen(true); }} data-testid="button-add-workflow-status">
          <Plus className="w-4 h-4 mr-2" />
          Add Workflow Status
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-3 py-3 text-center font-semibold whitespace-nowrap w-16">Order</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Task</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Department</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Color</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Preview</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workflowStatuses.map((item, idx) => (
              <tr
                key={item.id}
                className={cn(
                  "border-t transition-colors",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                )}
              >
                <td className="px-3 py-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === 0 || reorderMutation.isPending}
                      onClick={() => handleMove(idx, "up")}
                      data-testid={`button-move-up-${item.id}`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground font-mono">{idx + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === workflowStatuses.length - 1 || reorderMutation.isPending}
                      onClick={() => handleMove(idx, "down")}
                      data-testid={`button-move-down-${item.id}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-medium">{item.task}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground" data-testid={`text-department-${item.id}`}>{item.department || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{item.color}</td>
                <td className="px-4 py-3">
                  <div 
                    className="w-full max-w-[200px] px-3 py-1.5 rounded-md text-center font-medium"
                    style={{ 
                      backgroundColor: item.color,
                      color: getContrastColor(item.color)
                    }}
                  >
                    {item.task}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-workflow-${item.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                      data-testid={`button-delete-workflow-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {jobTasks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {unmatchedTasks.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Unmatched JobBoss Tasks ({unmatchedTasks.length})</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                These tasks exist on active jobs but have no matching workflow status. They won't appear in dashboard metrics.
              </p>
              <div className="space-y-1.5">
                {unmatchedTasks.map(t => (
                  <div key={t.task} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-muted/50 text-sm">
                    <span className="font-medium">{t.task}</span>
                    <Badge variant="secondary">{t.count} {t.count === 1 ? "job" : "jobs"}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-sm">Matched JobBoss Tasks ({matchedTasks.length})</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              These tasks from active jobs have a matching workflow status and appear in dashboard metrics.
            </p>
            <div className="space-y-1.5">
              {matchedTasks.map(t => (
                <div key={t.task} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-muted/50 text-sm">
                  <span className="font-medium">{t.task}</span>
                  <Badge variant="secondary">{t.count} {t.count === 1 ? "job" : "jobs"}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <WorkflowStatusFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingStatus(null); }}
        initialData={editingStatus}
        onSave={handleSave}
      />
    </div>
  );
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
