import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, PlayCircle, StopCircle, TrendingUp, Users, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import type { TimeEntry, Job, User } from "@shared/schema";

const clockInSchema = z.object({
  jobId: z.string().nullable(),
  notes: z.string().default(""),
});

const clockOutSchema = z.object({
  piecesCompleted: z.coerce.number().int().min(0).default(0),
});

type ClockInFormData = z.infer<typeof clockInSchema>;
type ClockOutFormData = z.infer<typeof clockOutSchema>;

export default function TimeAttendance() {
  const { toast } = useToast();
  const [clockInDialogOpen, setClockInDialogOpen] = useState(false);
  const [clockOutDialogOpen, setClockOutDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  useEffect(() => {
    const savedUserId = localStorage.getItem('selectedUserId');
    if (savedUserId && users.some(u => u.id === savedUserId)) {
      setSelectedUserId(savedUserId);
    }
  }, [users]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    localStorage.setItem('selectedUserId', userId);
  };

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: allTimeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  const { data: activeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries/active"],
  });

  const currentUser = users.find(u => u.id === selectedUserId);
  const myActiveEntry = activeEntries.find(e => e.userId === selectedUserId);

  const clockInForm = useForm<ClockInFormData>({
    resolver: zodResolver(clockInSchema),
    defaultValues: {
      jobId: null,
      notes: "",
    },
  });

  const clockOutForm = useForm<ClockOutFormData>({
    resolver: zodResolver(clockOutSchema),
    defaultValues: {
      piecesCompleted: 0,
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (data: ClockInFormData) => {
      if (!selectedUserId) {
        throw new Error("No user selected");
      }
      return await apiRequest("POST", "/api/time-entries", {
        userId: selectedUserId,
        jobId: data.jobId || null,
        clockIn: new Date().toISOString(),
        notes: data.notes || "",
        piecesCompleted: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      setClockInDialogOpen(false);
      clockInForm.reset();
      toast({
        title: "Clocked In",
        description: "You are now clocked in.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clock in. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (data: { entryId: string; piecesCompleted: number }) => {
      return await apiRequest("PATCH", `/api/time-entries/${data.entryId}/clock-out`, {
        clockOut: new Date().toISOString(),
        piecesCompleted: data.piecesCompleted,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setClockOutDialogOpen(false);
      setSelectedEntry(null);
      clockOutForm.reset();
      toast({
        title: "Clocked Out",
        description: "You have been clocked out successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clock out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClockIn = (data: ClockInFormData) => {
    clockInMutation.mutate(data);
  };

  const handleClockOut = (data: ClockOutFormData) => {
    if (myActiveEntry) {
      clockOutMutation.mutate({
        entryId: myActiveEntry.id,
        piecesCompleted: data.piecesCompleted,
      });
    }
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || "Unknown User";
  };

  const getJobInfo = (jobId: string | null) => {
    if (!jobId) return null;
    return jobs.find(j => j.id === jobId);
  };

  const calculateDuration = (clockIn: string, clockOut: string | null) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, totalHours: diffMs / (1000 * 60 * 60) };
  };

  const jobAnalytics = jobs.map(job => {
    const jobEntries = allTimeEntries.filter(e => e.jobId === job.id && e.clockOut);
    const totalPieces = jobEntries.reduce((sum, e) => sum + e.piecesCompleted, 0);
    const totalHours = jobEntries.reduce((sum, e) => {
      const duration = calculateDuration(e.clockIn, e.clockOut);
      return sum + duration.totalHours;
    }, 0);
    const avgTimePerPart = totalPieces > 0 ? (totalHours * 60) / totalPieces : 0;
    
    return {
      job,
      totalPieces,
      totalHours: totalHours.toFixed(2),
      avgTimePerPart: avgTimePerPart.toFixed(2),
      entriesCount: jobEntries.length,
    };
  }).filter(a => a.entriesCount > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Time & Attendance
        </h1>
        <p className="text-muted-foreground">Track work time, log pieces completed, and view productivity metrics</p>
      </div>

      {!selectedUserId && (
        <Alert data-testid="alert-no-user-selected">
          <AlertDescription>
            Please select your user profile below to begin tracking time.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Your User Profile</CardTitle>
          <CardDescription>Choose your user to track your time and productivity</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users available. Please create a user first.</p>
          ) : (
            <Select value={selectedUserId || ""} onValueChange={handleUserSelect}>
              <SelectTrigger data-testid="select-user">
                <SelectValue placeholder="Select your user profile" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {currentUser && (
            <p className="text-sm text-muted-foreground mt-2" data-testid="text-selected-user">
              Currently selected: <span className="font-medium">{currentUser.name}</span> ({currentUser.role})
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-user-status">
              {myActiveEntry ? "Clocked In" : "Clocked Out"}
            </div>
            {myActiveEntry && (
              <p className="text-xs text-muted-foreground" data-testid="text-clock-in-time">
                {formatDistanceToNow(new Date(myActiveEntry.clockIn), { addSuffix: true })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Personnel</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-personnel">
              {activeEntries.length}
            </div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-jobs">
              {new Set(activeEntries.filter(e => e.jobId).map(e => e.jobId)).size}
            </div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-entries">
              {allTimeEntries.length}
            </div>
            <p className="text-xs text-muted-foreground">All time logged</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Clock in or out of work</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          {!myActiveEntry ? (
            <Button
              onClick={() => setClockInDialogOpen(true)}
              className="gap-2"
              disabled={!selectedUserId}
              data-testid="button-clock-in"
            >
              <PlayCircle className="h-4 w-4" />
              Clock In
            </Button>
          ) : (
            <Button
              onClick={() => setClockOutDialogOpen(true)}
              variant="destructive"
              className="gap-2"
              data-testid="button-clock-out"
            >
              <StopCircle className="h-4 w-4" />
              Clock Out
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Time Entries</CardTitle>
          <CardDescription>Personnel currently clocked in</CardDescription>
        </CardHeader>
        <CardContent>
          {activeEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active time entries</p>
          ) : (
            <div className="space-y-4">
              {activeEntries.map(entry => {
                const job = getJobInfo(entry.jobId);
                const duration = calculateDuration(entry.clockIn, null);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-md"
                    data-testid={`entry-active-${entry.id}`}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{getUserName(entry.userId)}</p>
                      {job && (
                        <p className="text-sm text-muted-foreground">
                          Job: {job.jobNumber} - {job.company}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Started {formatDistanceToNow(new Date(entry.clockIn), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {duration.hours}h {duration.minutes}m
                      </p>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Productivity Analytics</CardTitle>
          <CardDescription>Average time per part and production metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {jobAnalytics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed time entries with production data</p>
          ) : (
            <div className="space-y-4">
              {jobAnalytics.map(({ job, totalPieces, totalHours, avgTimePerPart, entriesCount }) => (
                <div
                  key={job.id}
                  className="p-4 border rounded-md"
                  data-testid={`analytics-job-${job.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{job.jobNumber} - {job.company}</p>
                      <p className="text-sm text-muted-foreground">Part: {job.partNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{avgTimePerPart} min</p>
                      <p className="text-xs text-muted-foreground">Avg per part</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-medium">{totalPieces} / {job.quantityNeeded}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Hours</p>
                      <p className="font-medium">{totalHours}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time Entries</p>
                      <p className="font-medium">{entriesCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={clockInDialogOpen} onOpenChange={setClockInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock In</DialogTitle>
            <DialogDescription>
              Start tracking your work time. Optionally select a job to track production.
            </DialogDescription>
          </DialogHeader>
          <Form {...clockInForm}>
            <form onSubmit={clockInForm.handleSubmit(handleClockIn)} className="space-y-4">
              <FormField
                control={clockInForm.control}
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job (Optional)</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-job">
                          <SelectValue placeholder="Select a job" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Job (General Time)</SelectItem>
                        {jobs.map(job => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.jobNumber} - {job.company} ({job.partNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={clockInForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any notes about this work session"
                        data-testid="input-clock-in-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setClockInDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={clockInMutation.isPending} data-testid="button-confirm-clock-in">
                  {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={clockOutDialogOpen} onOpenChange={setClockOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock Out</DialogTitle>
            <DialogDescription>
              End your work session and optionally log the number of pieces you completed.
            </DialogDescription>
          </DialogHeader>
          {myActiveEntry && getJobInfo(myActiveEntry.jobId) && (
            <div className="p-4 bg-muted rounded-md space-y-1">
              <p className="text-sm font-medium">Current Job</p>
              <p className="text-sm text-muted-foreground">
                {getJobInfo(myActiveEntry.jobId)?.jobNumber} - {getJobInfo(myActiveEntry.jobId)?.company}
              </p>
            </div>
          )}
          <Form {...clockOutForm}>
            <form onSubmit={clockOutForm.handleSubmit(handleClockOut)} className="space-y-4">
              {myActiveEntry?.jobId && (
                <FormField
                  control={clockOutForm.control}
                  name="piecesCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pieces Completed</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          placeholder="0"
                          data-testid="input-pieces-completed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setClockOutDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={clockOutMutation.isPending} data-testid="button-confirm-clock-out">
                  {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
