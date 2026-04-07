import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { importedJobs } from "@/data/importedJobs";
import type { LessonsLearned as LessonsLearnedType } from "@shared/schema";
import { Loader2, Save, BookOpen, Plus, Pencil, Trash2 } from "lucide-react";

const lessonsLearnedFormSchema = z.object({
  jobId: z.string().min(1, "Job is required"),
  entryDate: z.string().default(""),
  description: z.string().default(""),
  ncrReference: z.string().default(""),
  followUpActions: z.string().default(""),
  createdBy: z.string().default(""),
  ncrNumbers: z.string().default(""),
  notes: z.string().default(""),
});

type LessonsLearnedFormValues = z.infer<typeof lessonsLearnedFormSchema>;

export default function LessonsLearned() {
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LessonsLearnedType | null>(null);

  const jobs = useMemo(() => {
    const seen = new Set<string>();
    return importedJobs
      .filter((job) => job.jobNumber && job.jobNumber.trim() !== "")
      .filter((job) => {
        if (seen.has(job.jobNumber)) {
          return false;
        }
        seen.add(job.jobNumber);
        return true;
      })
      .map((job) => ({
        id: job.jobNumber,
        jobNumber: job.jobNumber,
        company: job.company,
        partNumber: job.partNumber,
      }));
  }, []);

  const { data: entries = [], isLoading: isLoadingEntries } = useQuery<LessonsLearnedType[]>({
    queryKey: ['/api/lessons-learned/job', selectedJobId],
    enabled: !!selectedJobId,
  });

  const form = useForm<LessonsLearnedFormValues>({
    resolver: zodResolver(lessonsLearnedFormSchema),
    defaultValues: {
      jobId: "",
      entryDate: "",
      description: "",
      ncrReference: "",
      followUpActions: "",
      createdBy: "",
      ncrNumbers: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LessonsLearnedFormValues) => {
      return apiRequest("POST", "/api/lessons-learned", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons-learned/job', selectedJobId] });
      toast({
        title: "Success",
        description: "Lessons learned entry saved successfully",
      });
      setIsDialogOpen(false);
      form.reset({ jobId: selectedJobId });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save lessons learned entry",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LessonsLearnedFormValues & { id: string }) => {
      const { id, ...body } = data;
      return apiRequest("PATCH", `/api/lessons-learned/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons-learned/job', selectedJobId] });
      toast({
        title: "Success",
        description: "Lessons learned entry updated successfully",
      });
      setIsDialogOpen(false);
      setEditingEntry(null);
      form.reset({ jobId: selectedJobId });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lessons learned entry",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/lessons-learned/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons-learned/job', selectedJobId] });
      toast({
        title: "Success",
        description: "Lessons learned entry deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete lessons learned entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LessonsLearnedFormValues) => {
    if (editingEntry) {
      updateMutation.mutate({ ...data, id: editingEntry.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    form.setValue("jobId", jobId);
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    form.reset({
      jobId: selectedJobId,
      entryDate: new Date().toISOString().split('T')[0],
      description: "",
      ncrReference: "",
      followUpActions: "",
      createdBy: "",
      ncrNumbers: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (entry: LessonsLearnedType) => {
    setEditingEntry(entry);
    form.reset({
      jobId: entry.jobId,
      entryDate: entry.entryDate,
      description: entry.description,
      ncrReference: entry.ncrReference,
      followUpActions: entry.followUpActions,
      createdBy: entry.createdBy,
      ncrNumbers: entry.ncrNumbers,
      notes: entry.notes,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteMutation.mutate(id);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Lessons Learned</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Job</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedJobId} onValueChange={handleJobSelect}>
            <SelectTrigger data-testid="select-job">
              <SelectValue placeholder="Select a job to view/add lessons learned" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id} data-testid={`select-item-job-${job.id}`}>
                  {job.jobNumber} - {job.company} - {job.partNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedJobId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>
              {isLoadingEntries ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                `Lessons Learned Entries (${entries.length})`
              )}
            </CardTitle>
            <Button onClick={handleAddNew} data-testid="button-add-new">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingEntries ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No lessons learned entries for this job. Click "Add Entry" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>NCR Reference</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} data-testid={`row-lesson-${entry.id}`}>
                      <TableCell>{entry.entryDate}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{entry.description}</TableCell>
                      <TableCell>{entry.ncrReference}</TableCell>
                      <TableCell>{entry.createdBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(entry)}
                            data-testid={`button-edit-${entry.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(entry.id)}
                            data-testid={`button-delete-${entry.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Lessons Learned Entry" : "Add Lessons Learned Entry"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="entryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-entry-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="createdBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Created By</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name..." {...field} data-testid="input-created-by" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter lesson learned description..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ncrReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NCR Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter NCR reference..." {...field} data-testid="input-ncr-reference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ncrNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NCR Numbers</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter NCR numbers..." {...field} data-testid="input-ncr-numbers" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="followUpActions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow Up Actions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter follow up actions..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-follow-up-actions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter additional notes..."
                        className="resize-none"
                        rows={2}
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} data-testid="button-save">
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
