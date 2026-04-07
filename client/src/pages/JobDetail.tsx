import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Play, Circle, Info, ImageIcon } from "lucide-react";
import { JobEditModal } from "@/components/JobEditModal";
import { foundryConfig } from "@/config/foundryConfig";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  "Active": "bg-green-600 text-white",
  "Hold": "bg-yellow-500 text-black",
  "Complete": "bg-blue-600 text-white",
  "Cancelled": "bg-red-600 text-white",
  "Shipped": "bg-purple-600 text-white",
};

const opStatusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  "Complete": { icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
  "Started": { icon: Play, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
  "Open": { icon: Circle, color: "text-muted-foreground", bg: "" },
};

function DetailRow({ label, value }: { label: string; value: any }) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <div className="flex justify-between gap-2 py-1.5 border-b border-border/50 last:border-0" data-testid={`detail-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] break-words">{display}</span>
    </div>
  );
}

function OperationsPanel({ jobId }: { jobId: string }) {
  const [expanded, setExpanded] = useState(true);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/mongo/jobs", jobId, "operations"],
    enabled: !!jobId,
  });

  if (isLoading) {
    return (
      <Card data-testid="section-operations">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">Operations Routing</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { operations, derivation } = data;

  return (
    <Card data-testid="section-operations">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Operations Routing</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            data-testid="button-toggle-operations"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="px-4 pb-4 pt-0 space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 space-y-2" data-testid="derivation-summary">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Derived task: </span>
                  <span className="font-medium">{derivation.derivedTask || "None"}</span>
                </p>
                {derivation.derivationReason && (
                  <p className="text-muted-foreground text-xs">{derivation.derivationReason}</p>
                )}
                {derivation.hasOverride && (
                  <p>
                    <span className="text-muted-foreground">Dashboard override: </span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">{derivation.dashboardTaskOverride}</span>
                  </p>
                )}
                <div>
                  <span className="text-muted-foreground">Final task shown: </span>
                  <Badge variant="secondary" className="text-xs">{derivation.finalTask || "—"}</Badge>
                </div>
                {derivation.syncedAt && (
                  <p className="text-xs text-muted-foreground mt-1" data-testid="text-synced-at">
                    Data synced: {new Date(derivation.syncedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {operations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2" data-testid="text-no-operations">No operations found for this job.</p>
          ) : (
            <div className="space-y-1" data-testid="operations-list">
              {operations.map((op: any, i: number) => {
                const config = opStatusConfig[op.status] || opStatusConfig["Open"];
                const Icon = config.icon;
                const isActive = op.statusCode === "S";
                const isFirstOpen = !operations.some((o: any) => o.statusCode === "S") &&
                  operations.findIndex((o: any) => o.statusCode === "O") === i;

                return (
                  <div
                    key={`${op.sequence}-${i}`}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                      config.bg,
                      isActive && "ring-1 ring-blue-300 dark:ring-blue-700",
                      isFirstOpen && "ring-1 ring-amber-300 dark:ring-amber-700"
                    )}
                    data-testid={`operation-${op.sequence}`}
                  >
                    <span className="text-xs text-muted-foreground w-6 text-right flex-shrink-0">#{op.sequence}</span>
                    <Icon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{op.workCenter}</span>
                        {op.description && <span className="text-muted-foreground truncate">- {op.description}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {op.mappedTask && (
                        <Badge variant="outline" className="text-xs">{op.mappedTask}</Badge>
                      )}
                      {op.unmapped && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Unmapped
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", config.color)}
                      >
                        {op.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function JobDetail() {
  const [, params] = useRoute("/job/:id");
  const jobId = params?.id;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [thumbnailViewUrl, setThumbnailViewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: job, isLoading, error } = useQuery<any>({
    queryKey: ["/api/mongo/jobs", jobId],
    enabled: !!jobId,
  });

  useEffect(() => {
    if (job?.thumbnailPath) {
      authFetch("/api/attachments/powerpoint-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: job.thumbnailPath }),
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.viewURL) setThumbnailViewUrl(data.viewURL); })
        .catch(() => {});
    } else {
      setThumbnailViewUrl(null);
    }
  }, [job?.thumbnailPath]);

  const updateJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/mongo/jobs/${jobId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/jobs"] });
      toast({ title: "Success", description: "Job updated successfully" });
      setIsEditOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update job", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-job-detail">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-4" data-testid="error-job-detail">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="text-center py-12 text-muted-foreground">
          Job not found or failed to load.
        </div>
      </div>
    );
  }

  const statusClass = statusColors[job.status] || "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4" data-testid="page-job-detail">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold" data-testid="text-job-number">Job #{job.jobNumber || job.Job_Number || "—"}</h1>
              {job.status && <Badge className={statusClass} data-testid="badge-status">{job.status}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-job-subtitle">
              {[job.company, job.description || job.partDescription || job.partNumber].filter(Boolean).join(" — ") || "No details"}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsEditOpen(true)} data-testid="button-edit-job">
          <Pencil className="w-4 h-4 mr-2" />
          Edit Job
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card data-testid="section-job-information">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Job Information</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {thumbnailViewUrl && (
              <div className="mb-3 pb-3 border-b border-border/50">
                <img
                  src={thumbnailViewUrl}
                  alt="Part thumbnail"
                  className="h-32 w-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(thumbnailViewUrl, "_blank")}
                  data-testid="img-job-thumbnail"
                />
              </div>
            )}
            <DetailRow label="Job Number" value={job.jobNumber} />
            <DetailRow label="Customer" value={job.company} />
            <DetailRow label="Part Number" value={job.partNumber} />
            <DetailRow label="Part Description" value={job.description || job.partDescription} />
            <DetailRow label="Material" value={job.material} />
            <DetailRow label="Owner" value={job.owner} />
            <DetailRow label="Status" value={job.status} />
            <DetailRow label="Task" value={job.task} />
            <DetailRow label="Order Qty" value={job.quantityNeeded || job.orderQty} />
            <DetailRow label="Completed Qty" value={job.quantityCompleted} />
            <DetailRow label="Molds Needed" value={job.moldsNeeded} />
            <DetailRow label="Order Date" value={job.orderDate} />
            <DetailRow label="Promised Date" value={job.promisedDate} />
            <DetailRow label="Notes" value={job.notes} />
          </CardContent>
        </Card>

        <Card data-testid="section-design-information">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Design Information</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <DetailRow label="Solidification" value={job.designInfo?.solidification} />
            <DetailRow label="Solidification Quality" value={job.designInfo?.solidificationQuality} />
            <DetailRow label="Number of Sprues" value={job.designInfo?.numberOfSprues} />
            <DetailRow label="Basin Size" value={job.designInfo?.basinSize} />
            <DetailRow label="Gating System" value={job.designInfo?.gatingSystem} />
            <DetailRow label="Pour Rate Design" value={job.designInfo?.pourRateDesign} />
            <DetailRow label="Flow Iterations" value={job.designInfo?.flowIterations} />
            <DetailRow label="Final Flow Sim Time" value={job.designInfo?.finalFlowSimTime} />
            <DetailRow label="CAD" value={job.designInfo?.cad} />
            <DetailRow label="Parting" value={job.designInfo?.parting} />
            <DetailRow label="Mold Type" value={job.designInfo?.moldType} />
            <DetailRow label="Sand Mold Size" value={job.designInfo?.sandMoldSize} />
            <DetailRow label="Castings Per Mold" value={job.designInfo?.castingsPerMold} />
            <DetailRow label="Orientation" value={job.designInfo?.orientation} />
            <DetailRow label="Filter Type" value={job.designInfo?.filterType} />
            <DetailRow label="Special Cleaning Instructions" value={job.designInfo?.specialCleaningInstructions} />
            <DetailRow label="Risers to be Removed" value={job.designInfo?.risersToBeRemoved} />
          </CardContent>
        </Card>

        <Card data-testid="section-assembly-information">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Assembly Information</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <DetailRow label="Sand Mold Size" value={job.sandMoldSize} />
            <DetailRow label="Assembly Code" value={job.assemblyCode} />
            <DetailRow label="Est. Assembly Time" value={job.estAssemblyTime} />
            <DetailRow label="Model Approved" value={job.modelApproved} />
            <DetailRow label="Custom Chills" value={job.customChills} />
            <DetailRow label="Cores Ordered" value={job.coresOrdered} />
          </CardContent>
        </Card>

        <Card data-testid="section-pouring-instructions">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Pouring Instructions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <DetailRow label="Pour Weight" value={job.pourWeight} />
            <DetailRow label="Inform Melt" value={job.informMelt} />
            <DetailRow label="Pour Temp Min" value={job.pouringInstructions?.pourTempMin} />
            <DetailRow label="Pour Temp Max" value={job.pouringInstructions?.pourTempMax} />
            <DetailRow label="Pour Uphill" value={job.pouringInstructions?.pourUphill} />
            <DetailRow label="Tap Out Temp" value={job.pouringInstructions?.tapOutTemp} />
            <DetailRow label="Vacuum Vents" value={job.pouringInstructions?.vacuumVents} />
            <DetailRow label="Vacuum Time" value={job.pouringInstructions?.vacuumTime} />
            <DetailRow label="Hot Top" value={job.pouringInstructions?.hotTop} />
            <DetailRow label="Knock Off Risers" value={job.pouringInstructions?.knockOffRisers} />
            <DetailRow label="Test Bar Type" value={job.pouringInstructions?.testBarType} />
            <DetailRow label="Build Wall" value={job.pouringInstructions?.buildWall} />
            <DetailRow label="Tilt Step Direction" value={job.pouringInstructions?.tiltStepDirection} />
          </CardContent>
        </Card>

        <Card data-testid="section-cleaning-room">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Cleaning Room</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <DetailRow label="Heat Treat" value={job.heatTreat} />
            <DetailRow label="Clean Time" value={job.cleaningInfo?.cleanTime} />
            <DetailRow label="Special Instructions" value={job.cleaningInfo?.specialInstructions} />
          </CardContent>
        </Card>

        <Card data-testid="section-additional-processes">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Additional Processes / NDT</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <DetailRow label="MPI Certified In-House" value={job.ndTestRequirements?.mpiCertedInHouse} />
            <DetailRow label="LPI Certified In-House" value={job.ndTestRequirements?.lpiCertedInHouse} />
            <DetailRow label="Scan if Repeated" value={job.ndTestRequirements?.scanIfRepeated} />
            <DetailRow label="UT" value={job.ndTestRequirements?.ut} />
            <DetailRow label="Borescope" value={job.ndTestRequirements?.borescope} />
            <DetailRow label="Skim Cuts" value={job.ndTestRequirements?.skimCuts} />
            <DetailRow label="X-Ray Requirements" value={job.ndTestRequirements?.xrayRequirements} />
            <DetailRow label="Heat Treat Charts" value={job.ndTestRequirements?.heatTreatCharts ? "Yes" : "No"} />
            {job.ndTestRequirements?.heatTreatCharts && <DetailRow label="Heat Treat Charts Spec" value={job.ndTestRequirements?.heatTreatChartsSpec} />}
            <DetailRow label="Chemicals" value={job.ndTestRequirements?.chemicalsRequired ? "Yes" : "No"} />
            {job.ndTestRequirements?.chemicalsRequired && <DetailRow label="Chemicals Spec" value={job.ndTestRequirements?.chemicalsSpec} />}
            <DetailRow label="Mechanicals" value={job.ndTestRequirements?.mechanicalsRequired ? "Yes" : "No"} />
            {job.ndTestRequirements?.mechanicalsRequired && <DetailRow label="Mechanicals Spec" value={job.ndTestRequirements?.mechanicalsSpec} />}
            <DetailRow label="Charpy" value={job.ndTestRequirements?.charpyRequired ? "Yes" : "No"} />
            {job.ndTestRequirements?.charpyRequired && <DetailRow label="Charpy Spec" value={job.ndTestRequirements?.charpySpec} />}
            <DetailRow label="Xray" value={job.ndTestRequirements?.xrayRequired ? "Yes" : "No"} />
            {job.ndTestRequirements?.xrayRequired && <DetailRow label="Xray Spec" value={job.ndTestRequirements?.xraySpec} />}
          </CardContent>
        </Card>

        {job.lessonsLearned && job.lessonsLearned.length > 0 && (
          <Card className="md:col-span-2" data-testid="section-lessons-learned">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base">Lessons Learned</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {job.lessonsLearned.map((lesson: any, i: number) => (
                <div key={lesson.id || i} className="py-1.5 border-b border-border/50 last:border-0">
                  <p className="text-sm">{lesson.text || lesson.description}</p>
                  {lesson.date && <span className="text-xs text-muted-foreground">{lesson.date}</span>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {jobId && <OperationsPanel jobId={jobId} />}

      <JobEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={(data) => updateJobMutation.mutate(data)}
        initialData={job}
        config={foundryConfig}
        saving={updateJobMutation.isPending}
      />
    </div>
  );
}
