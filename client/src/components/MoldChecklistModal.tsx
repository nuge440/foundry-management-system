import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, CheckSquare, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ChecklistTemplate, ChecklistTemplateItem, MoldChecklistItem } from "@shared/schema";

interface MoldChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobNumber: string;
}

export function MoldChecklistModal({ isOpen, onClose, jobId, jobNumber }: MoldChecklistModalProps) {
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<ChecklistTemplate[]>({
    queryKey: ["/api/checklist-templates"],
    enabled: isOpen,
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  const { data: templateItems = [], isLoading: loadingItems } = useQuery<ChecklistTemplateItem[]>({
    queryKey: ["/api/checklist-templates", selectedTemplateId, "items"],
    queryFn: async () => {
      const { authFetch } = await import("@/lib/queryClient");
      const response = await authFetch(`/api/checklist-templates/${selectedTemplateId}/items`);
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
    enabled: isOpen && !!selectedTemplateId,
  });

  const { data: existingItems = [], isLoading: loadingExisting } = useQuery<MoldChecklistItem[]>({
    queryKey: ["/api/jobs", jobId, "checklist-items"],
    queryFn: async () => {
      const { authFetch } = await import("@/lib/queryClient");
      const response = await authFetch(`/api/jobs/${jobId}/checklist-items`);
      if (!response.ok) throw new Error("Failed to fetch checklist items");
      return response.json();
    },
    enabled: isOpen && !!jobId,
  });

  const completedSet = new Set(existingItems.map(i => i.item));

  const toggleMutation = useMutation({
    mutationFn: async ({ item, checked }: { item: string; checked: boolean }) => {
      if (checked) {
        return await apiRequest("POST", "/api/checklist-items", {
          jobId,
          item,
          initial: "",
          date: new Date().toISOString().split("T")[0],
          notes: "",
        });
      } else {
        const existing = existingItems.find(i => i.item === item);
        if (existing) {
          return await apiRequest("DELETE", `/api/checklist-items/${existing.id}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "checklist-items"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update checklist",
        variant: "destructive",
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ itemId, notes, initial }: { itemId: string; notes: string; initial: string }) => {
      const existing = existingItems.find(i => i.id === itemId);
      if (!existing) return;
      return await apiRequest("PATCH", `/api/checklist-items/${itemId}`, {
        jobId: existing.jobId,
        item: existing.item,
        initial,
        date: existing.date,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "checklist-items"] });
    },
  });

  if (!isOpen) return null;

  const nonHeaderItems = templateItems.filter(i => !i.itemDescription.startsWith("---"));
  const completedCount = nonHeaderItems.filter(i => completedSet.has(i.itemDescription)).length;
  const totalCount = nonHeaderItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      data-testid="checklist-modal-backdrop"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-background border rounded-md w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl mt-8 mb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-background z-10 rounded-t-md">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="text-checklist-title">
              <CheckSquare className="w-5 h-5 text-green-600" />
              Mold Design Checklist
            </h2>
            <p className="text-sm text-muted-foreground">
              Job {jobNumber} — {completedCount}/{totalCount} items complete ({progress}%)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {templates.length > 1 && (
              <select
                className="text-sm border rounded px-2 py-1 bg-background"
                value={selectedTemplateId || ""}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                data-testid="select-checklist-template"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-checklist">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {(loadingItems || loadingExisting) ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : templateItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No checklist items found for this template.
            </div>
          ) : (
            <div className="space-y-1">
              {templateItems.map((item) => {
                const isHeader = item.itemDescription.startsWith("---");
                if (isHeader) {
                  const headerText = item.itemDescription.replace(/^---\s*/, "").replace(/\s*---$/, "");
                  const sectionItems = [];
                  let idx = templateItems.indexOf(item) + 1;
                  while (idx < templateItems.length && !templateItems[idx].itemDescription.startsWith("---")) {
                    sectionItems.push(templateItems[idx]);
                    idx++;
                  }
                  const sectionComplete = sectionItems.filter(i => completedSet.has(i.itemDescription)).length;
                  return (
                    <div key={item.id} className="pt-4 pb-1 first:pt-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-primary">{headerText}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {sectionComplete}/{sectionItems.length}
                        </Badge>
                      </div>
                      <div className="border-b border-primary/20 mt-1" />
                    </div>
                  );
                }

                const isChecked = completedSet.has(item.itemDescription);
                const existingItem = existingItems.find(i => i.item === item.itemDescription);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 px-3 py-2 rounded-md transition-colors",
                      isChecked ? "bg-green-50 dark:bg-green-950/20" : "hover:bg-muted/50"
                    )}
                    data-testid={`checklist-item-${item.id}`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        toggleMutation.mutate({ item: item.itemDescription, checked: checked === true });
                      }}
                      disabled={toggleMutation.isPending}
                      className="mt-0.5"
                      data-testid={`checkbox-checklist-${item.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-sm",
                        isChecked && "text-muted-foreground line-through"
                      )}>
                        {item.itemDescription}
                      </span>
                      {isChecked && existingItem && (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            placeholder="Initials"
                            defaultValue={existingItem.initial}
                            onBlur={(e) => {
                              if (e.target.value !== existingItem.initial) {
                                updateNotesMutation.mutate({
                                  itemId: existingItem.id,
                                  initial: e.target.value,
                                  notes: existingItem.notes,
                                });
                              }
                            }}
                            className="w-16 h-6 text-xs px-1"
                            data-testid={`input-initial-${item.id}`}
                          />
                          <Input
                            placeholder="Notes..."
                            defaultValue={existingItem.notes}
                            onBlur={(e) => {
                              if (e.target.value !== existingItem.notes) {
                                updateNotesMutation.mutate({
                                  itemId: existingItem.id,
                                  initial: existingItem.initial,
                                  notes: e.target.value,
                                });
                              }
                            }}
                            className="flex-1 h-6 text-xs px-1"
                            data-testid={`input-notes-${item.id}`}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {existingItem.date}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t p-3 bg-background rounded-b-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progress}% complete</span>
            </div>
            <Button variant="outline" size="sm" onClick={onClose} data-testid="button-done-checklist">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
