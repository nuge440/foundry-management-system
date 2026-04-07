import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { insertUserManagementSchema, userRoles, availablePermissions } from "@shared/schema";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: User | null;
}

const formSchema = insertUserManagementSchema;

export function UserFormModal({ isOpen, onClose, initialData }: UserFormModalProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "Operator",
      permissions: [],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role as typeof userRoles[number],
        permissions: initialData.permissions as typeof availablePermissions[number][],
      });
    } else {
      form.reset({
        name: "",
        email: "",
        role: "Operator",
        permissions: [],
      });
    }
  }, [initialData, isOpen, form]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User created successfully. A temporary password has been generated.",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("PATCH", `/api/users/${initialData?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
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
            {initialData ? 'Edit User' : 'Add User'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-user-modal">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
            <div className="p-6 space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[140px_1fr] items-start gap-4">
                    <FormLabel className="text-right text-sm text-muted-foreground pt-2">Name</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input
                          placeholder="Enter full name"
                          {...field}
                          data-testid="input-user-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[140px_1fr] items-start gap-4">
                    <FormLabel className="text-right text-sm text-muted-foreground pt-2">Email</FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="user@foundry.com"
                          {...field}
                          data-testid="input-user-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[140px_1fr] items-start gap-4">
                    <FormLabel className="text-right text-sm text-muted-foreground pt-2">Role</FormLabel>
                    <div className="space-y-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-user-role">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userRoles.map((role) => (
                            <SelectItem key={role} value={role} data-testid={`option-role-${role.toLowerCase()}`}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[140px_1fr] items-start gap-4">
                    <FormLabel className="text-right text-sm text-muted-foreground pt-2">Permissions</FormLabel>
                    <div className="space-y-2">
                      <div className="space-y-3 border rounded-md p-4">
                        {availablePermissions.map((permission) => (
                          <FormItem
                            key={permission}
                            className="flex items-center gap-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permission)}
                                onCheckedChange={(checked) => {
                                  const updatedPermissions = checked
                                    ? [...(field.value || []), permission]
                                    : (field.value || []).filter((p) => p !== permission);
                                  field.onChange(updatedPermissions);
                                }}
                                data-testid={`checkbox-permission-${permission.toLowerCase().replace(/\s+/g, '-')}`}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {permission}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
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
                data-testid="button-cancel-user"
                disabled={isSubmitDisabled}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="button-save-user"
                disabled={isSubmitDisabled}
              >
                {isSubmitDisabled ? 'Saving...' : (initialData ? 'Update User' : 'Create User')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
