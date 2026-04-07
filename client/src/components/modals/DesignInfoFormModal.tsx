import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertDesignInfoSchema, type DesignInfo } from "@shared/schema";

interface DesignInfoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  initialData?: DesignInfo;
}

export function DesignInfoFormModal({ isOpen, onClose, jobId, initialData }: DesignInfoFormModalProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertDesignInfoSchema),
    defaultValues: {
      jobId,
      solidificationGating: "",
      quality: "",
      sprues: "",
      basinSize: "",
      gatingSystem: "",
    },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        jobId: initialData.jobId,
        solidificationGating: initialData.solidificationGating,
        quality: initialData.quality,
        sprues: initialData.sprues,
        basinSize: initialData.basinSize,
        gatingSystem: initialData.gatingSystem,
      });
    }
  }, [isOpen, initialData, form]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest(initialData?.id ? "PATCH" : "POST", `/api/jobs/${jobId}/design-info`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/design-info`] });
      toast({
        title: "Success",
        description: "Design information updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update design information",
        variant: "destructive",
      });
    },
  });

  if (!isOpen) return null;

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const FormField = ({ label, name, placeholder }: { label: string; name: any; placeholder: string }) => (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4">
      <Label className="text-right text-sm text-muted-foreground">{label}</Label>
      <Input 
        {...form.register(name)} 
        placeholder={placeholder}
        data-testid={`input-${name}`}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border rounded-md w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-card z-10">
          <h2 className="text-xl font-semibold">Edit Design Information</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-design-modal">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">
            <FormField label="Solidification" name="solidificationGating" placeholder="Enter solidification" />
            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <Label className="text-right text-sm text-muted-foreground">Solidification Quality</Label>
              <Select 
                value={form.watch("quality")} 
                onValueChange={(value) => form.setValue("quality", value)}
              >
                <SelectTrigger data-testid="select-quality">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nova">Nova</SelectItem>
                  <SelectItem value="Magma">Magma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormField label="Sprues" name="sprues" placeholder="Enter sprues" />
            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <Label className="text-right text-sm text-muted-foreground">Basin Size</Label>
              <Select 
                value={form.watch("basinSize")} 
                onValueChange={(value) => form.setValue("basinSize", value)}
              >
                <SelectTrigger data-testid="select-basin-size">
                  <SelectValue placeholder="Select basin size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small</SelectItem>
                  <SelectItem value="Large">Large</SelectItem>
                  <SelectItem value="Double">Double</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormField label="Gating System" name="gatingSystem" placeholder="Enter gating system" />
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 p-4 border-t bg-card">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-design">
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-design">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
