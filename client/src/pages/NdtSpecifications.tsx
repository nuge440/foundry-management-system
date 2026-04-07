import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NdtSpecificationFormModal } from "@/components/modals/NdtSpecificationFormModal";
import type { NdtSpecification } from "@shared/schema";

export default function NdtSpecifications() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<NdtSpecification | null>(null);
  const { toast } = useToast();

  const { data: specs = [], isLoading } = useQuery<NdtSpecification[]>({
    queryKey: ["/api/ndt-specifications"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ndt-specifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ndt-specifications"] });
      toast({
        title: "Success",
        description: "NDT specification deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete NDT specification",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (spec: NdtSpecification) => {
    setEditingSpec(spec);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this NDT specification?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-ndt-specifications">
        <h1 className="text-2xl font-semibold">NDT Specifications</h1>
        <div className="text-center py-12 text-muted-foreground">Loading NDT specifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-ndt-specifications">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">NDT Specifications</h1>
        <Button
          onClick={() => { setEditingSpec(null); setIsModalOpen(true); }}
          data-testid="button-add-ndt-spec"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add NDT Specification
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
            {specs.map((spec, idx) => (
              <tr
                key={spec.id}
                className={cn(
                  "border-t hover-elevate transition-colors",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                )}
                data-testid={`row-ndt-spec-${spec.id}`}
              >
                <td className="px-4 py-3 whitespace-nowrap font-medium">{spec.code}</td>
                <td className="px-4 py-3">{spec.description}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {spec.documentPath || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(spec)}
                      data-testid={`button-edit-ndt-spec-${spec.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(spec.id)}
                      data-testid={`button-delete-ndt-spec-${spec.id}`}
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

      <NdtSpecificationFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSpec(null); }}
        initialData={editingSpec}
      />
    </div>
  );
}
