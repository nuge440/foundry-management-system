import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, JobStatus } from "@/components/StatusBadge";
import { JobDetailPanel } from "@/components/JobDetailPanel";
import { JobEditModal } from "@/components/JobEditModal";
import { foundryConfig } from "@/config/foundryConfig";
import { DesignInfoFormModal } from "@/components/DesignInfoFormModal";
import { AssemblyInfoFormModal } from "@/components/AssemblyInfoFormModal";
import { CleaningRoomInfoFormModal } from "@/components/CleaningRoomInfoFormModal";
import { Pencil, Plus, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DesignInfo, AssemblyInfo, CleaningRoomInfo, MoldChecklistItem } from "@shared/schema";

function JobDetails({ jobId }: { jobId: string }) {
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [isAssemblyModalOpen, setIsAssemblyModalOpen] = useState(false);
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);

  const { data: designInfo } = useQuery<DesignInfo>({
    queryKey: [`/api/jobs/${jobId}/design-info`],
  });

  const { data: assemblyInfo } = useQuery<AssemblyInfo>({
    queryKey: [`/api/jobs/${jobId}/assembly-info`],
  });

  const { data: cleaningInfo } = useQuery<CleaningRoomInfo>({
    queryKey: [`/api/jobs/${jobId}/cleaning-info`],
  });

  const { data: checklistItems = [] } = useQuery<MoldChecklistItem[]>({
    queryKey: [`/api/jobs/${jobId}/checklist-items`],
  });

  const designFields = designInfo ? [
    { label: "Solidification", value: designInfo.solidificationGating },
    { label: "Solidification Quality", value: designInfo.quality },
    { label: "Sprues", value: designInfo.sprues },
    { label: "Basin Size", value: designInfo.basinSize },
    { label: "Gating System", value: designInfo.gatingSystem },
  ] : [];

  const assemblyFields = assemblyInfo ? [
    { label: "Mold Size", value: assemblyInfo.moldSize },
    { label: "Paint", value: assemblyInfo.paint },
    { label: "Robot Time Cope", value: assemblyInfo.robotTimeCope },
    { label: "Robot Time Drag", value: assemblyInfo.robotTimeDrag },
    { label: "MPI Certed", value: assemblyInfo.mpiCerted },
    { label: "Assembly Notes", value: assemblyInfo.assemblyNotes },
    { label: "Core Boxes", value: assemblyInfo.coreBoxes },
    { label: "Special Tooling", value: assemblyInfo.specialTooling },
  ] : [];

  const cleaningFields = cleaningInfo ? [
    { label: "Clean Time", value: cleaningInfo.cleanTime },
    { label: "Mold Rating", value: cleaningInfo.moldRating },
    { label: "Pouring Pictures", value: cleaningInfo.pouringPictures },
    { label: "Casting Pictures", value: cleaningInfo.castingPictures },
    { label: "Core Assembly", value: cleaningInfo.coreAssembly },
    { label: "Core Cost", value: cleaningInfo.coreCost },
    { label: "Mold Assembly", value: cleaningInfo.moldAssembly },
    { label: "Casting Weight (lbs)", value: cleaningInfo.castingWeightLbs },
    { label: "Pour Point", value: cleaningInfo.pourPoint },
    { label: "Assembly", value: cleaningInfo.assembly },
    { label: "Additional Notes", value: cleaningInfo.additionalNotesInitial },
  ] : [];

  const checklistFields = checklistItems.slice(0, 5).map(item => ({
    label: item.item,
    value: `${item.initial} - ${item.date || 'N/A'}`,
  }));

  return (
    <>
      <JobDetailPanel
        jobId={jobId}
        designInfo={designFields}
        assemblyInfo={assemblyFields}
        cleaningInfo={cleaningFields}
        checklistInfo={checklistFields}
        onEditDesign={() => setIsDesignModalOpen(true)}
        onEditAssembly={() => setIsAssemblyModalOpen(true)}
        onEditCleaning={() => setIsCleaningModalOpen(true)}
        onEditChecklist={() => {}}
      />

      <DesignInfoFormModal
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        jobId={jobId}
        initialData={designInfo}
      />

      <AssemblyInfoFormModal
        isOpen={isAssemblyModalOpen}
        onClose={() => setIsAssemblyModalOpen(false)}
        jobId={jobId}
        initialData={assemblyInfo}
      />

      <CleaningRoomInfoFormModal
        isOpen={isCleaningModalOpen}
        onClose={() => setIsCleaningModalOpen(false)}
        jobId={jobId}
        initialData={cleaningInfo}
      />
    </>
  );
}

