import { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MetricBox } from "@/components/shared/MetricBox";
import { JobTable } from "@/components/job/JobTable";
import { JobEditModal } from "@/components/modals/JobEditModal";
import { foundryConfig } from "@/config/foundryConfig";
import { SplitJobDialog } from "@/components/modals/SplitJobDialog";
import { Briefcase, Search, Loader2, RefreshCw, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { WorkflowStatus } from "@shared/schema";
import { importedJobs } from "@/data/importedJobs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MongoJob {
  id: string;
  jobNumber: string;
  status: string;
  task: string;
  company: string;
  partNumber: string;
  moldSize?: string;
  sandMoldSize?: string;
  material: string;
  pourWeight: string;
  owner: string;
  quantityNeeded: string;
  quantityCompleted?: number;
  moldsNeeded: string;
  certs: string;
  customChills?: string;
  coresOrdered: string;
  promisedDate: string;
  heatTreat: string;
  assemblyCode?: string;
  estAssemblyTime?: string;
  modelApproved?: string;
  notes: string;
  informMelt: string;
  moldsSplitOff: string;
  orderDate?: string;
  daysOnFloor?: number;
  taskChangedAt?: string;
  isSplitChild?: boolean;
  parentJobNumber?: string;
  splitIndex?: number;
  splitTotal?: number;
  childComplete?: boolean;
  designInfo?: any;
  assemblyInfo?: any;
  cleaningInfo?: any;
  pouringInstructions?: any;
  ndTestRequirements?: any;
  lessonsLearned?: any[];
  isExpedite?: boolean;
  requiresCert?: boolean;
  bucket?: "active" | "waiting" | "pending" | "";
  department?: string;
  isRemake?: boolean;
  remakeReason?: string;
  remakeDate?: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobFilter, setJobFilter] = useState<"active" | "all">("active");
  const [deptFilter, setDeptFilter] = useState<"all" | "robot" | "production">("robot");
  const [splitJob, setSplitJob] = useState<MongoJob | null>(null);
  const { toast } = useToast();

  const jobsUrl = jobFilter === "active" ? "/api/mongo/jobs?filter=active" : "/api/mongo/jobs";
  const { data: mongoJobs = [], isLoading: isLoadingJobs, isError } = useQuery<MongoJob[]>({
    queryKey: [jobsUrl],
    refetchInterval: 30000,
  });

  const ROBOT_SALES_CODES = ["iCast", "iCast Engineer", "Robo Machining", "RoboPattern"];

  const jobs = useMemo(() => {
    let mapped: any[];
    if (mongoJobs.length > 0) {
      mapped = mongoJobs.map(job => ({
        ...job,
        status: (job.status || job.task) as string,
      }));
    } else {
      mapped = importedJobs;
    }
    if (deptFilter === "robot") {
      return mapped.filter(job => ROBOT_SALES_CODES.includes(job.owner));
    } else if (deptFilter === "production") {
      return mapped.filter(job => !ROBOT_SALES_CODES.includes(job.owner));
    }
    return mapped;
  }, [mongoJobs, deptFilter]);

  const { data: workflowStatuses = [] } = useQuery<WorkflowStatus[]>({
    queryKey: ["/api/workflow-statuses"],
    refetchInterval: 30000,
  });

  const { data: syncStatus } = useQuery<{ lastSync: string | null; synced: boolean }>({
    queryKey: ["/api/mongo/sync-status"],
    refetchInterval: 60000,
  });

  const statusColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    workflowStatuses.forEach((status) => {
      map[status.task.toLowerCase()] = status.color;
    });
    return map;
  }, [workflowStatuses]);

  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: string; updates: Record<string, any> }) => {
      return apiRequest("PATCH", `/api/mongo/jobs/${jobId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/mongo/jobs") });
    },
  });

  const invalidateJobs = () => {
    queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/mongo/jobs") });
  };

  const splitJobMutation = useMutation({
    mutationFn: async ({ jobId, splitCount }: { jobId: string; splitCount: number }) => {
      return apiRequest("POST", `/api/mongo/jobs/${jobId}/split`, { splitCount });
    },
    onSuccess: () => {
      invalidateJobs();
      setSplitJob(null);
      toast({ title: "Job split successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to split job", description: error.message, variant: "destructive" });
    },
  });

  const unsplitJobMutation = useMutation({
    mutationFn: async (parentJobNumber: string) => {
      return apiRequest("POST", `/api/mongo/jobs/${parentJobNumber}/unsplit`);
    },
    onSuccess: () => {
      invalidateJobs();
      toast({ title: "Job unsplit successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to unsplit job", description: error.message, variant: "destructive" });
    },
  });

  const toggleChildCompleteMutation = useMutation({
    mutationFn: async (job: MongoJob) => {
      return apiRequest("PATCH", `/api/mongo/jobs/${job.id}`, { childComplete: !job.childComplete });
    },
    onSuccess: () => {
      invalidateJobs();
    },
  });

  const toggleRemakeMutation = useMutation({
    mutationFn: async (job: MongoJob) => {
      return apiRequest("POST", `/api/mongo/jobs/${job.id}/toggle-remake`, {});
    },
    onSuccess: () => {
      invalidateJobs();
      toast({ title: "Remake status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update remake status", description: error.message, variant: "destructive" });
    },
  });

  const handleRowClick = (job: any) => {
    const scrollEl = document.querySelector('[data-scroll-container="job-table"]');
    const scrollY = scrollEl ? scrollEl.scrollTop : 0;
    sessionStorage.setItem("dashboard_scrollY", String(scrollY));
    setLocation(`/job/${job.id}`);
  };

  const handleCellChange = (jobId: string, field: string, value: string) => {
    const updates: Record<string, any> = {
      [field]: field === 'daysOnFloor' ? (value ? parseInt(value) : undefined) : value
    };
    updateJobMutation.mutate({ jobId, updates });
  };

  const TOP_BUCKETS = new Set(["awaiting routing", "waiting", "on hold"]);

  const pendingJobs = useMemo(() => {
    return jobs.filter(job => job.bucket === "pending" || job.task === "Pending");
  }, [jobs]);

  const activeJobs = useMemo(() => {
    return jobs.filter(job => job.bucket !== "pending" && job.task !== "Pending");
  }, [jobs]);

  const taskMetrics = useMemo(() => {
    const now = new Date();
    return workflowStatuses
      .map((ws) => {
        const matchingJobs = activeJobs.filter(job => job.task.toLowerCase() === ws.task.toLowerCase());
        let urgency = 0;
        if (TOP_BUCKETS.has(ws.task.toLowerCase()) && matchingJobs.length > 0) {
          const daysUntilDue = matchingJobs.map(job => {
            if (!job.promisedDate) return 999;
            const due = new Date(job.promisedDate);
            if (isNaN(due.getTime())) return 999;
            return (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          });
          const closest = Math.min(...daysUntilDue);
          if (closest <= 0) urgency = 1;
          else if (closest <= 3) urgency = 0.8;
          else if (closest <= 7) urgency = 0.5;
          else if (closest <= 14) urgency = 0.25;
          else urgency = 0;
        }
        return {
          label: ws.task,
          count: matchingJobs.length,
          icon: Briefcase,
          category: ws.task,
          urgency,
        };
      })
      .filter(m => m.count > 0);
  }, [workflowStatuses, activeJobs]);

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/mongo/jobs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/mongo/jobs") });
      setIsModalOpen(false);
      setEditingJob(null);
    },
  });

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const saved = sessionStorage.getItem("dashboard_scrollY");
    if (saved) {
      sessionStorage.removeItem("dashboard_scrollY");
      const pos = parseInt(saved, 10);
      if (pos > 0) {
        const doScroll = () => {
          const scrollEl = document.querySelector('[data-scroll-container="job-table"]');
          if (scrollEl) {
            scrollEl.scrollTop = pos;
          }
        };
        requestAnimationFrame(() => {
          doScroll();
          requestAnimationFrame(doScroll);
          setTimeout(doScroll, 100);
          setTimeout(doScroll, 300);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (scrollPositionRef.current > 0 && mongoJobs.length > 0) {
      const pos = scrollPositionRef.current;
      scrollPositionRef.current = 0;
      requestAnimationFrame(() => {
        const scrollEl = document.querySelector('[data-scroll-container="job-table"]');
        if (scrollEl) scrollEl.scrollTop = pos;
      });
    }
  }, [mongoJobs]);

  const handleSaveJob = async (data: any) => {
    const scrollEl = document.querySelector('[data-scroll-container="job-table"]');
    scrollPositionRef.current = scrollEl ? scrollEl.scrollTop : 0;
    if (editingJob?.id) {
      const { id, status, bucket, department, isExpedite, requiresCert, isSplitChild, parentJobNumber, splitIndex, splitTotal, childComplete, createdAt, updatedAt, taskChangedAt, orderDate, quantityCompleted, ...editableData } = data;
      await updateJobMutation.mutateAsync({ jobId: editingJob.id, updates: editableData });
      setIsModalOpen(false);
      setEditingJob(null);
    } else {
      createJobMutation.mutate(data);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const workflowOrder = useMemo(() => {
    const order: Record<string, number> = {};
    workflowStatuses.forEach((ws) => {
      order[ws.task.toLowerCase()] = ws.sortOrder + 1;
    });
    return order;
  }, [workflowStatuses]);

  const filteredJobs = useMemo(() => {
    const sourceJobs = selectedCategory === "Pending" ? pendingJobs : activeJobs;
    const filtered = sourceJobs.filter(job => {
      const matchesCategory = !selectedCategory || selectedCategory === "Pending" || job.task.toLowerCase() === selectedCategory.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        job.company.toLowerCase().includes(searchLower) ||
        job.partNumber.toLowerCase().includes(searchLower) ||
        job.jobNumber.toLowerCase().includes(searchLower) ||
        job.material.toLowerCase().includes(searchLower) ||
        job.task.toLowerCase().includes(searchLower) ||
        (job.owner?.toLowerCase().includes(searchLower)) ||
        (job.notes?.toLowerCase().includes(searchLower));
      return matchesCategory && matchesSearch;
    });

    const maxOrder = 999999;
    return [...filtered].sort((a, b) => {
      const orderA = workflowOrder[a.task.toLowerCase()] ?? maxOrder;
      const orderB = workflowOrder[b.task.toLowerCase()] ?? maxOrder;
      return orderA - orderB;
    });
  }, [activeJobs, pendingJobs, selectedCategory, searchTerm, workflowOrder]);

  if (isLoadingJobs) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-dashboard">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading jobs...</span>
      </div>
    );
  }

  function formatSyncTime(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function getSyncAgeColor(isoDate: string): string {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 30) return "text-green-600 dark:text-green-400";
    if (mins < 120) return "text-muted-foreground";
    return "text-amber-500 dark:text-amber-400";
  }

  return (
    <div className="space-y-4" data-testid="page-dashboard">
      <div className="pb-3 border-b">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h1 className="text-xl font-semibold">Dashboard Overview</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{activeJobs.length} active{pendingJobs.length > 0 ? ` · ${pendingJobs.length} pending` : ''} {isError && "(using fallback data)"}</span>
            {syncStatus && (
              <span className={`flex items-center gap-1.5 border-l pl-3 ${syncStatus.lastSync ? getSyncAgeColor(syncStatus.lastSync) : "text-amber-500"}`} data-testid="sync-status">
                <RefreshCw className="w-3.5 h-3.5" />
                {syncStatus.lastSync ? (
                  <span>
                    Last sync: {formatSyncTime(syncStatus.lastSync)}
                  </span>
                ) : (
                  <span>JobBoss: never synced</span>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2" data-testid="task-metrics-row">
          {pendingJobs.length > 0 && (
            <MetricBox
              label="Pending"
              count={pendingJobs.length}
              icon={Clock}
              onClick={() => handleCategoryClick("Pending")}
              isSelected={selectedCategory === "Pending"}
            />
          )}
          {taskMetrics.map((metric) => (
            <MetricBox
              key={metric.label}
              {...metric}
              onClick={() => handleCategoryClick(metric.category)}
              isSelected={selectedCategory === metric.category}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-base font-semibold flex items-center gap-2">
            {selectedCategory
              ? `${selectedCategory} Jobs`
              : jobFilter === "active" ? `Active Jobs` : "All Jobs"}
            <span className="text-sm font-normal text-muted-foreground">
              ({filteredJobs.length} {selectedCategory ? `of ${jobs.length}` : 'total'})
            </span>
            {selectedCategory && (
              <button
                onClick={() => { setSelectedCategory(null); }}
                className="text-xs text-primary hover:underline ml-2"
                data-testid="button-clear-filter"
              >
                Clear filter
              </button>
            )}
          </h2>
          <RadioGroup
            value={jobFilter}
            onValueChange={(v) => setJobFilter(v as "active" | "all")}
            className="flex items-center gap-3"
            data-testid="radio-job-filter"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="active" id="filter-active" data-testid="radio-filter-active" />
              <Label htmlFor="filter-active" className="text-sm cursor-pointer font-normal">Active</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="all" id="filter-all" data-testid="radio-filter-all" />
              <Label htmlFor="filter-all" className="text-sm cursor-pointer font-normal">All</Label>
            </div>
          </RadioGroup>
          <div className="h-4 w-px bg-border" />
          <RadioGroup
            value={deptFilter}
            onValueChange={(v) => setDeptFilter(v as "all" | "robot" | "production")}
            className="flex items-center gap-3"
            data-testid="radio-dept-filter"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="all" id="dept-all" data-testid="radio-dept-all" />
              <Label htmlFor="dept-all" className="text-sm cursor-pointer font-normal">All Depts</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="robot" id="dept-robot" data-testid="radio-dept-robot" />
              <Label htmlFor="dept-robot" className="text-sm cursor-pointer font-normal">Robot</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="production" id="dept-production" data-testid="radio-dept-production" />
              <Label htmlFor="dept-production" className="text-sm cursor-pointer font-normal">Production</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
            data-testid="input-search-jobs"
          />
        </div>
      </div>

      <JobTable
        jobs={filteredJobs}
        columns={[
          "Task",
          "Company",
          "Part Number",
          "Job Number",
          "Material",
          "Owner",
          "Quantity Needed",
          "Order Date",
          "Promised",
          "Time in WC",
          "Actions"
        ]}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onCellChange={handleCellChange}
        onSplit={(job) => setSplitJob(job as MongoJob)}
        onUnsplit={(parentJobNumber) => {
          if (confirm("This will merge all split parts back into the original job. Continue?")) {
            unsplitJobMutation.mutate(parentJobNumber);
          }
        }}
        onToggleChildComplete={(job) => toggleChildCompleteMutation.mutate(job as MongoJob)}
        onToggleRemake={(job) => toggleRemakeMutation.mutate(job as MongoJob)}
        editable={false}
        statusColorMap={statusColorMap}
      />

      <JobEditModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingJob(null); }}
        onSave={handleSaveJob}
        initialData={editingJob}
        config={foundryConfig}
        saving={updateJobMutation.isPending || createJobMutation.isPending}
      />

      <SplitJobDialog
        isOpen={!!splitJob}
        onClose={() => setSplitJob(null)}
        onSplit={(count) => {
          if (splitJob) {
            splitJobMutation.mutate({ jobId: splitJob.id, splitCount: count });
          }
        }}
        jobNumber={splitJob?.jobNumber || ""}
        isPending={splitJobMutation.isPending}
      />
    </div>
  );
}
