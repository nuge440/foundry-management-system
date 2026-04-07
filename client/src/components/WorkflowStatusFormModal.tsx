import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkflowStatus } from "@shared/schema";

interface WorkflowStatusFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: WorkflowStatus | null;
}

export function WorkflowStatusFormModal({ isOpen, onClose, initialData }: WorkflowStatusFormModalProps) {
  const [task, setTask] = useState("");
  const [color, setColor] = useState("#000000");
  const [department, setDepartment] = useState("");
  const { toast } = useToast();

  const { data: departments = [] } = useQuery<string[]>({
    queryKey: ["/api/workflow-departments"],
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setTask(initialData.task);
      setColor(initialData.color);
      setDepartment(initialData.department || "");
    } else {
      setTask("");
      setColor("#000000");
      setDepartment("");
    }
  }, [initialData?.id, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: { task: string; color: string; department: string }) => {
      return await apiRequest("POST", "/api/workflow-statuses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-statuses"] });
      toast({
        title: "Success",
        description: "Workflow status created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workflow status",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { task: string; color: string; department: string }) => {
      return await apiRequest("PATCH", `/api/workflow-statuses/${initialData?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-statuses"] });
      toast({
        title: "Success",
        description: "Workflow status updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workflow status",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = { task, color, department: department === "__none__" ? "" : department };
    if (initialData) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-workflow-status">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Workflow Status' : 'Add Workflow Status'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label className="text-right text-sm text-muted-foreground">Task Name</Label>
            <Input
              placeholder="Enter task name"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              data-testid="input-workflow-task"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label className="text-right text-sm text-muted-foreground">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger data-testid="select-workflow-department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No Department</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label className="text-right text-sm text-muted-foreground">Color</Label>
            <div className="flex gap-3 items-center">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10 cursor-pointer"
                data-testid="input-workflow-color"
                required
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#000000"
                className="flex-1 font-mono"
                data-testid="input-workflow-color-hex"
                pattern="^#[0-9A-Fa-f]{6}$"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label className="text-right text-sm text-muted-foreground">Preview</Label>
            <div
              className="w-full px-4 py-3 rounded-md text-center font-medium transition-colors flex flex-col items-center"
              style={{
                backgroundColor: color,
                color: getContrastColor(color)
              }}
            >
              {task || "Task Name Preview"}
              {department && department !== "__none__" && (
                <span className="text-xs opacity-75 mt-0.5">{department}</span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-workflow">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-workflow">
              Save Workflow Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#FFFFFF';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
