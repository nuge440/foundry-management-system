import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserFormModal } from "@/components/UserFormModal";
import type { User } from "@shared/schema";

const roleColors: Record<string, string> = {
  Admin: "bg-destructive/20 text-destructive",
  Manager: "bg-primary/20 text-primary",
  Designer: "bg-status-solidification/20 text-status-solidification",
  Operator: "bg-muted text-muted-foreground",
};

export default function UserManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-user-management">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <div className="text-center py-12 text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-user-management">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <Button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }} 
          data-testid="button-add-user"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Name</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Email</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Department</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Job Title</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Permissions</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr
                key={user.id}
                className={cn(
                  "border-t hover-elevate transition-colors",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                )}
                data-testid={`row-user-${user.id}`}
              >
                <td className="px-4 py-3 whitespace-nowrap font-medium">{user.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground" data-testid={`text-department-${user.id}`}>
                  {(user as any).department || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground" data-testid={`text-job-title-${user.id}`}>
                  {(user as any).jobTitle || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={cn("text-xs", roleColors[user.role])}>
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(user)}
                      data-testid={`button-edit-user-${user.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(user.id)}
                      data-testid={`button-delete-user-${user.id}`}
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

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
        initialData={editingUser}
      />
    </div>
  );
}
