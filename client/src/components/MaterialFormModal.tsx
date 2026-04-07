import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Material } from "@shared/schema";
import { insertMaterialSchema } from "@shared/schema";

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Material | null;
}

const formSchema = insertMaterialSchema;

export function MaterialFormModal({ isOpen, onClose, initialData }: MaterialFormModalProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      description: "",
      documentPath: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        code: initialData.code,
        description: initialData.description,
        documentPath: initialData.documentPath || "",
      });
    } else {
      form.reset({
        code: "",
        description: "",
        documentPath: "",
      });
    }
  }, [initialData, isOpen, form]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/materials", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({
        title: "Success",
        description: "Material created successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create material",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("PATCH", `/api/materials/${initialData?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({
        title: "Success",
        description: "Material updated successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update material",
        variant: "destructive",
      });
    },
  });

  if (!isOpen) return null;

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (initialData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitDisabled = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border rounded-md w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-card z-10">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Edit Material' : 'Add Material'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-material-modal">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
            <div className="p-6 space-y-5">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[140px_1fr] items-start gap-4">
                    <FormLabel className="text-right text-sm text-muted-foreground pt-2">Code</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input
                          placeholder="Enter material code"
                          {...field}
                          data-testid="input-material-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[140px_1fr] items-start gap-4">
                    <FormLabel className="text-right text-sm text-muted-foreground pt-2">Description</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input
                          placeholder="Enter material description"
                          {...field}
                          data-testid="input-material-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentPath"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[140px_1fr] items-start gap-4">
                    <FormLabel className="text-right text-sm text-muted-foreground pt-2">Document Path</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input
                          placeholder="Enter document path (optional)"
                          {...field}
                          data-testid="input-material-document-path"
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t bg-card">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitDisabled}
                data-testid="button-cancel-material"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                data-testid="button-submit-material"
              >
                {isSubmitDisabled ? "Saving..." : initialData ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
