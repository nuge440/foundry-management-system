import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChecklistTemplate } from "@shared/schema";
import { ChecklistTemplateFormModal } from "@/components/modals/ChecklistTemplateFormModal";
import { ChecklistTemplateItemsModal } from "@/components/modals/ChecklistTemplateItemsModal";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ChecklistDesign() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ChecklistTemplate | null>(null);
  const [templateForItems, setTemplateForItems] = useState<ChecklistTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery<ChecklistTemplate[]>({
    queryKey: ["/api/checklist-templates"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/checklist-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({
        title: "Success",
        description: "Checklist template deleted successfully",
      });
      setTemplateToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleDelete = (template: ChecklistTemplate) => {
    setTemplateToDelete(template);
  };

  const handleManageItems = (template: ChecklistTemplate) => {
    setTemplateForItems(template);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-checklist-design">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Checklist Design</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage checklist templates for use throughout the system
            </p>
          </div>
        </div>
        <div className="text-muted-foreground">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-checklist-design">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Checklist Design</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage checklist templates for use throughout the system
          </p>
        </div>
        <Button onClick={handleAdd} data-testid="button-add-template">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No checklist templates found</p>
            <p className="text-sm mt-2">Create your first template to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover-elevate" data-testid={`card-template-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg" data-testid={`text-template-name-${template.id}`}>
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="mt-1" data-testid={`text-template-description-${template.id}`}>
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageItems(template)}
                    className="flex-1"
                    data-testid={`button-manage-items-${template.id}`}
                  >
                    <List className="w-4 h-4 mr-2" />
                    Manage Items
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    data-testid={`button-edit-${template.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    data-testid={`button-delete-${template.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ChecklistTemplateFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedTemplate}
      />

      {templateForItems && (
        <ChecklistTemplateItemsModal
          template={templateForItems}
          isOpen={!!templateForItems}
          onClose={() => setTemplateForItems(null)}
        />
      )}

      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This will also delete all items in this template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
