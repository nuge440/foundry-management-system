import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building2, Users, Shield, Edit, Trash2, Network, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Department, Position, CustomPermission } from "@shared/schema";
import { DepartmentFormDialog } from "@/components/organization/DepartmentFormDialog";
import { PositionFormDialog } from "@/components/organization/PositionFormDialog";
import { PermissionFormDialog } from "@/components/organization/PermissionFormDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function OrganizationSetup() {
  const { toast } = useToast();
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [editingPermission, setEditingPermission] = useState<CustomPermission | null>(null);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [selectedDepartmentForPosition, setSelectedDepartmentForPosition] = useState<string | null>(null);

  const { data: departments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: positions = [], isLoading: positionsLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<CustomPermission[]>({
    queryKey: ["/api/custom-permissions"],
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive",
      });
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({
        title: "Success",
        description: "Position deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete position",
        variant: "destructive",
      });
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/custom-permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-permissions"] });
      toast({
        title: "Success",
        description: "Permission deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete permission",
        variant: "destructive",
      });
    },
  });

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setIsDepartmentDialogOpen(true);
  };

  const handleEditPosition = (pos: Position) => {
    setEditingPosition(pos);
    setIsPositionDialogOpen(true);
  };

  const handleEditPermission = (perm: CustomPermission) => {
    setEditingPermission(perm);
    setIsPermissionDialogOpen(true);
  };

  const handleDeleteDepartment = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the "${name}" department? This action cannot be undone.`)) {
      deleteDepartmentMutation.mutate(id);
    }
  };

  const handleDeletePosition = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the "${name}" position?`)) {
      deletePositionMutation.mutate(id);
    }
  };

  const handleDeletePermission = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the "${name}" permission?`)) {
      deletePermissionMutation.mutate(id);
    }
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return "None";
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || "Unknown";
  };

  const toggleDepartment = (deptId: string) => {
    setExpandedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  const getPositionsByDepartment = (deptId: string) => {
    return positions.filter(pos => pos.departmentId === deptId);
  };

  const handleCreatePositionForDepartment = (deptId: string) => {
    setSelectedDepartmentForPosition(deptId);
    setEditingPosition(null);
    setIsPositionDialogOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="page-organization-setup">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Organization Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your company hierarchy, positions, and access rights
          </p>
        </div>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList data-testid="tabs-organization">
          <TabsTrigger value="departments" data-testid="tab-departments">
            <Building2 className="w-4 h-4 mr-2" />
            Departments & Positions
          </TabsTrigger>
          <TabsTrigger value="permissions" data-testid="tab-permissions">
            <Shield className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        {/* Departments & Positions Tab */}
        <TabsContent value="departments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Departments & Positions</h2>
              <p className="text-sm text-muted-foreground">
                Manage organizational hierarchy with departments and their positions
              </p>
            </div>
            <Button 
              onClick={() => { setEditingDepartment(null); setIsDepartmentDialogOpen(true); }}
              data-testid="button-create-department"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Department
            </Button>
          </div>

          {departmentsLoading || positionsLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading organization...
              </CardContent>
            </Card>
          ) : departments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No departments yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first department to get started
                </p>
                <Button 
                  onClick={() => { setEditingDepartment(null); setIsDepartmentDialogOpen(true); }}
                  data-testid="button-create-first-department"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Department
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {departments.map((dept) => {
                const deptPositions = getPositionsByDepartment(dept.id);
                const isExpanded = expandedDepartments.has(dept.id);
                
                return (
                  <Card key={dept.id} data-testid={`card-department-${dept.id}`}>
                    <Collapsible 
                      open={isExpanded}
                      onOpenChange={() => toggleDepartment(dept.id)}
                    >
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <CollapsibleTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="flex-shrink-0"
                              data-testid={`button-toggle-department-${dept.id}`}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: dept.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base truncate">{dept.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {dept.description || "No description"}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="flex-shrink-0">
                            {deptPositions.length} {deptPositions.length === 1 ? 'position' : 'positions'}
                          </Badge>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleCreatePositionForDepartment(dept.id)}
                            data-testid={`button-add-position-${dept.id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleEditDepartment(dept)}
                            data-testid={`button-edit-department-${dept.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                            data-testid={`button-delete-department-${dept.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {dept.parentDepartmentId && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 pb-4 border-b">
                              <Network className="w-3 h-3" />
                              <span>Parent: {getDepartmentName(dept.parentDepartmentId)}</span>
                            </div>
                          )}
                          
                          {deptPositions.length === 0 ? (
                            <div className="text-center py-8 bg-muted/30 rounded-md">
                              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mb-3">
                                No positions in this department yet
                              </p>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleCreatePositionForDepartment(dept.id)}
                                data-testid={`button-create-first-position-${dept.id}`}
                              >
                                <Plus className="w-3 h-3 mr-2" />
                                Add Position
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {deptPositions.map((position) => (
                                <div 
                                  key={position.id}
                                  className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                                  data-testid={`card-position-${position.id}`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-sm truncate">
                                        {position.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {position.description || "No description"}
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="flex-shrink-0">
                                      Level {position.level}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0 ml-2">
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => handleEditPosition(position)}
                                      data-testid={`button-edit-position-${position.id}`}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => handleDeletePosition(position.id, position.name)}
                                      data-testid={`button-delete-position-${position.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Permissions</h2>
              <p className="text-sm text-muted-foreground">
                Define custom access rights and permissions for positions
              </p>
            </div>
            <Button 
              onClick={() => { setEditingPermission(null); setIsPermissionDialogOpen(true); }}
              data-testid="button-create-permission"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Permission
            </Button>
          </div>

          {permissionsLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading permissions...
              </CardContent>
            </Card>
          ) : permissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No permissions yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first permission to get started
                </p>
                <Button 
                  onClick={() => { setEditingPermission(null); setIsPermissionDialogOpen(true); }}
                  data-testid="button-create-first-permission"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Permission
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Permission Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                    <th className="px-4 py-3 text-left font-semibold">Module</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => (
                    <tr key={permission.id} className="border-t hover-elevate" data-testid={`row-permission-${permission.id}`}>
                      <td className="px-4 py-3 font-medium">{permission.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {permission.description || "No description"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge>{permission.module}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditPermission(permission)}
                            data-testid={`button-edit-permission-${permission.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeletePermission(permission.id, permission.name)}
                            data-testid={`button-delete-permission-${permission.id}`}
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
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DepartmentFormDialog
        isOpen={isDepartmentDialogOpen}
        onClose={() => {
          setIsDepartmentDialogOpen(false);
          setEditingDepartment(null);
        }}
        initialData={editingDepartment}
        departments={departments}
      />

      <PositionFormDialog
        isOpen={isPositionDialogOpen}
        onClose={() => {
          setIsPositionDialogOpen(false);
          setEditingPosition(null);
          setSelectedDepartmentForPosition(null);
        }}
        initialData={editingPosition}
        departments={departments}
        preselectedDepartmentId={selectedDepartmentForPosition}
      />

      <PermissionFormDialog
        isOpen={isPermissionDialogOpen}
        onClose={() => {
          setIsPermissionDialogOpen(false);
          setEditingPermission(null);
        }}
        initialData={editingPermission}
      />
    </div>
  );
}
