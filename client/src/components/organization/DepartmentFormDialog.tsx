import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertDepartmentSchema, type Department } from "@shared/schema";

interface DepartmentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Department | null;
  departments: Department[];
}

const formSchema = insertDepartmentSchema;

export function DepartmentFormDialog({ isOpen, onClose, initialData, departments }: DepartmentFormDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      parentDepartmentId: undefined,
      color: "#64748b",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || "",
        parentDepartmentId: initialData.parentDepartmentId || undefined,
        color: initialData.color || "#64748b",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        parentDepartmentId: undefined,
        color: "#64748b",
      });
    }
  }, [initialData, isOpen, form]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: "Success",
        description: "Department created successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create department",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("PATCH", `/api/departments/${initialData?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: "Success",
        description: "Department updated successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update department",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const submitData = {
      ...data,
      parentDepartmentId: data.parentDepartmentId === "NONE" ? null : data.parentDepartmentId,
    };

    if (initialData) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (!isOpen) return null;

  const availableParents = departments.filter(d => d.id !== initialData?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid="dialog-department-form">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Department" : "Create Department"}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Update department information and hierarchy" 
              : "Add a new department to your organization"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Production, Engineering" data-testid="input-department-name" />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Brief description of this department"
                      data-testid="input-department-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentDepartmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "NONE"}
                    data-testid="select-parent-department"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">No Parent (Top Level)</SelectItem>
                      {availableParents.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center">
                      <Input 
                        {...field} 
                        type="color" 
                        className="w-20 h-10"
                        data-testid="input-department-color"
                      />
                      <Input 
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="#64748b"
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel-department"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-department"
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? "Saving..." 
                  : initialData ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
