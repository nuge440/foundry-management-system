import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Pencil, Check, X, List, Hash, Type } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChecklistTemplate, ChecklistTemplateItem } from "@shared/schema";
import { cn } from "@/lib/utils";

type FieldType = "text" | "picklist" | "numeric";

interface ChecklistTemplateItemsModalProps {
  template: ChecklistTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export function ChecklistTemplateItemsModal({
  template,
  isOpen,
  onClose,
}: ChecklistTemplateItemsModalProps) {
  const { toast } = useToast();
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [newPicklistOptions, setNewPicklistOptions] = useState("");
  const [newNumericMin, setNewNumericMin] = useState("");
  const [newNumericMax, setNewNumericMax] = useState("");
  const [newNumericUnit, setNewNumericUnit] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingFieldType, setEditingFieldType] = useState<FieldType>("text");
  const [editingPicklistOptions, setEditingPicklistOptions] = useState("");
  const [editingNumericMin, setEditingNumericMin] = useState("");
  const [editingNumericMax, setEditingNumericMax] = useState("");
  const [editingNumericUnit, setEditingNumericUnit] = useState("");

  const { data: items = [], isLoading } = useQuery<ChecklistTemplateItem[]>({
    queryKey: ["/api/checklist-templates", template.id, "items"],
    queryFn: async () => {
      const { authFetch } = await import("@/lib/queryClient");
      const response = await authFetch(`/api/checklist-templates/${template.id}/items`);
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
    enabled: isOpen,
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: {
      description: string;
      fieldType: FieldType;
      picklistOptions?: string[];
      numericMin?: number;
      numericMax?: number;
      numericUnit?: string;
    }) => {
      return await apiRequest("POST", "/api/checklist-template-items", {
        templateId: template.id,
        itemDescription: data.description,
        orderIndex: items.length,
        fieldType: data.fieldType,
        picklistOptions: data.picklistOptions || null,
        numericMin: data.numericMin ?? null,
        numericMax: data.numericMax ?? null,
        numericUnit: data.numericUnit || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates", template.id, "items"] });
      resetNewItemForm();
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      });
    },
  });

  const resetNewItemForm = () => {
    setNewItemDescription("");
    setNewFieldType("text");
    setNewPicklistOptions("");
    setNewNumericMin("");
    setNewNumericMax("");
    setNewNumericUnit("");
  };