export default function JobInformation() {
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: allJobs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/jobs"],
  });

  const jobs = useMemo(() => {
    if (!searchQuery.trim()) return allJobs;
    const query = searchQuery.toLowerCase();
    return allJobs.filter((job: any) => 
      job.status?.toLowerCase().includes(query) ||
      job.company?.toLowerCase().includes(query) ||
      job.partNumber?.toLowerCase().includes(query) ||
      job.jobNumber?.toLowerCase().includes(query) ||
      job.material?.toLowerCase().includes(query) ||
      job.owner?.toLowerCase().includes(query) ||
      job.notes?.toLowerCase().includes(query)
    );
  }, [allJobs, searchQuery]);

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/mongo/jobs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/jobs"] });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      setIsModalOpen(false);
      setEditingJob(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/mongo/jobs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/jobs"] });
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      setIsModalOpen(false);
      setEditingJob(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    },
  });

  const handleSaveJob = (data: any) => {
    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob.id, data });
    } else {
      createJobMutation.mutate(data);
    }
  };

  const handleRowClick = (job: any) => {
    setSelectedJob(job.id === selectedJob?.id ? null : job);
  };

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="page-job-information">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Job Information</h1>
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-jobs"
            />
          </div>
          <Button onClick={() => { setEditingJob(null); setIsModalOpen(true); }} data-testid="button-add-job">
            <Plus className="w-4 h-4 mr-2" />
            Add Job
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[140px]">Status</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[140px]">Company</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[120px]">Part Number</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[120px]">Job Number</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[140px]">Sand Mold Size</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[100px]">Material</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[120px]">Pour Weight</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[120px]">Owner</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[120px]">Qty Needed</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[160px]">Qty Completed</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[120px]">Molds Needed</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[80px]">Certs</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[160px]">Custom Chills</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[140px]">Cores Ordered</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[140px]">Promised Date</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[120px]">Heat Treat</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[140px]">Assembly Code</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[160px]">Est Assembly Time</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[160px]">Model Approved</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[200px]">Notes</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[140px]">Inform Melt</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[140px]">Molds Split Off</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap sticky right-0 bg-muted/50">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={23} className="px-4 py-8 text-center text-muted-foreground">
                  Loading jobs...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={23} className="px-4 py-8 text-center text-muted-foreground">
                  No jobs found
                </td>
              </tr>
            ) : (
              jobs.map((job, idx) => (
                <tr
                  key={job.id}
                  onClick={() => handleRowClick(job)}
                  onDoubleClick={() => handleEdit(job)}
                  className={cn(
                    "border-t cursor-pointer hover-elevate transition-colors",
                    idx % 2 === 0 ? "bg-background" : "bg-muted/30",
                    selectedJob?.id === job.id && "bg-primary/10"
                  )}
                  data-testid={`row-job-${job.id}`}
                >
                  <td className="px-4 py-3"><StatusBadge status={job.status as JobStatus} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.company}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.partNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{job.jobNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.moldSize}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.material}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.pourWeight}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.owner}</td>
                  <td className="px-4 py-3 text-center">{job.quantityNeeded}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1" data-testid={`qty-progress-${job.id}`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium" data-testid={`text-qty-${job.id}`}>
                          {job.quantityCompleted} / {job.quantityNeeded}
                        </span>
                        <span className="text-muted-foreground" data-testid={`text-qty-percent-${job.id}`}>
                          {Number(job.quantityNeeded) > 0 ? Math.round((Number(job.quantityCompleted) / Number(job.quantityNeeded)) * 100) : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={Number(job.quantityNeeded) > 0 ? (Number(job.quantityCompleted) / Number(job.quantityNeeded)) * 100 : 0}
                        className="h-1.5"
                        data-testid={`progress-qty-${job.id}`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{job.moldsNeeded}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.certs}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.customChills}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.coresOrdered}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.promisedDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.heatTreat}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.assemblyCode}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.estAssemblyTime}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.modelApproved}</td>
                  <td className="px-4 py-3">{job.notes}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.informMelt}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{job.moldsSplitOff}</td>
                  <td className="px-4 py-3 sticky right-0 bg-background">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); handleEdit(job); }}
                      data-testid={`button-edit-${job.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedJob && <JobDetails jobId={selectedJob.id} />}

      <JobEditModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingJob(null); }}
        onSave={handleSaveJob}
        initialData={editingJob}
        config={foundryConfig}
      />
    </div>
  );
}
