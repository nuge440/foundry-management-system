import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import type { PouringInstructions as PouringInstructionsType } from "@shared/schema";
import { Loader2, Save, Flame } from "lucide-react";

const pouringFormSchema = z.object({
  jobId: z.string().min(1, "Job is required"),
  pourTempMin: z.string().default(""),
  pourTempMax: z.string().default(""),
  pourUphill: z.boolean().default(false),
  pourUphillStep: z.string().default(""),
  tapOutTemp: z.string().default(""),
  vacuumVents: z.boolean().default(false),
  vacuumTime: z.string().default(""),
  hotTop: z.boolean().default(false),
  knockOffRisers: z.boolean().default(false),
  degasInLadle: z.boolean().default(false),
  testBarType: z.string().default(""),
  charpyRequired: z.boolean().default(false),
  buildWall: z.boolean().default(false),
  needsBorescope: z.boolean().default(false),
  tiltStepDirection: z.string().default(""),
});

type PouringFormValues = z.infer<typeof pouringFormSchema>;

export default function PouringInstructions() {
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

  const { data: existingInstructions, isLoading: isLoadingInstructions } = useQuery<PouringInstructionsType>({
    queryKey: ['/api/pouring-instructions', selectedJobId],
    enabled: !!selectedJobId,
  });

  const form = useForm<PouringFormValues>({
    resolver: zodResolver(pouringFormSchema),
    defaultValues: {
      jobId: "",
      pourTempMin: "",
      pourTempMax: "",
      pourUphill: false,
      pourUphillStep: "",
      tapOutTemp: "",
      vacuumVents: false,
      vacuumTime: "",
      hotTop: false,
      knockOffRisers: false,
      degasInLadle: false,
      testBarType: "",
      charpyRequired: false,
      buildWall: false,
      needsBorescope: false,
      tiltStepDirection: "",
    },
  });

  useMemo(() => {
    if (existingInstructions) {
      form.reset({
        jobId: existingInstructions.jobId,
        pourTempMin: existingInstructions.pourTempMin,
        pourTempMax: existingInstructions.pourTempMax,
        pourUphill: existingInstructions.pourUphill,
        pourUphillStep: existingInstructions.pourUphillStep,
        tapOutTemp: existingInstructions.tapOutTemp,
        vacuumVents: existingInstructions.vacuumVents,
        vacuumTime: existingInstructions.vacuumTime,
        hotTop: existingInstructions.hotTop,
        knockOffRisers: existingInstructions.knockOffRisers,
        degasInLadle: existingInstructions.degasInLadle,
        testBarType: existingInstructions.testBarType,
        charpyRequired: existingInstructions.charpyRequired,
        buildWall: existingInstructions.buildWall,
        needsBorescope: existingInstructions.needsBorescope,
        tiltStepDirection: existingInstructions.tiltStepDirection,
      });
    } else if (selectedJobId) {
      form.reset({
        jobId: selectedJobId,
        pourTempMin: "",
        pourTempMax: "",
        pourUphill: false,
        pourUphillStep: "",
        tapOutTemp: "",
        vacuumVents: false,
        vacuumTime: "",
        hotTop: false,
        knockOffRisers: false,
        degasInLadle: false,
        testBarType: "",
        charpyRequired: false,
        buildWall: false,
        needsBorescope: false,
        tiltStepDirection: "",
      });
    }
  }, [existingInstructions, selectedJobId, form]);

  const createMutation = useMutation({
    mutationFn: async (data: PouringFormValues) => {
      return apiRequest("POST", "/api/pouring-instructions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pouring-instructions', selectedJobId] });
      toast({
        title: "Success",
        description: "Pouring instructions saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save pouring instructions",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PouringFormValues & { id: string }) => {
      const { id, ...body } = data;
      return apiRequest("PATCH", `/api/pouring-instructions/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pouring-instructions', selectedJobId] });
      toast({
        title: "Success",
        description: "Pouring instructions updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update pouring instructions",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PouringFormValues) => {
    if (existingInstructions) {
      updateMutation.mutate({ ...data, id: existingInstructions.id });
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
        <Flame className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Pouring Instructions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Job</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedJobId} onValueChange={handleJobSelect}>
            <SelectTrigger data-testid="select-job">
              <SelectValue placeholder="Select a job to view/edit pouring instructions" />
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
            <CardTitle>Pouring Instructions Form</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingInstructions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="pourTempMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pour Temp Min</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2700" {...field} data-testid="input-pour-temp-min" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pourTempMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pour Temp Max</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2850" {...field} data-testid="input-pour-temp-max" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tapOutTemp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tap Out Temp</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2900" {...field} data-testid="input-tap-out-temp" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pourUphillStep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pour Uphill Step</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter step details" {...field} data-testid="input-pour-uphill-step" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vacuumTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vacuum Time</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 30 minutes" {...field} data-testid="input-vacuum-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testBarType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Bar Type</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter test bar type" {...field} data-testid="input-test-bar-type" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tiltStepDirection"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tilt Step Direction</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Left, Right, Forward" {...field} data-testid="input-tilt-step-direction" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Options</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="pourUphill"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-pour-uphill"
                              />
                            </FormControl>
                            <Label className="text-sm font-normal cursor-pointer">Pour Uphill</Label>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vacuumVents"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-vacuum-vents"
                              />
                            </FormControl>
                            <Label className="text-sm font-normal cursor-pointer">Vacuum Vents</Label>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hotTop"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-hot-top"
                              />
                            </FormControl>
                            <Label className="text-sm font-normal cursor-pointer">Hot Top</Label>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="knockOffRisers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-knock-off-risers"
                              />
                            </FormControl>
                            <Label className="text-sm font-normal cursor-pointer">Knock Off Risers</Label>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="degasInLadle"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-degas-in-ladle"
                              />
                            </FormControl>
                            <Label className="text-sm font-normal cursor-pointer">Degas In Ladle</Label>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="charpyRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-charpy-required"
                              />
                            </FormControl>
                            <Label className="text-sm font-normal cursor-pointer">Charpy Required</Label>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="buildWall"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-build-wall"
                              />
                            </FormControl>
                            <Label className="text-sm font-normal cursor-pointer">Build Wall</Label>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="needsBorescope"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-needs-borescope"
                              />
                            </FormControl>
                            <Label className="text-sm font-normal cursor-pointer">Needs Borescope</Label>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isPending} data-testid="button-save">
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Instructions
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