  const updateItemMutation = useMutation({
    mutationFn: async (data: { 
      id: string; 
      description: string;
      fieldType: FieldType;
      picklistOptions?: string[];
      numericMin?: number;
      numericMax?: number;
      numericUnit?: string;
    }) => {
      const item = items.find(i => i.id === data.id);
      if (!item) throw new Error("Item not found");
      return await apiRequest("PATCH", `/api/checklist-template-items/${data.id}`, {
        templateId: item.templateId,
        itemDescription: data.description,
        orderIndex: item.orderIndex,
        fieldType: data.fieldType,
        picklistOptions: data.picklistOptions || null,
        numericMin: data.numericMin ?? null,
        numericMax: data.numericMax ?? null,
        numericUnit: data.numericUnit || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates", template.id, "items"] });
      cancelEditing();
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/checklist-template-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates", template.id, "items"] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    if (newItemDescription.trim()) {
      const picklistOpts = newFieldType === "picklist" && newPicklistOptions.trim()
        ? newPicklistOptions.split(",").map(o => o.trim()).filter(o => o)
        : undefined;
      addItemMutation.mutate({
        description: newItemDescription.trim(),
        fieldType: newFieldType,
        picklistOptions: picklistOpts,
        numericMin: newFieldType === "numeric" && newNumericMin ? parseFloat(newNumericMin) : undefined,
        numericMax: newFieldType === "numeric" && newNumericMax ? parseFloat(newNumericMax) : undefined,
        numericUnit: newFieldType === "numeric" ? newNumericUnit || undefined : undefined,
      });
    }
  };

  const startEditing = (item: ChecklistTemplateItem) => {
    setEditingItemId(item.id);
    setEditingValue(item.itemDescription);
    setEditingFieldType((item.fieldType as FieldType) || "text");
    setEditingPicklistOptions(item.picklistOptions?.join(", ") || "");
    setEditingNumericMin(item.numericMin?.toString() || "");
    setEditingNumericMax(item.numericMax?.toString() || "");
    setEditingNumericUnit(item.numericUnit || "");
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingValue("");
    setEditingFieldType("text");
    setEditingPicklistOptions("");
    setEditingNumericMin("");
    setEditingNumericMax("");
    setEditingNumericUnit("");
  };

  const saveEdit = (id: string) => {
    if (editingValue.trim()) {
      const picklistOpts = editingFieldType === "picklist" && editingPicklistOptions.trim()
        ? editingPicklistOptions.split(",").map(o => o.trim()).filter(o => o)
        : undefined;
      updateItemMutation.mutate({ 
        id, 
        description: editingValue.trim(),
        fieldType: editingFieldType,
        picklistOptions: picklistOpts,
        numericMin: editingFieldType === "numeric" && editingNumericMin ? parseFloat(editingNumericMin) : undefined,
        numericMax: editingFieldType === "numeric" && editingNumericMax ? parseFloat(editingNumericMax) : undefined,
        numericUnit: editingFieldType === "numeric" ? editingNumericUnit || undefined : undefined,
      });
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" && editingValue.trim()) {
      saveEdit(id);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const getFieldTypeIcon = (fieldType: string) => {
    switch (fieldType) {
      case "picklist": return <List className="w-3 h-3" />;
      case "numeric": return <Hash className="w-3 h-3" />;
      default: return <Type className="w-3 h-3" />;
    }
  };

  const getFieldTypeBadge = (item: ChecklistTemplateItem) => {
    const fieldType = item.fieldType || "text";
    let label = fieldType.charAt(0).toUpperCase() + fieldType.slice(1);
    if (fieldType === "picklist" && item.picklistOptions?.length) {
      label += ` (${item.picklistOptions.length})`;
    }
    if (fieldType === "numeric" && item.numericUnit) {
      label += ` (${item.numericUnit})`;
    }
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        {getFieldTypeIcon(fieldType)}
        {label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>
            Manage the items in this checklist template
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="text-muted-foreground text-center py-8">Loading items...</div>
          ) : (
            <>
              {items.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">
                  No items yet. Add your first item below.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-md border",
                        "hover-elevate transition-colors"
                      )}
                      data-testid={`item-${item.id}`}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground w-8">
                        {index + 1}.
                      </span>
                      {editingItemId === item.id ? (
                        <div className="flex-1 space-y-2">
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => handleEditKeyPress(e, item.id)}
                            autoFocus
                            data-testid={`input-edit-item-${item.id}`}
                          />
                          <div className="flex gap-2 items-center">
                            <Select value={editingFieldType} onValueChange={(v) => setEditingFieldType(v as FieldType)}>
                              <SelectTrigger className="w-[120px]" data-testid={`select-edit-field-type-${item.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="picklist">Picklist</SelectItem>
                                <SelectItem value="numeric">Numeric</SelectItem>
                              </SelectContent>
                            </Select>
                            {editingFieldType === "picklist" && (
                              <Input
                                placeholder="Options (comma-separated)"
                                value={editingPicklistOptions}
                                onChange={(e) => setEditingPicklistOptions(e.target.value)}
                                className="flex-1"
                                data-testid={`input-edit-picklist-${item.id}`}
                              />
                            )}
                            {editingFieldType === "numeric" && (
                              <>
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  value={editingNumericMin}
                                  onChange={(e) => setEditingNumericMin(e.target.value)}
                                  className="w-20"
                                  data-testid={`input-edit-min-${item.id}`}
                                />
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  value={editingNumericMax}
                                  onChange={(e) => setEditingNumericMax(e.target.value)}
                                  className="w-20"
                                  data-testid={`input-edit-max-${item.id}`}
                                />
                                <Input
                                  placeholder="Unit"
                                  value={editingNumericUnit}
                                  onChange={(e) => setEditingNumericUnit(e.target.value)}
                                  className="w-20"
                                  data-testid={`input-edit-unit-${item.id}`}
                                />
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveEdit(item.id)}
                              disabled={!editingValue.trim() || updateItemMutation.isPending}
                              data-testid={`button-save-edit-${item.id}`}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              data-testid={`button-cancel-edit-${item.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1" data-testid={`text-item-description-${item.id}`}>
                            {item.itemDescription}
                          </span>
                          {getFieldTypeBadge(item)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(item)}
                            data-testid={`button-edit-item-${item.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItemMutation.mutate(item.id)}
                            data-testid={`button-delete-item-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="space-y-3 pt-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Add new checklist item..."
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                disabled={addItemMutation.isPending}
                className="flex-1"
                data-testid="input-new-item"
              />
              <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as FieldType)}>
                <SelectTrigger className="w-[120px]" data-testid="select-field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="picklist">Picklist</SelectItem>
                  <SelectItem value="numeric">Numeric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newFieldType === "picklist" && (
              <div className="flex gap-2 items-center">
                <Label className="text-sm text-muted-foreground w-24">Options:</Label>
                <Input
                  placeholder="Option1, Option2, Option3 (comma-separated)"
                  value={newPicklistOptions}
                  onChange={(e) => setNewPicklistOptions(e.target.value)}
                  disabled={addItemMutation.isPending}
                  className="flex-1"
                  data-testid="input-picklist-options"
                />
              </div>
            )}
            
            {newFieldType === "numeric" && (
              <div className="flex gap-2 items-center">
                <Label className="text-sm text-muted-foreground w-24">Range:</Label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={newNumericMin}
                  onChange={(e) => setNewNumericMin(e.target.value)}
                  disabled={addItemMutation.isPending}
                  className="w-24"
                  data-testid="input-numeric-min"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={newNumericMax}
                  onChange={(e) => setNewNumericMax(e.target.value)}
                  disabled={addItemMutation.isPending}
                  className="w-24"
                  data-testid="input-numeric-max"
                />
                <Input
                  placeholder="Unit (e.g., lbs, %)"
                  value={newNumericUnit}
                  onChange={(e) => setNewNumericUnit(e.target.value)}
                  disabled={addItemMutation.isPending}
                  className="w-32"
                  data-testid="input-numeric-unit"
                />
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                onClick={handleAddItem}
                disabled={!newItemDescription.trim() || addItemMutation.isPending}
                data-testid="button-add-item"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose} data-testid="button-close">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
