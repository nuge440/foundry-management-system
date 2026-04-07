import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MaterialFormModal } from "@/components/MaterialFormModal";
import type { Material } from "@shared/schema";

export default function Materials() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const { toast } = useToast();

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({
        title: "Success",
        description: "Material deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-materials">
        <h1 className="text-2xl font-semibold">Materials</h1>
        <div className="text-center py-12 text-muted-foreground">Loading materials...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-materials">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Materials</h1>
        <Button 
          onClick={() => { setEditingMaterial(null); setIsModalOpen(true); }} 
          data-testid="button-add-material"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Code</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Document Path</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material, idx) => (
              <tr
                key={material.id}
                className={cn(
                  "border-t hover-elevate transition-colors",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                )}
                data-testid={`row-material-${material.id}`}
              >
                <td className="px-4 py-3 whitespace-nowrap font-medium">{material.code}</td>
                <td className="px-4 py-3">{material.description}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {material.documentPath || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(material)}
                      data-testid={`button-edit-material-${material.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(material.id)}
                      data-testid={`button-delete-material-${material.id}`}
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

      <MaterialFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingMaterial(null); }}
        initialData={editingMaterial}
      />
    </div>
  );
}
