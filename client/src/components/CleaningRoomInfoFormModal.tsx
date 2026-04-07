import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertCleaningRoomInfoSchema, type CleaningRoomInfo } from "@shared/schema";

interface CleaningRoomInfoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  initialData?: CleaningRoomInfo;
}

export function CleaningRoomInfoFormModal({ isOpen, onClose, jobId, initialData }: CleaningRoomInfoFormModalProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertCleaningRoomInfoSchema),
    defaultValues: {
      jobId,
      cleanTime: "",
      moldRating: "",
      pouringPictures: "",
      castingPictures: "",
      coreAssembly: "",
      coreCost: "",
      moldAssembly: "",
      castingWeightLbs: "",
      pourPoint: "",
      assembly: "",
      additionalNotesInitial: "",
    },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        jobId: initialData.jobId,
        cleanTime: initialData.cleanTime,
        moldRating: initialData.moldRating,
        pouringPictures: initialData.pouringPictures,
        castingPictures: initialData.castingPictures,
        coreAssembly: initialData.coreAssembly,
        coreCost: initialData.coreCost,
        moldAssembly: initialData.moldAssembly,
        castingWeightLbs: initialData.castingWeightLbs,
        pourPoint: initialData.pourPoint,
        assembly: initialData.assembly,
        additionalNotesInitial: initialData.additionalNotesInitial,
      });
    }
  }, [isOpen, initialData, form]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest(initialData?.id ? "PATCH" : "POST", `/api/jobs/${jobId}/cleaning-info`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/cleaning-info`] });
      toast({
        title: "Success",
        description: "Cleaning room information updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cleaning room information",
        variant: "destructive",
      });
    },
  });

  if (!isOpen) return null;

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const FormField = ({ label, name, placeholder, type = "input" }: { label: string; name: any; placeholder: string; type?: "input" | "textarea" }) => (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4">
      <Label className="text-right text-sm text-muted-foreground">{label}</Label>
      {type === "textarea" ? (
        <Textarea 
          {...form.register(name)} 
          placeholder={placeholder}
          data-testid={`input-${name}`}
        />
      ) : (
        <Input 
          {...form.register(name)} 
          placeholder={placeholder}
          data-testid={`input-${name}`}
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border rounded-md w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-card z-10">
          <h2 className="text-xl font-semibold">Edit Cleaning Room Information</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-cleaning-modal">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">
            <FormField label="Clean Time" name="cleanTime" placeholder="Enter clean time" />
            <FormField label="Mold Rating" name="moldRating" placeholder="Enter mold rating" />
            <FormField label="Pouring Pictures" name="pouringPictures" placeholder="Enter pouring pictures" />
            <FormField label="Casting Pictures" name="castingPictures" placeholder="Enter casting pictures" />
            <FormField label="Core Assembly" name="coreAssembly" placeholder="Enter core assembly" />
            <FormField label="Core Cost" name="coreCost" placeholder="Enter core cost" />
            <FormField label="Mold Assembly" name="moldAssembly" placeholder="Enter mold assembly" />
            <FormField label="Casting Weight (lbs)" name="castingWeightLbs" placeholder="Enter casting weight" />
            <FormField label="Pour Point" name="pourPoint" placeholder="Enter pour point" />
            <FormField label="Assembly" name="assembly" placeholder="Enter assembly" />
            <FormField label="Additional Notes" name="additionalNotesInitial" placeholder="Enter additional notes" type="textarea" />
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 p-4 border-t bg-card">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-cleaning">
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-cleaning">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
