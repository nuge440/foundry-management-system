import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { importedJobs } from "@/data/importedJobs";
import type { NdTestRequirements as NdTestRequirementsType } from "@shared/schema";
import { Loader2, Save, ScanSearch } from "lucide-react";

const ndTestFormSchema = z.object({
  jobId: z.string().min(1, "Job is required"),
  mpiRequired: z.boolean().default(false),
  mpiCertedInHouse: z.boolean().default(false),
  lpiRequired: z.boolean().default(false),
  lpiCertedInHouse: z.boolean().default(false),
  utRequired: z.boolean().default(false),
  xrayRequired: z.boolean().default(false),
  xrayNotes: z.string().default(""),
  scanIfRepeated: z.boolean().default(false),
  borescopeRequired: z.boolean().default(false),
  skimCuts: z.string().default(""),
});

type NdTestFormValues = z.infer<typeof ndTestFormSchema>;

export default function NdTestRequirements() {
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState<string>("");

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

  const { data: existingRequirements, isLoading: isLoadingRequirements } = useQuery<NdTestRequirementsType>({
    queryKey: ['/api/nd-test-requirements', selectedJobId],
    enabled: !!selectedJobId,
  });

  const form = useForm<NdTestFormValues>({
    resolver: zodResolver(ndTestFormSchema),
    defaultValues: {
      jobId: "",
      mpiRequired: false,
      mpiCertedInHouse: false,
      lpiRequired: false,
      lpiCertedInHouse: false,
      utRequired: false,
      xrayRequired: false,
      xrayNotes: "",
      scanIfRepeated: false,
      borescopeRequired: false,
      skimCuts: "",
    },
  });

  useMemo(() => {
    if (existingRequirements) {
      form.reset({
        jobId: existingRequirements.jobId,
        mpiRequired: existingRequirements.mpiRequired,
        mpiCertedInHouse: existingRequirements.mpiCertedInHouse,
        lpiRequired: existingRequirements.lpiRequired,
        lpiCertedInHouse: existingRequirements.lpiCertedInHouse,
        utRequired: existingRequirements.utRequired,
        xrayRequired: existingRequirements.xrayRequired,
        xrayNotes: existingRequirements.xrayNotes,
        scanIfRepeated: existingRequirements.scanIfRepeated,
        borescopeRequired: existingRequirements.borescopeRequired,
        skimCuts: existingRequirements.skimCuts,
      });
    } else if (selectedJobId) {
      form.reset({
        jobId: selectedJobId,
        mpiRequired: false,
        mpiCertedInHouse: false,
        lpiRequired: false,
        lpiCertedInHouse: false,
        utRequired: false,
        xrayRequired: false,
        xrayNotes: "",
        scanIfRepeated: false,
        borescopeRequired: false,
        skimCuts: "",
      });
    }
  }, [existingRequirements, selectedJobId, form]);

  const createMutation = useMutation({
    mutationFn: async (data: NdTestFormValues) => {
      return apiRequest("POST", "/api/nd-test-requirements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nd-test-requirements', selectedJobId] });
      toast({
        title: "Success",
        description: "ND test requirements saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save ND test requirements",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: NdTestFormValues & { id: string }) => {
      const { id, ...body } = data;
      return apiRequest("PATCH", `/api/nd-test-requirements/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nd-test-requirements', selectedJobId] });
      toast({
        title: "Success",
        description: "ND test requirements updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ND test requirements",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NdTestFormValues) => {
    if (existingRequirements) {
      updateMutation.mutate({ ...data, id: existingRequirements.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    form.setValue("jobId", jobId);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScanSearch className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">ND Test Requirements</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Job</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedJobId} onValueChange={handleJobSelect}>
            <SelectTrigger data-testid="select-job">
              <SelectValue placeholder="Select a job to view/edit ND test requirements" />
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
          <CardHeader>
            <CardTitle>
              {isLoadingRequirements ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : existingRequirements ? (
                "Edit ND Test Requirements"
              ) : (
                "New ND Test Requirements"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRequirements ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-muted-foreground">Magnetic Particle Inspection (MPI)</h3>
                      <FormField
                        control={form.control}
                        name="mpiRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-mpi-required"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">MPI Required</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mpiCertedInHouse"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-mpi-certed-in-house"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">MPI Certed In House</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-muted-foreground">Liquid Penetrant Inspection (LPI)</h3>
                      <FormField
                        control={form.control}
                        name="lpiRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-lpi-required"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">LPI Required</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lpiCertedInHouse"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-lpi-certed-in-house"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">LPI Certed In House</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-muted-foreground">Ultrasonic Testing (UT)</h3>
                      <FormField
                        control={form.control}
                        name="utRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-ut-required"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">UT Required</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-muted-foreground">X-Ray Inspection</h3>
                      <FormField
                        control={form.control}
                        name="xrayRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-xray-required"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">X-Ray Required</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="xrayNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>X-Ray Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter X-ray notes..."
                                className="resize-none"
                                {...field}
                                data-testid="input-xray-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-muted-foreground">Additional Testing</h3>
                      <FormField
                        control={form.control}
                        name="scanIfRepeated"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-scan-if-repeated"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Scan If Repeated</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="borescopeRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-borescope-required"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Borescope Required</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-muted-foreground">Skim Cuts</h3>
                      <FormField
                        control={form.control}
                        name="skimCuts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skim Cuts Details</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter skim cuts information..."
                                {...field}
                                data-testid="input-skim-cuts"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isPending} data-testid="button-save">
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Requirements
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
