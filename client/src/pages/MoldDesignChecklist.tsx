import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MoldChecklistItem } from "@shared/schema";
import { ChecklistItemFormModal } from "@/components/modals/ChecklistItemFormModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MoldDesignChecklist() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MoldChecklistItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MoldChecklistItem | null>(null);

  const { data: items = [], isLoading } = useQuery<MoldChecklistItem[]>({
    queryKey: ["/api/checklist-items"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/checklist-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-items"] });
      toast({
        title: "Success",
        description: "Checklist item deleted successfully",
      });
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete checklist item",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: MoldChecklistItem) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (item: MoldChecklistItem) => {
    setItemToDelete(item);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-mold-checklist">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Mold Design Checklist</h1>
        </div>
        <div className="text-muted-foreground">Loading checklist items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-mold-checklist">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mold Design Checklist</h1>
        <Button onClick={handleAdd} data-testid="button-add-item">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Item</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Initial</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Date</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Notes</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={item.id}
                className={cn(
                  "border-t hover-elevate transition-colors",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                )}
                data-testid={`row-checklist-${item.id}`}
              >
                <td className="px-4 py-3 max-w-md">
                  <div className="line-clamp-2" data-testid={`text-item-${item.id}`}>
                    {item.item}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap" data-testid={`text-initial-${item.id}`}>
                  {item.initial || "-"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap" data-testid={`text-date-${item.id}`}>
                  {item.date || "-"}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="line-clamp-1" data-testid={`text-notes-${item.id}`}>
                    {item.notes || "-"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-${item.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(item)}
                      data-testid={`button-delete-${item.id}`}
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

      <ChecklistItemFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedItem(null);
        }}
        initialData={selectedItem}
      />

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this checklist item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
