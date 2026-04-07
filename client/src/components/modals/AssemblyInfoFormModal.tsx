import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertAssemblyInfoSchema, type AssemblyInfo } from "@shared/schema";

interface AssemblyInfoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  initialData?: AssemblyInfo;
}

export function AssemblyInfoFormModal({ isOpen, onClose, jobId, initialData }: AssemblyInfoFormModalProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertAssemblyInfoSchema),
    defaultValues: {
      jobId,
      moldSize: "",
      paint: "",
      robotTimeCope: "",
      robotTimeDrag: "",
      mpiCerted: "",
      assemblyNotes: "",
      coreBoxes: "",
      specialTooling: "",
    },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        jobId: initialData.jobId,
        moldSize: initialData.moldSize,
        paint: initialData.paint,
        robotTimeCope: initialData.robotTimeCope,
        robotTimeDrag: initialData.robotTimeDrag,
        mpiCerted: initialData.mpiCerted,
        assemblyNotes: initialData.assemblyNotes,
        coreBoxes: initialData.coreBoxes,
        specialTooling: initialData.specialTooling,
      });
    }
  }, [isOpen, initialData, form]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest(initialData?.id ? "PATCH" : "POST", `/api/jobs/${jobId}/assembly-info`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/assembly-info`] });
      toast({
        title: "Success",
        description: "Assembly information updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update assembly information",
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
          <h2 className="text-xl font-semibold">Edit Assembly Information</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-assembly-modal">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">
            <FormField label="Mold Size" name="moldSize" placeholder="Enter mold size" />
            <FormField label="Paint" name="paint" placeholder="Enter paint" />
            <FormField label="Robot Time Cope" name="robotTimeCope" placeholder="Enter robot time cope" />
            <FormField label="Robot Time Drag" name="robotTimeDrag" placeholder="Enter robot time drag" />
            <FormField label="MPI Certified" name="mpiCerted" placeholder="Enter MPI certification" />
            <FormField label="Assembly Notes" name="assemblyNotes" placeholder="Enter assembly notes" />
            <FormField label="Core Boxes" name="coreBoxes" placeholder="Enter core boxes" />
            <FormField label="Special Tooling" name="specialTooling" placeholder="Enter special tooling" />
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 p-4 border-t bg-card">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-assembly">
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-assembly">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
