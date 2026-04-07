import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import type { Schedule, User, ShiftTemplate, InsertShiftTemplate } from "@shared/schema";
import { scheduleStatuses, userRoles, insertShiftTemplateSchema } from "@shared/schema";
import { ShiftTemplateFormDialog } from "@/components/scheduling/ShiftTemplateFormDialog";

const scheduleFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  department: z.string().nullable().optional(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  status: z.enum(scheduleStatuses).default("scheduled"),
  notes: z.string().default(""),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

export default function EmployeeScheduling() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [viewMode, setViewMode] = useState<"week" | "list">("week");
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: shiftTemplates = [] } = useQuery<ShiftTemplate[]>({
    queryKey: ["/api/shift-templates"],
  });

  const createForm = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      userId: "",
      department: null,
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "08:00",
      endTime: "17:00",
      status: "scheduled",
      notes: "",
    },
  });

  const editForm = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      userId: "",
      department: null,
      date: "",
      startTime: "",
      endTime: "",
      status: "scheduled",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      return await apiRequest("POST", "/api/schedules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Schedule created",
        description: "Employee shift has been scheduled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create schedule",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ScheduleFormData }) => {
      return await apiRequest("PATCH", `/api/schedules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setEditDialogOpen(false);
      setSelectedSchedule(null);
      toast({
        title: "Schedule updated",
        description: "Employee shift has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/schedules/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Schedule deleted",
        description: "Employee shift has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertShiftTemplate) => {
      return await apiRequest("POST", "/api/shift-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-templates"] });
      setTemplateFormOpen(false);
      setSelectedTemplate(null);
      toast({
        title: "Template created",
        description: "Shift template has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create shift template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertShiftTemplate }) => {
      return await apiRequest("PATCH", `/api/shift-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-templates"] });
      setTemplateFormOpen(false);
      setSelectedTemplate(null);
      toast({
        title: "Template updated",
        description: "Shift template has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update shift template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/shift-templates/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-templates"] });
      toast({
        title: "Template deleted",
        description: "Shift template has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete shift template",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: ScheduleFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: ScheduleFormData) => {
    if (selectedSchedule) {
      updateMutation.mutate({ id: selectedSchedule.id, data });
    }
  };

  const applyTemplate = (template: ShiftTemplate) => {
    createForm.setValue("startTime", template.startTime);
    createForm.setValue("endTime", template.endTime);
  };

  const onTemplateSubmit = (data: InsertShiftTemplate) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleEditClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    editForm.reset({
      userId: schedule.userId,
      department: schedule.department || undefined,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: schedule.status as any,
      notes: schedule.notes,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (scheduleId: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteMutation.mutate(scheduleId);
    }
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || "Unknown User";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(schedule => 
      isSameDay(parseISO(schedule.date), date)
    );
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const upcomingSchedules = schedules
    .filter(s => new Date(s.date) >= new Date() && s.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Employee Scheduling
          </h1>
          <p className="text-muted-foreground">Schedule and manage employee shifts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "week" ? "list" : "week")}
            data-testid="button-toggle-view"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {viewMode === "week" ? "List View" : "Week View"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setTemplatesDialogOpen(true)}
            data-testid="button-manage-templates"
          >
            <Clock className="h-4 w-4 mr-2" />
            Manage Templates
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-schedule">
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-schedules">
              {schedules.length}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-upcoming-shifts">
              {upcomingSchedules.length}
            </div>
            <p className="text-xs text-muted-foreground">Next 10 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-employees">
              {new Set(upcomingSchedules.map(s => s.userId)).size}
            </div>
            <p className="text-xs text-muted-foreground">With upcoming shifts</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === "week" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  {format(currentWeekStart, "MMM d")} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), "MMM d, yyyy")}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek} data-testid="button-prev-week">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek} data-testid="button-next-week">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, idx) => {
                const daySchedules = getSchedulesForDate(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={idx}
                    className={`border rounded-md p-3 min-h-[200px] ${
                      isToday ? "bg-accent/50" : ""
                    }`}
                    data-testid={`day-column-${idx}`}
                  >
                    <div className="font-medium text-sm mb-2">
                      <div>{format(day, "EEE")}</div>
                      <div className={`text-xl ${isToday ? "text-primary" : ""}`}>
                        {format(day, "d")}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {daySchedules.map(schedule => {
                        const user = users.find(u => u.id === schedule.userId);
                        
                        return (
                          <div
                            key={schedule.id}
                            className="text-xs p-2 rounded border bg-card hover-elevate cursor-pointer"
                            onClick={() => handleEditClick(schedule)}
                            data-testid={`schedule-card-${schedule.id}`}
                          >
                            <div className="font-medium">{user?.name}</div>
                            <div className="text-muted-foreground">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                            {schedule.department && (
                              <div className="text-muted-foreground truncate">
                                {schedule.department}
                              </div>
                            )}
                            <Badge variant={getStatusBadgeVariant(schedule.status)} className="mt-1">
                              {schedule.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedules</CardTitle>
            <CardDescription>All scheduled shifts in chronological order</CardDescription>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
            ) : upcomingSchedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming schedules. Click "Create Schedule" to add a shift.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.map(schedule => {
                  const user = users.find(u => u.id === schedule.userId);
                  
                  return (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                      data-testid={`schedule-list-item-${schedule.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{user?.name || "Unknown User"}</div>
                          <Badge variant={getStatusBadgeVariant(schedule.status)}>
                            {schedule.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(parseISO(schedule.date), "EEEE, MMMM d, yyyy")} • {schedule.startTime} - {schedule.endTime}
                        </div>
                        {schedule.department && (
                          <div className="text-sm text-muted-foreground">
                            Department/Role: {schedule.department}
                          </div>
                        )}
                        {schedule.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {schedule.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(schedule)}
                          data-testid={`button-edit-${schedule.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(schedule.id)}
                          data-testid={`button-delete-${schedule.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-schedule">
          <DialogHeader>
            <DialogTitle>Create Schedule</DialogTitle>
            <DialogDescription>Schedule an employee shift</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-create-user">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} - {user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>Use Shift Template (Optional)</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const template = shiftTemplates.find(t => t.id === value);
                    if (template) applyTemplate(template);
                  }}
                >
                  <SelectTrigger data-testid="select-shift-template">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: template.color }} />
                          {template.name} ({template.startTime} - {template.endTime})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                control={createForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-create-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-create-start-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-create-end-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department/Role (Optional)</FormLabel>
                    <Select
                      value={field.value || "NONE"}
                      onValueChange={(value) => field.onChange(value === "NONE" ? null : value)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-create-department">
                          <SelectValue placeholder="No specific department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">No specific department</SelectItem>
                        {userRoles.map(role => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information..."
                        {...field}
                        data-testid="input-create-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-confirm-create"
                >
                  {createMutation.isPending ? "Creating..." : "Create Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-schedule">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>Update employee shift details</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-user">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} - {user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-edit-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-edit-start-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-edit-end-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department/Role (Optional)</FormLabel>
                    <Select
                      value={field.value || "NONE"}
                      onValueChange={(value) => field.onChange(value === "NONE" ? null : value)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-department">
                          <SelectValue placeholder="No specific department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">No specific department</SelectItem>
                        {userRoles.map(role => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information..."
                        {...field}
                        data-testid="input-edit-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-confirm-edit"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Shift Template Form Dialog */}
      <ShiftTemplateFormDialog
        open={templateFormOpen}
        onOpenChange={(open) => {
          setTemplateFormOpen(open);
          if (!open) setSelectedTemplate(null);
        }}
        template={selectedTemplate || undefined}
        onSubmit={onTemplateSubmit}
        isPending={createTemplateMutation.isPending || updateTemplateMutation.isPending}
      />

      {/* Templates Management Dialog */}
      <Dialog open={templatesDialogOpen} onOpenChange={setTemplatesDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" data-testid="dialog-manage-templates">
          <DialogHeader>
            <DialogTitle>Manage Shift Templates</DialogTitle>
            <DialogDescription>
              Create and manage reusable shift templates for quick scheduling
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              onClick={() => {
                setSelectedTemplate(null);
                setTemplateFormOpen(true);
              }}
              data-testid="button-create-template"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>

            <div className="space-y-2">
              {shiftTemplates.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No shift templates yet. Create one to get started!
                </p>
              ) : (
                shiftTemplates.map((template) => (
                  <Card key={template.id} data-testid={`template-card-${template.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: template.color }}
                          />
                          <div>
                            <h3 className="font-medium">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {template.startTime} - {template.endTime}
                              {template.description && ` • ${template.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setTemplateFormOpen(true);
                            }}
                            data-testid={`button-edit-template-${template.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete "${template.name}" template?`)) {
                                deleteTemplateMutation.mutate(template.id);
                              }
                            }}
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
