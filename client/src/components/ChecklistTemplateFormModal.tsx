import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChecklistTemplate } from "@shared/schema";
import { insertChecklistTemplateSchema } from "@shared/schema";

interface ChecklistTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ChecklistTemplate | null;
}

export function ChecklistTemplateFormModal({
  isOpen,
  onClose,
  initialData,
}: ChecklistTemplateFormModalProps) {
  const { toast } = useToast();
  const isEditing = !!initialData;

  const form = useForm<z.infer<typeof insertChecklistTemplateSchema>>({
    resolver: zodResolver(insertChecklistTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          description: initialData.description || "",
        });
      } else {
        form.reset({
          name: "",
          description: "",
        });
      }
    }
  }, [isOpen, initialData, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof insertChecklistTemplateSchema>) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/checklist-templates/${initialData.id}`, values);
      } else {
        return await apiRequest("POST", "/api/checklist-templates", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({
        title: "Success",
        description: `Template ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} template`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof insertChecklistTemplateSchema>) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Template" : "New Checklist Template"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Quality Control Checklist"
                      {...field}
                      data-testid="input-template-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this checklist is used for..."
                      rows={3}
                      {...field}
                      data-testid="input-template-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-submit"
              >
                {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
