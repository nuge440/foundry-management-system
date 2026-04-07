import { 
  getJobsCollection, 
  getChangeLogCollection,
  JobDocument, 
  ObjectId, 
  isValidObjectId,
  DesignInfoDoc,
  AssemblyInfoDoc,
  CleaningInfoDoc,
  PouringInstructionsDoc,
  NdTestRequirementsDoc,
  LessonLearnedDoc,
  ChangeLogEntry,
  ChangeLogChange
} from "./mongodb";
import { randomUUID } from "crypto";

export interface MongoJob {
  id: string;
  jobNumber: string;
  status: string;
  task: string;
  company: string;
  customer?: string;
  partNumber: string;
  description?: string;
  partType?: string;
  castingType?: string;
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
  designInfo?: DesignInfoDoc;
  assemblyInfo?: AssemblyInfoDoc;
  cleaningInfo?: CleaningInfoDoc;
  pouringInstructions?: PouringInstructionsDoc;
  ndTestRequirements?: NdTestRequirementsDoc;
  lessonsLearned?: LessonLearnedDoc[];
  createdAt?: string;
  updatedAt?: string;
  isExpedite?: boolean;
  requiresCert?: boolean;
  bucket?: string;
  department?: string;
  isRemake?: boolean;
  remakeReason?: string;
  remakeDate?: string;
  photos?: any[];
  fileLinks?: any[];
  ndtSpecId?: string;
}

const workCenterToTask: Record<string, string> = {
  "ENG-CAD":     "CAD",
  "ENG-SIM":     "Solidification / Gating",
  "ENG-PRGM":    "Programming",
  "ENG-PREP":    "Engineering Prep",
  "ENG ROCKS":   "Engineering Prep",
  "LASER SCAN":  "Laser Scan",
  "CORE -PALM":  "Core-Vox",
  "CORE":        "Core-Vox",
  "MOLD -LOOP":  "Mold -Loop",
  "HAAS - PAT":  "Pattern Machining",
  "MELT FE":     "Ready to Pour",
  "SHAKEOUT":    "Shakeout",
  "HEAT TREAT":  "Heat Treat",
  "CLEAN":       "Grinding Room",
  "BENCH":       "Bench Work",
  "STRAIGHT":    "Straightening",
  "DIE PEN":     "Dye Penetrant",
  "MPI":         "MPI Testing",
  "UT TEST":     "UT Testing",
  "X-RAY":       "X-Ray Testing",
  "CHARPY":      "Charpy Testing",
  "INSPECTION":  "Inspection",
  "MACHINE":     "At Machine Shop",
  "HAAS":        "At Machine Shop",
  "CMM":         "CMM Measurement",
  "INTEGREX":    "At Machine Shop",
  "MAZAKH6800":  "At Machine Shop",
  "MAZAK 500":   "At Machine Shop",
  "MAZAK-UNAT":  "At Machine Shop",
};

const CONDITIONAL_WORK_CENTERS = new Set(["ICAST", "ICAST-ASSY", "CORE-VOX", "CLEAN", "EXPEDITE"]);

const SKIP_WORK_CENTERS = new Set(["EXPEDITE", "ENG-INSP", "CERT", "ICAST REW", "MAINT"]);

const TASK_TO_DEPARTMENT: Record<string, string> = {
  "Engineering Prep": "Engineering",
  "Solidification / Gating": "Engineering",
  "CAD": "Engineering",
  "Programming": "Engineering",
  "Awaiting Routing": "Engineering",
  "Waiting": "Engineering",
  "On Hold": "Engineering",
  "Pending": "Engineering",
  "Waiting on Core-Vox": "Core Room",
  "Core-Vox": "Core Room",
  "Mold -Loop": "Mold / Pattern",
  "Pattern Machining": "Mold / Pattern",
  "Waiting on Molds": "Mold / Pattern",
  "Ready for Robot": "Robot / iCast",
  "Running on Robot": "Robot / iCast",
  "Waiting to be Assembled": "Robot / iCast",
  "Being Assembled": "Robot / iCast",
  "Assembled": "Robot / iCast",
  "Ready to Pour": "Pouring / Melt",
  "Cooling": "Post-Pour / Finishing",
  "Grinding Room": "Post-Pour / Finishing",
  "Shakeout": "Post-Pour / Finishing",
  "Heat Treat": "Post-Pour / Finishing",
  "Straightening": "Post-Pour / Finishing",
  "Bench Work": "Post-Pour / Finishing",
  "Dye Penetrant": "Post-Pour / Finishing",
  "MPI Testing": "Post-Pour / Finishing",
  "UT Testing": "Inspection / QC",
  "X-Ray Testing": "Inspection / QC",
  "Charpy Testing": "Inspection / QC",
  "Inspection": "Inspection / QC",
  "Laser Scan": "Inspection / QC",
  "CMM Measurement": "Inspection / QC",
  "NDT Inspection": "Inspection / QC",
  "At Foundry For Sample": "Inspection / QC",
  "At Machine Shop": "Machining",
  "At STL Precision": "Machining",
  "Complete": "Shipping / Complete",
  "Shipping": "Shipping / Complete",
  "SHIPPED": "Shipping / Complete",
};

export const DEPARTMENT_ORDER = [
  "Engineering",
  "Core Room",
  "Mold / Pattern",
  "Robot / iCast",
  "Pouring / Melt",
  "Post-Pour / Finishing",
  "Inspection / QC",
  "Machining",
  "Shipping / Complete",
];

function getOpStatus(op: any): string {
  return op.status || op.Status || "";
}

function getOpWorkCenter(op: any): string {
  return op.work_center || op.Work_Center || "";
}

function getOpActRunQty(op: any): number {
  return op.Act_Run_Qty ?? op.act_run_qty ?? 0;
}

interface DerivedTaskResult {
  task: string;
  bucket: "active" | "waiting" | "pending" | "";
  isExpedite: boolean;
  requiresCert: boolean;
  department: string;
  reason: string;
}

function deriveTaskFromOperations(operations: any[] | undefined, jobStatus: string): DerivedTaskResult {
  const empty: DerivedTaskResult = { task: "", bucket: "", isExpedite: false, requiresCert: false, department: "", reason: "No derivation possible" };

  if (jobStatus === "Hold") {
    return { task: "On Hold", bucket: "waiting", isExpedite: false, requiresCert: false, department: "Engineering", reason: "Job status is Hold" };
  }

  if (jobStatus === "Pending") {
    return { task: "Pending", bucket: "pending", isExpedite: false, requiresCert: false, department: "Engineering", reason: "Job status is Pending" };
  }

  if (!operations || operations.length === 0) {
    if (jobStatus === "Active") {
      return { task: "Awaiting Routing", bucket: "waiting", isExpedite: false, requiresCert: false, department: "Engineering", reason: "Active job with no operations" };
    }
    return empty;
  }

  const sorted = [...operations].sort((a, b) => (a.sequence ?? a.Sequence ?? 0) - (b.sequence ?? b.Sequence ?? 0));

  const hasExpedite = sorted.some(op => getOpWorkCenter(op) === "EXPEDITE");
  const hasCert = sorted.some(op => getOpWorkCenter(op) === "CERT");

  const meaningfulOps = sorted.filter(op => {
    const wc = getOpWorkCenter(op);
    return wc && !SKIP_WORK_CENTERS.has(wc);
  });

  const started = meaningfulOps.find(op => getOpStatus(op) === "S");
  if (started) {
    const wc = getOpWorkCenter(started);
    let task = "";

    if (wc === "ICAST") {
      task = "Running on Robot";
    } else if (wc === "CORE-VOX") {
      task = "Core-Vox";
    } else if (wc === "ICAST-ASSY") {
      const actQty = getOpActRunQty(started);
      task = actQty > 0 ? "Assembled" : "Being Assembled";
    } else if (wc === "CLEAN") {
      task = "Grinding Room";
    } else {
      task = workCenterToTask[wc] || wc || "In Progress";
    }

    const seq = started.sequence ?? started.Sequence ?? 0;
    return {
      task,
      bucket: "active",
      isExpedite: hasExpedite,
      requiresCert: hasCert,
      department: TASK_TO_DEPARTMENT[task] || "",
      reason: `Operation #${seq} (${wc}) is Started`,
    };
  }

  const allComplete = meaningfulOps.every(op => getOpStatus(op) === "C");
  if (allComplete) {
    return {
      task: "Complete",
      bucket: "active",
      isExpedite: hasExpedite,
      requiresCert: hasCert,
      department: "Shipping / Complete",
      reason: `All ${meaningfulOps.length} meaningful operations are Complete`,
    };
  }

  const firstOpen = meaningfulOps.find(op => getOpStatus(op) === "O");
  if (firstOpen) {
    const wc = getOpWorkCenter(firstOpen);
    let task = "";

    if (wc === "ICAST") {
      task = "Ready for Robot";
    } else if (wc === "CORE-VOX") {
      task = "Waiting on Core-Vox";
    } else if (wc === "ICAST-ASSY") {
      task = "Waiting to be Assembled";
    } else if (wc === "CLEAN") {
      const meltFe = meaningfulOps.find(op => getOpWorkCenter(op) === "MELT FE");
      const meltFeStatus = meltFe ? getOpStatus(meltFe) : "";
      task = (meltFeStatus === "C" || meltFeStatus === "S") ? "Cooling" : "Grinding Room";
    } else {
      task = workCenterToTask[wc] || wc || "Waiting";
    }

    const seq = firstOpen.sequence ?? firstOpen.Sequence ?? 0;
    return {
      task,
      bucket: "waiting",
      isExpedite: hasExpedite,
      requiresCert: hasCert,
      department: TASK_TO_DEPARTMENT[task] || "",
      reason: `First open operation is #${seq} (${wc})`,
    };
  }

  return { ...empty, isExpedite: hasExpedite, requiresCert: hasCert, reason: "No started or open operations found" };
}

function deriveTaskForSplitChild(parentOperations: any[] | undefined, splitIndex: number, jobStatus: string): DerivedTaskResult {
  const empty: DerivedTaskResult = { task: "", bucket: "", isExpedite: false, requiresCert: false, department: "", reason: "No derivation possible" };

  if (jobStatus === "Hold") {
    return { task: "On Hold", bucket: "waiting", isExpedite: false, requiresCert: false, department: "Engineering", reason: "Job status is Hold" };
  }

  if (jobStatus === "Pending") {
    return { task: "Pending", bucket: "pending", isExpedite: false, requiresCert: false, department: "Engineering", reason: "Job status is Pending" };
  }

  if (!parentOperations || parentOperations.length === 0) {
    if (jobStatus === "Active") {
      return { task: "Awaiting Routing", bucket: "waiting", isExpedite: false, requiresCert: false, department: "Engineering", reason: "Active job with no operations" };
    }
    return empty;
  }

  const sorted = [...parentOperations].sort((a, b) => (a.sequence ?? a.Sequence ?? 0) - (b.sequence ?? b.Sequence ?? 0));

  const hasExpedite = sorted.some(op => getOpWorkCenter(op) === "EXPEDITE");
  const hasCert = sorted.some(op => getOpWorkCenter(op) === "CERT");

  const meaningfulOps = sorted.filter(op => {
    const wc = getOpWorkCenter(op);
    return wc && !SKIP_WORK_CENTERS.has(wc);
  });

  for (const op of meaningfulOps) {
    const wc = getOpWorkCenter(op);
    const status = getOpStatus(op);
    const actQty = getOpActRunQty(op);
    const seq = op.sequence ?? op.Sequence ?? 0;

    const doneForChild = status === "C" || actQty >= splitIndex;

    if (doneForChild) continue;

    const isStartedForChild = status === "S" && actQty < splitIndex;

    if (isStartedForChild) {
      let task = "";
      let bucket: "active" | "waiting" = "waiting";
      if (wc === "ICAST") {
        const isActivelyRunning = actQty >= (splitIndex - 1);
        task = isActivelyRunning ? "Running on Robot" : "Ready for Robot";
        bucket = isActivelyRunning ? "active" : "waiting";
      } else if (wc === "CORE-VOX") {
        task = "Waiting on Core-Vox";
      } else if (wc === "ICAST-ASSY") {
        task = "Waiting to be Assembled";
      } else if (wc === "CLEAN") {
        const meltFe = meaningfulOps.find(o => getOpWorkCenter(o) === "MELT FE");
        const meltFeActQty = meltFe ? getOpActRunQty(meltFe) : 0;
        task = meltFeActQty >= splitIndex ? "Cooling" : (workCenterToTask[wc] || wc || "Waiting");
      } else {
        task = workCenterToTask[wc] || wc || "Waiting";
      }

      return {
        task,
        bucket,
        isExpedite: hasExpedite,
        requiresCert: hasCert,
        department: TASK_TO_DEPARTMENT[task] || "",
        reason: `Split child #${splitIndex}: op #${seq} (${wc}) started, actQty=${actQty}`,
      };
    }

    let task = "";
    if (wc === "ICAST") {
      task = "Ready for Robot";
    } else if (wc === "CORE-VOX") {
      task = "Waiting on Core-Vox";
    } else if (wc === "ICAST-ASSY") {
      task = "Waiting to be Assembled";
    } else if (wc === "CLEAN") {
      const meltFe = meaningfulOps.find(o => getOpWorkCenter(o) === "MELT FE");
      const meltFeActQty = meltFe ? getOpActRunQty(meltFe) : 0;
      task = meltFeActQty >= splitIndex ? "Cooling" : (workCenterToTask[wc] || wc || "Waiting");
    } else {
      task = workCenterToTask[wc] || wc || "Waiting";
    }

    return {
      task,
      bucket: "waiting",
      isExpedite: hasExpedite,
      requiresCert: hasCert,
      department: TASK_TO_DEPARTMENT[task] || "",
      reason: `Split child #${splitIndex}: waiting on op #${seq} (${wc})`,
    };
  }

  return {
    task: "Complete",
    bucket: "active",
    isExpedite: hasExpedite,
    requiresCert: hasCert,
    department: "Shipping / Complete",
    reason: `All operations complete for split child #${splitIndex}`,
  };
}

function documentToJob(doc: JobDocument): MongoJob {
  const d = doc as any;
  const deliveries = d.Deliveries as any[] | undefined;
  const firstDelivery = deliveries?.[0];
  const dashboard = d.dashboard || {};

  const operations = d.operations;
  const jbStatus = d.status || d.Status || "";
  const derived = deriveTaskFromOperations(operations, jbStatus);

  const jbOwner = d.Sales_Code || "";
  const jbMoldsNeeded = String(d.Make_Quantity ?? "");
  const jbMoldsSplitOff = String(d.Split_Quantity ?? "");
  const jbNotes = d.Notes || "";

  const finalTask = dashboard.task || derived.task || d.task || "";
  const finalDepartment = dashboard.task
    ? (TASK_TO_DEPARTMENT[dashboard.task] || derived.department || "")
    : derived.department;

  return {
    id: doc._id?.toString() || "",
    jobNumber: d.jobNumber || String(d.Job ?? "") || "",
    status: d.status || d.Status || "",
    task: finalTask,
    company: d.Customer || d.company || "",
    customer: d.Customer || d.customer,
    partNumber: d.Part_Number || d.partNumber || "",
    description: d.Description || d.description,
    partType: d.partType || d.part_type,
    castingType: d.castingType || d.casting_type,
    moldSize: dashboard.moldSize || d.moldSize,
    sandMoldSize: dashboard.sandMoldSize || d.sandMoldSize,
    material: dashboard.material || d.material || d.Material || "",
    pourWeight: dashboard.pourWeight || d.pourWeight || "",
    owner: dashboard.owner || d.owner || jbOwner || "",
    quantityNeeded: d.quantityNeeded || String(d.Order_Quantity ?? "") || "",
    quantityCompleted: d.quantityCompleted ?? d.Completed_Quantity ?? d.Shipped_Quantity,
    moldsNeeded: dashboard.moldsNeeded || d.moldsNeeded || jbMoldsNeeded || "",
    certs: d.certs || (d.requires_material_certs ? "Yes" : d.requires_material_certs === false ? "No" : d.Certs_Required ? "Yes" : d.Certs_Required === false ? "No" : derived.requiresCert ? "Yes" : ""),
    customChills: dashboard.customChills || d.customChills,
    coresOrdered: dashboard.coresOrdered || d.coresOrdered || "",
    promisedDate: d.promisedDate || (firstDelivery?.Promised_Date ? firstDelivery.Promised_Date.split("T")[0] : d.Order_Date ? d.Order_Date.split("T")[0] : ""),
    heatTreat: dashboard.heatTreat || d.heatTreat || "",
    assemblyCode: dashboard.assemblyCode || d.assemblyCode,
    estAssemblyTime: dashboard.estAssemblyTime || d.estAssemblyTime,
    modelApproved: dashboard.modelApproved || d.modelApproved,
    notes: dashboard.notes || d.notes || jbNotes || "",
    informMelt: dashboard.informMelt || d.informMelt || "",
    moldsSplitOff: dashboard.moldsSplitOff || d.moldsSplitOff || jbMoldsSplitOff || "",
    orderDate: d.Order_Date ? d.Order_Date.split("T")[0] : d.createdAt ? d.createdAt.split("T")[0] : "",
    daysOnFloor: d.daysOnFloor,
    taskChangedAt: d.taskChangedAt || d.Last_Updated || d.updatedAt,
    isSplitChild: d.isSplitChild || false,
    parentJobNumber: d.parentJobNumber,
    splitIndex: d.splitIndex,
    splitTotal: d.splitTotal,
    childComplete: d.childComplete || false,
    designInfo: dashboard.designInfo || d.designInfo,
    assemblyInfo: dashboard.assemblyInfo || d.assemblyInfo,
    cleaningInfo: dashboard.cleaningInfo || d.cleaningInfo,
    pouringInstructions: dashboard.pouringInstructions || d.pouringInstructions,
    ndTestRequirements: dashboard.ndTestRequirements || d.ndTestRequirements,
    lessonsLearned: dashboard.lessonsLearned || d.lessonsLearned,
    createdAt: d.createdAt || d.Order_Date,
    updatedAt: d.updatedAt || d.Last_Updated,
    isExpedite: derived.isExpedite || d.is_expedite || false,
    requiresCert: derived.requiresCert || d.requires_material_certs || false,
    bucket: derived.bucket || "",
    department: finalDepartment,
    isRemake: dashboard.isRemake || d.isRemake || false,
    remakeReason: dashboard.remakeReason || d.remakeReason || "",
    remakeDate: dashboard.remakeDate || d.remakeDate || "",
    photos: dashboard.photos || d.photos || [],
    fileLinks: dashboard.fileLinks || d.fileLinks || [],
    ndtSpecId: dashboard.ndtSpecId || d.ndtSpecId || "",
  };
}

function jobToDocument(job: Partial<MongoJob>, isCreate: boolean = false): Partial<JobDocument> {
  const doc: Partial<JobDocument> = {
    updatedAt: new Date().toISOString(),
  };

  if (isCreate) {
    doc.jobNumber = job.jobNumber || "";
    doc.status = job.status || "";
    doc.task = job.task || "";
    doc.company = job.company || "";
    doc.customer = job.customer || "";
    doc.partNumber = job.partNumber || "";
    doc.description = job.description || "";
    doc.partType = job.partType || "";
    doc.castingType = job.castingType || "";
    doc.material = job.material || "";
    doc.pourWeight = job.pourWeight || "";
    doc.owner = job.owner || "";
    doc.quantityNeeded = job.quantityNeeded || "";
    doc.moldsNeeded = job.moldsNeeded || "";
    doc.certs = job.certs || "";
    doc.coresOrdered = job.coresOrdered || "";
    doc.promisedDate = job.promisedDate || "";
    doc.heatTreat = job.heatTreat || "";
    doc.notes = job.notes || "";
    doc.informMelt = job.informMelt || "";
    doc.moldsSplitOff = job.moldsSplitOff || "";
  } else {
    if (job.jobNumber !== undefined) doc.jobNumber = job.jobNumber;
    if (job.status !== undefined) doc.status = job.status;
    if (job.task !== undefined) doc.task = job.task;
    if (job.description !== undefined) doc.description = job.description;
    if (job.partType !== undefined) doc.partType = job.partType;
    if (job.castingType !== undefined) doc.castingType = job.castingType;
    if (job.material !== undefined) doc.material = job.material;
    if (job.pourWeight !== undefined) doc.pourWeight = job.pourWeight;
    if (job.owner !== undefined) doc.owner = job.owner;
    if (job.quantityNeeded !== undefined) doc.quantityNeeded = job.quantityNeeded;
    if (job.moldsNeeded !== undefined) doc.moldsNeeded = job.moldsNeeded;
    if (job.certs !== undefined) doc.certs = job.certs;
    if (job.coresOrdered !== undefined) doc.coresOrdered = job.coresOrdered;
    if (job.promisedDate !== undefined) doc.promisedDate = job.promisedDate;
    if (job.heatTreat !== undefined) doc.heatTreat = job.heatTreat;
    if (job.notes !== undefined) doc.notes = job.notes;
    if (job.informMelt !== undefined) doc.informMelt = job.informMelt;
    if (job.moldsSplitOff !== undefined) doc.moldsSplitOff = job.moldsSplitOff;
  }

  if (job.moldSize !== undefined) doc.moldSize = job.moldSize;
  if (job.sandMoldSize !== undefined) doc.sandMoldSize = job.sandMoldSize;
  if (job.quantityCompleted !== undefined) doc.quantityCompleted = job.quantityCompleted;
  if (job.customChills !== undefined) doc.customChills = job.customChills;
  if (job.assemblyCode !== undefined) doc.assemblyCode = job.assemblyCode;
  if (job.estAssemblyTime !== undefined) doc.estAssemblyTime = job.estAssemblyTime;
  if (job.modelApproved !== undefined) doc.modelApproved = job.modelApproved;
  if (job.daysOnFloor !== undefined) doc.daysOnFloor = job.daysOnFloor;
  if (job.childComplete !== undefined) doc.childComplete = job.childComplete;
  if (job.designInfo !== undefined) doc.designInfo = job.designInfo;
  if (job.assemblyInfo !== undefined) doc.assemblyInfo = job.assemblyInfo;
  if (job.cleaningInfo !== undefined) doc.cleaningInfo = job.cleaningInfo;
  if (job.pouringInstructions !== undefined) doc.pouringInstructions = job.pouringInstructions;
  if (job.ndTestRequirements !== undefined) doc.ndTestRequirements = job.ndTestRequirements;
  if (job.lessonsLearned !== undefined) doc.lessonsLearned = job.lessonsLearned;
  if (job.isRemake !== undefined) doc.isRemake = job.isRemake;
  if (job.remakeReason !== undefined) doc.remakeReason = job.remakeReason;
  if (job.remakeDate !== undefined) doc.remakeDate = job.remakeDate;
  if (job.ndtSpecId !== undefined) doc.ndtSpecId = job.ndtSpecId;

  return doc;
}

export class MongoJobStorage {
  private static readonly INACTIVE_STATUSES = ["Closed", "Complete", "Canceled", "Template"];

  private replaceSplitParentsWithChildren(jobs: MongoJob[], rawDocuments: any[]): MongoJob[] {
    const parentOpsMap = new Map<string, any[]>();
    const parentStatusMap = new Map<string, string>();
    for (const doc of rawDocuments) {
      const jn = doc.jobNumber || String(doc.Job ?? "");
      if (jn && doc.operations) {
        parentOpsMap.set(jn, doc.operations);
        parentStatusMap.set(jn, doc.status || doc.Status || "");
      }
    }

    const childrenByParent = new Map<string, MongoJob[]>();
    const parentJobNumbers = new Set<string>();
    const result: MongoJob[] = [];

    for (const job of jobs) {
      if (job.isSplitChild && job.parentJobNumber) {
        parentJobNumbers.add(job.parentJobNumber);
        if (!childrenByParent.has(job.parentJobNumber)) {
          childrenByParent.set(job.parentJobNumber, []);
        }
        childrenByParent.get(job.parentJobNumber)!.push(job);
      }
    }

    for (const job of jobs) {
      if (job.isSplitChild) continue;

      if (parentJobNumbers.has(job.jobNumber)) {
        const children = childrenByParent.get(job.jobNumber) || [];
        children.sort((a, b) => (a.splitIndex || 0) - (b.splitIndex || 0));

        const parentOps = parentOpsMap.get(job.jobNumber);
        const parentStatus = parentStatusMap.get(job.jobNumber) || job.status;

        for (const child of children) {
          if (child.childComplete) {
            child.task = "Complete";
            child.bucket = "active";
            child.department = "Shipping / Complete";
          } else if (parentOps && child.splitIndex) {
            const childDerived = deriveTaskForSplitChild(parentOps, child.splitIndex, parentStatus);
            child.task = child.task && !parentOps ? child.task : childDerived.task;
            child.bucket = childDerived.bucket;
            child.department = childDerived.department;
            child.isExpedite = childDerived.isExpedite || child.isExpedite;
            child.requiresCert = childDerived.requiresCert || child.requiresCert;
          }
        }

        result.push(...children);
      } else {
        result.push(job);
      }
    }

    return result;
  }

  async getAllJobs(): Promise<MongoJob[]> {
    try {
      const collection = await getJobsCollection();
      const documents = await collection.find({}).toArray();
      const jobs = documents.map(documentToJob);
      return this.replaceSplitParentsWithChildren(jobs, documents as any[]);
    } catch (error) {
      console.error("Error fetching jobs from MongoDB:", error);
      throw error;
    }
  }

  async getActiveJobs(): Promise<MongoJob[]> {
    try {
      const collection = await getJobsCollection();
      const inactivePattern = MongoJobStorage.INACTIVE_STATUSES.join("|");
      const inactiveRegex = new RegExp(`^(${inactivePattern})$`, "i");
      const documents = await collection.find({
        $and: [
          { $or: [{ Status: { $not: inactiveRegex } }, { Status: { $exists: false } }] },
          { $or: [{ status: { $not: inactiveRegex } }, { status: { $exists: false } }] },
        ]
      }).toArray();
      const jobs = documents.map(documentToJob);
      const filtered = jobs.filter(j => j.task !== "Awaiting Routing");
      return this.replaceSplitParentsWithChildren(filtered, documents as any[]);
    } catch (error) {
      console.error("Error fetching active jobs from MongoDB:", error);
      throw error;
    }
  }

  async getJobOperations(id: string): Promise<{ operations: any[]; derivation: any } | undefined> {
    try {
      const collection = await getJobsCollection();
      let document: JobDocument | null = null;

      if (isValidObjectId(id)) {
        document = await collection.findOne({ _id: new ObjectId(id) });
      }
      if (!document) {
        document = await collection.findOne({ jobNumber: id });
      }
      if (!document) return undefined;

      const d = document as any;
      const operations = d.operations || [];
      const jobStatus = d.status || d.Status || "";
      const dashboardTask = d.dashboard?.task;

      const sorted = [...operations].sort((a: any, b: any) => (a.sequence ?? a.Sequence ?? 0) - (b.sequence ?? b.Sequence ?? 0));

      const resolveConditionalTask = (wc: string, status: string, allOps: any[]): string | null => {
        if (SKIP_WORK_CENTERS.has(wc)) return null;
        if (wc === "ICAST") {
          if (status === "O") return "Ready for Robot";
          if (status === "S") return "Running on Robot";
          if (status === "C") return "Running on Robot";
          return null;
        }
        if (wc === "CORE-VOX") {
          if (status === "O") return "Waiting on Core-Vox";
          if (status === "S") return "Core-Vox";
          if (status === "C") return "Core-Vox";
          return null;
        }
        if (wc === "ICAST-ASSY") {
          if (status === "S" || status === "C") {
            const actQty = allOps.find((o: any) => getOpWorkCenter(o) === "ICAST-ASSY")?.Act_Run_Qty ?? 0;
            return actQty > 0 ? "Assembled" : "Being Assembled";
          }
          return status === "O" ? "Waiting to be Assembled" : null;
        }
        if (wc === "CLEAN") {
          if (status === "O") {
            const meltFe = allOps.find((o: any) => getOpWorkCenter(o) === "MELT FE");
            return meltFe && getOpActRunQty(meltFe) > 0 ? "Cooling" : "Grinding Room";
          }
          if (status === "S" || status === "C") return "Grinding Room";
          return null;
        }
        return null;
      };

      const mappedOps = sorted.map((op: any) => {
        const wc = op.work_center || op.Work_Center || "";
        const status = op.status || op.Status || "";
        const seq = op.sequence ?? op.Sequence ?? 0;
        const isConditional = CONDITIONAL_WORK_CENTERS.has(wc);
        const mappedTask = isConditional
          ? resolveConditionalTask(wc, status, operations)
          : (workCenterToTask[wc] || null);
        return {
          sequence: seq,
          workCenter: wc,
          status: status === "S" ? "Started" : status === "C" ? "Complete" : status === "O" ? "Open" : status,
          statusCode: status,
          mappedTask,
          skipped: SKIP_WORK_CENTERS.has(wc),
          unmapped: !mappedTask && wc !== "" && !SKIP_WORK_CENTERS.has(wc),
          department: mappedTask ? (TASK_TO_DEPARTMENT[mappedTask] || "") : "",
          description: op.description || op.Description || op.Work_Center_Description || "",
          actRunQty: getOpActRunQty(op),
          lastUpdated: op.Last_Updated || op.last_updated || null,
        };
      });

      const derived = deriveTaskFromOperations(operations, jobStatus);

      const finalTask = dashboardTask || derived.task;
      const hasOverride = !!dashboardTask;

      return {
        operations: mappedOps,
        derivation: {
          jobNumber: d.jobNumber || String(d.Job ?? ""),
          jobStatus,
          operationCount: operations.length,
          derivedTask: derived.task,
          derivedBucket: derived.bucket,
          derivedDepartment: derived.department,
          derivationReason: derived.reason,
          isExpedite: derived.isExpedite,
          requiresCert: derived.requiresCert,
          dashboardTaskOverride: dashboardTask || null,
          finalTask,
          finalDepartment: dashboardTask ? (TASK_TO_DEPARTMENT[dashboardTask] || derived.department) : derived.department,
          hasOverride,
          syncedAt: d.synced_at || d.syncedAt || null,
          lastUpdated: d.Last_Updated || d.lastUpdated || null,
        },
      };
    } catch (error) {
      console.error("Error fetching job operations:", error);
      throw error;
    }
  }

  async getJob(id: string): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();
      let document: JobDocument | null = null;

      if (isValidObjectId(id)) {
        document = await collection.findOne({ _id: new ObjectId(id) });
      }
      
      if (!document) {
        document = await collection.findOne({ jobNumber: id });
      }

      return document ? documentToJob(document) : undefined;
    } catch (error) {
      console.error("Error fetching job from MongoDB:", error);
      throw error;
    }
  }

  async createJob(job: Partial<MongoJob>): Promise<MongoJob> {
    try {
      const collection = await getJobsCollection();
      const document: JobDocument = {
        ...jobToDocument(job, true) as JobDocument,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await collection.insertOne(document);
      return {
        ...documentToJob(document),
        id: result.insertedId.toString(),
      };
    } catch (error) {
      console.error("Error creating job in MongoDB:", error);
      throw error;
    }
  }

  private static readonly HYBRID_FIELDS = [
    'owner', 'moldsNeeded', 'moldsSplitOff', 'notes', 'task'
  ];

  private static readonly DASHBOARD_ONLY_FIELDS = [
    'moldSize', 'sandMoldSize', 'pourWeight', 'customChills', 'coresOrdered',
    'material', 'heatTreat', 'informMelt', 'assemblyCode', 'estAssemblyTime', 'modelApproved',
    'designInfo', 'assemblyInfo', 'cleaningInfo',
    'pouringInstructions', 'ndTestRequirements', 'lessonsLearned',
    'isRemake', 'remakeReason', 'remakeDate',
    'photos', 'fileLinks', 'ndtSpecId'
  ];

  async updateJob(id: string, job: Partial<MongoJob>, changedBy?: string): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();

      let beforeDoc: any = null;
      if (isValidObjectId(id)) {
        beforeDoc = await collection.findOne({ _id: new ObjectId(id) });
      } else {
        beforeDoc = await collection.findOne({ jobNumber: id });
      }

      const updateDoc = jobToDocument(job);

      const dashboardOverrides: Record<string, any> = {};
      for (const field of MongoJobStorage.HYBRID_FIELDS) {
        if ((job as any)[field] !== undefined) {
          dashboardOverrides[`dashboard.${field}`] = (job as any)[field];
        }
      }
      for (const field of MongoJobStorage.DASHBOARD_ONLY_FIELDS) {
        if ((job as any)[field] !== undefined) {
          dashboardOverrides[`dashboard.${field}`] = (job as any)[field];
        }
      }

      const setDoc = { ...updateDoc, ...dashboardOverrides };
      
      let result;
      if (isValidObjectId(id)) {
        result = await collection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      } else {
        result = await collection.findOneAndUpdate(
          { jobNumber: id },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      }

      if (result && beforeDoc) {
        const beforeJob = documentToJob(beforeDoc);
        const afterJob = documentToJob(result);
        await this.recordChanges(afterJob.id, afterJob.jobNumber, changedBy || "Unknown", "dashboard", beforeJob, afterJob, Object.keys(job));
      }

      return result ? documentToJob(result) : undefined;
    } catch (error) {
      console.error("Error updating job in MongoDB:", error);
      throw error;
    }
  }

  async deleteJob(id: string): Promise<boolean> {
    try {
      const collection = await getJobsCollection();
      let result;

      if (isValidObjectId(id)) {
        result = await collection.deleteOne({ _id: new ObjectId(id) });
      } else {
        result = await collection.deleteOne({ jobNumber: id });
      }

      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting job from MongoDB:", error);
      throw error;
    }
  }

  async updateDesignInfo(jobId: string, designInfo: DesignInfoDoc, changedBy?: string): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();
      
      let beforeDoc: any = null;
      beforeDoc = isValidObjectId(jobId)
        ? await collection.findOne({ _id: new ObjectId(jobId) })
        : await collection.findOne({ jobNumber: jobId });

      let result;
      const setDoc: Record<string, any> = { designInfo, "dashboard.designInfo": designInfo, updatedAt: new Date().toISOString() };
      if (isValidObjectId(jobId)) {
        result = await collection.findOneAndUpdate(
          { _id: new ObjectId(jobId) },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      } else {
        result = await collection.findOneAndUpdate(
          { jobNumber: jobId },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      }

      if (result && beforeDoc) {
        const afterJob = documentToJob(result);
        const beforeJob = documentToJob(beforeDoc);
        await this.recordChanges(afterJob.id, afterJob.jobNumber, changedBy || "Unknown", "dashboard", beforeJob, afterJob, ["designInfo"]);
      }

      return result ? documentToJob(result) : undefined;
    } catch (error) {
      console.error("Error updating design info in MongoDB:", error);
      throw error;
    }
  }

  async updateAssemblyInfo(jobId: string, assemblyInfo: AssemblyInfoDoc, changedBy?: string): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();

      let beforeDoc: any = null;
      beforeDoc = isValidObjectId(jobId)
        ? await collection.findOne({ _id: new ObjectId(jobId) })
        : await collection.findOne({ jobNumber: jobId });

      let result;
      const setDoc: Record<string, any> = { assemblyInfo, "dashboard.assemblyInfo": assemblyInfo, updatedAt: new Date().toISOString() };
      if (isValidObjectId(jobId)) {
        result = await collection.findOneAndUpdate(
          { _id: new ObjectId(jobId) },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      } else {
        result = await collection.findOneAndUpdate(
          { jobNumber: jobId },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      }

      if (result && beforeDoc) {
        const afterJob = documentToJob(result);
        const beforeJob = documentToJob(beforeDoc);
        await this.recordChanges(afterJob.id, afterJob.jobNumber, changedBy || "Unknown", "dashboard", beforeJob, afterJob, ["assemblyInfo"]);
      }

      return result ? documentToJob(result) : undefined;
    } catch (error) {
      console.error("Error updating assembly info in MongoDB:", error);
      throw error;
    }
  }

  async updateCleaningInfo(jobId: string, cleaningInfo: CleaningInfoDoc, changedBy?: string): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();

      let beforeDoc: any = null;
      beforeDoc = isValidObjectId(jobId)
        ? await collection.findOne({ _id: new ObjectId(jobId) })
        : await collection.findOne({ jobNumber: jobId });

      let result;
      const setDoc: Record<string, any> = { cleaningInfo, "dashboard.cleaningInfo": cleaningInfo, updatedAt: new Date().toISOString() };
      if (isValidObjectId(jobId)) {
        result = await collection.findOneAndUpdate(
          { _id: new ObjectId(jobId) },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      } else {
        result = await collection.findOneAndUpdate(
          { jobNumber: jobId },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      }

      if (result && beforeDoc) {
        const afterJob = documentToJob(result);
        const beforeJob = documentToJob(beforeDoc);
        await this.recordChanges(afterJob.id, afterJob.jobNumber, changedBy || "Unknown", "dashboard", beforeJob, afterJob, ["cleaningInfo"]);
      }

      return result ? documentToJob(result) : undefined;
    } catch (error) {
      console.error("Error updating cleaning info in MongoDB:", error);
      throw error;
    }
  }

  async updatePouringInstructions(jobId: string, pouringInstructions: PouringInstructionsDoc, changedBy?: string): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();

      let beforeDoc: any = null;
      beforeDoc = isValidObjectId(jobId)
        ? await collection.findOne({ _id: new ObjectId(jobId) })
        : await collection.findOne({ jobNumber: jobId });

      let result;
      const setDoc: Record<string, any> = { pouringInstructions, "dashboard.pouringInstructions": pouringInstructions, updatedAt: new Date().toISOString() };
      if (isValidObjectId(jobId)) {
        result = await collection.findOneAndUpdate(
          { _id: new ObjectId(jobId) },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      } else {
        result = await collection.findOneAndUpdate(
          { jobNumber: jobId },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      }

      if (result && beforeDoc) {
        const afterJob = documentToJob(result);
        const beforeJob = documentToJob(beforeDoc);
        await this.recordChanges(afterJob.id, afterJob.jobNumber, changedBy || "Unknown", "dashboard", beforeJob, afterJob, ["pouringInstructions"]);
      }

      return result ? documentToJob(result) : undefined;
    } catch (error) {
      console.error("Error updating pouring instructions in MongoDB:", error);
      throw error;
    }
  }

  async updateNdTestRequirements(jobId: string, ndTestRequirements: NdTestRequirementsDoc, changedBy?: string): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();

      let beforeDoc: any = null;
      beforeDoc = isValidObjectId(jobId)
        ? await collection.findOne({ _id: new ObjectId(jobId) })
        : await collection.findOne({ jobNumber: jobId });

      let result;
      const setDoc: Record<string, any> = { ndTestRequirements, "dashboard.ndTestRequirements": ndTestRequirements, updatedAt: new Date().toISOString() };
      if (isValidObjectId(jobId)) {
        result = await collection.findOneAndUpdate(
          { _id: new ObjectId(jobId) },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      } else {
        result = await collection.findOneAndUpdate(
          { jobNumber: jobId },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      }

      if (result && beforeDoc) {
        const afterJob = documentToJob(result);
        const beforeJob = documentToJob(beforeDoc);
        await this.recordChanges(afterJob.id, afterJob.jobNumber, changedBy || "Unknown", "dashboard", beforeJob, afterJob, ["ndTestRequirements"]);
      }

      return result ? documentToJob(result) : undefined;
    } catch (error) {
      console.error("Error updating ND test requirements in MongoDB:", error);
      throw error;
    }
  }

  async updateLessonsLearned(jobId: string, lessonsLearned: LessonLearnedDoc[]): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();
      let result;

      const setDoc: Record<string, any> = { lessonsLearned, "dashboard.lessonsLearned": lessonsLearned, updatedAt: new Date().toISOString() };
      if (isValidObjectId(jobId)) {
        result = await collection.findOneAndUpdate(
          { _id: new ObjectId(jobId) },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      } else {
        result = await collection.findOneAndUpdate(
          { jobNumber: jobId },
          { $set: setDoc },
          { returnDocument: "after" }
        );
      }

      return result ? documentToJob(result) : undefined;
    } catch (error) {
      console.error("Error updating lessons learned in MongoDB:", error);
      throw error;
    }
  }

  async addLessonLearned(jobId: string, lesson: LessonLearnedDoc): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();
      const lessonWithId = { ...lesson, id: randomUUID() };
      let result;

      if (isValidObjectId(jobId)) {
        result = await collection.findOneAndUpdate(
          { _id: new ObjectId(jobId) },
          { 
            $push: { lessonsLearned: lessonWithId },
            $set: { updatedAt: new Date().toISOString() }
          },
          { returnDocument: "after" }
        );
      } else {
        result = await collection.findOneAndUpdate(
          { jobNumber: jobId },
          { 
            $push: { lessonsLearned: lessonWithId },
            $set: { updatedAt: new Date().toISOString() }
          },
          { returnDocument: "after" }
        );
      }

      return result ? documentToJob(result) : undefined;
    } catch (error) {
      console.error("Error adding lesson learned in MongoDB:", error);
      throw error;
    }
  }

  async updateLessonLearned(jobId: string, lessonId: string, lesson: LessonLearnedDoc): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();
      const query = isValidObjectId(jobId) 
        ? { _id: new ObjectId(jobId), "lessonsLearned.id": lessonId }
        : { jobNumber: jobId, "lessonsLearned.id": lessonId };
      
      const result = await collection.findOneAndUpdate(
        query,
        { 
          $set: { 
            "lessonsLearned.$": { ...lesson, id: lessonId },
            updatedAt: new Date().toISOString()
          }
        },
        { returnDocument: "after" }
      );

      return result ? documentToJob(result) : undefined;
    } catch (error) {
      console.error("Error updating lesson learned in MongoDB:", error);
      throw error;
    }
  }

  async deleteLessonLearned(jobId: string, lessonId: string): Promise<MongoJob | undefined> {
    try {
      const collection = await getJobsCollection();
      let result;

      if (isValidObjectId(jobId)) {
        result = await collection.findOneAndUpdate(
          { _id: new ObjectId(jobId) },
          { 
            $pull: { lessonsLearned: { id: lessonId } },
            $set: { updatedAt: new Date().toISOString() }
          },
          { returnDocument: "after" }
        );
      } else {
        result = await collection.findOneAndUpdate(
          { jobNumber: jobId },
          { 
            $pull: { lessonsLearned: { id: lessonId } },
            $set: { updatedAt: new Date().toISOString() }
          },
          { returnDocument: "after" }
        );
      }

      return result ? documentToJob(result) : undefined;
    } catch (error) {
      console.error("Error deleting lesson learned from MongoDB:", error);
      throw error;
    }
  }

  async splitJob(jobId: string, splitCount: number): Promise<MongoJob[]> {
    try {
      const collection = await getJobsCollection();
      let parentDoc: JobDocument | null = null;

      if (isValidObjectId(jobId)) {
        parentDoc = await collection.findOne({ _id: new ObjectId(jobId) });
      }
      if (!parentDoc) {
        parentDoc = await collection.findOne({ jobNumber: jobId });
      }
      if (!parentDoc) {
        throw new Error("Job not found");
      }

      const parentJob = documentToJob(parentDoc);
      if (parentJob.isSplitChild) {
        throw new Error("Cannot split a child job");
      }

      const existingChildren = await collection.countDocuments({ parentJobNumber: parentJob.jobNumber, isSplitChild: true });
      if (existingChildren > 0) {
        throw new Error("Job is already split");
      }

      if (splitCount < 2 || splitCount > 100) {
        throw new Error("Split count must be between 2 and 100");
      }

      const now = new Date().toISOString();
      const childDocs: JobDocument[] = [];

      for (let i = 1; i <= splitCount; i++) {
        const childDoc: any = {
          jobNumber: `${parentJob.jobNumber}-${i}`,
          parentJobNumber: parentJob.jobNumber,
          isSplitChild: true,
          splitIndex: i,
          splitTotal: splitCount,
          childComplete: false,

          status: (parentDoc as any).status || (parentDoc as any).Status || "",
          Status: (parentDoc as any).Status || (parentDoc as any).status || "",
          task: parentJob.task,
          company: parentJob.company,
          customer: parentJob.customer || (parentDoc as any).Customer || "",
          Customer: (parentDoc as any).Customer || parentJob.company,
          partNumber: parentJob.partNumber,
          Part_Number: (parentDoc as any).Part_Number || parentJob.partNumber,
          description: parentJob.description || (parentDoc as any).Description || "",
          Description: (parentDoc as any).Description || parentJob.description || "",
          partType: parentJob.partType || (parentDoc as any).part_type,
          part_type: (parentDoc as any).part_type || parentJob.partType,
          castingType: parentJob.castingType || (parentDoc as any).casting_type,
          casting_type: (parentDoc as any).casting_type || parentJob.castingType,
          material: parentJob.material,
          Material: (parentDoc as any).Material || parentJob.material,
          Material_Description: (parentDoc as any).Material_Description || "",
          material_category: (parentDoc as any).material_category || "",
          pourWeight: parentJob.pourWeight,
          owner: parentJob.owner,
          Sales_Code: (parentDoc as any).Sales_Code || "",
          quantityNeeded: parentJob.quantityNeeded,
          Order_Quantity: (parentDoc as any).Order_Quantity,
          moldsNeeded: parentJob.moldsNeeded,
          Make_Quantity: (parentDoc as any).Make_Quantity,
          certs: parentJob.certs,
          requires_material_certs: (parentDoc as any).requires_material_certs,
          customChills: parentJob.customChills,
          coresOrdered: parentJob.coresOrdered,
          promisedDate: parentJob.promisedDate,
          heatTreat: parentJob.heatTreat,
          assemblyCode: parentJob.assemblyCode,
          estAssemblyTime: parentJob.estAssemblyTime,
          modelApproved: parentJob.modelApproved,
          notes: parentJob.notes,
          informMelt: parentJob.informMelt,
          moldsSplitOff: parentJob.moldsSplitOff,
          moldSize: parentJob.moldSize,
          sandMoldSize: parentJob.sandMoldSize,

          Order_Date: (parentDoc as any).Order_Date,
          Last_Updated: (parentDoc as any).Last_Updated,
          Deliveries: (parentDoc as any).Deliveries,
          operations: (parentDoc as any).operations,
          is_expedite: (parentDoc as any).is_expedite,

          dashboard: (parentDoc as any).dashboard || {},
          designInfo: parentJob.designInfo,
          assemblyInfo: parentJob.assemblyInfo,
          cleaningInfo: parentJob.cleaningInfo,
          pouringInstructions: parentJob.pouringInstructions,
          ndTestRequirements: parentJob.ndTestRequirements,
          lessonsLearned: parentJob.lessonsLearned,

          createdAt: now,
          updatedAt: now,
        };

        childDocs.push(childDoc as JobDocument);
      }

      await collection.insertMany(childDocs);

      const insertedChildren = await collection.find({ parentJobNumber: parentJob.jobNumber, isSplitChild: true })
        .sort({ splitIndex: 1 }).toArray();
      return insertedChildren.map(documentToJob);
    } catch (error) {
      console.error("Error splitting job:", error);
      throw error;
    }
  }

  private async recordChanges(
    jobId: string,
    jobNumber: string,
    changedBy: string,
    source: "dashboard" | "sync" | "system",
    before: any,
    after: any,
    changedFields: string[]
  ): Promise<void> {
    try {
      const changes: ChangeLogChange[] = [];
      const skipFields = new Set(["id", "updatedAt", "createdAt", "changedBy"]);

      for (const field of changedFields) {
        if (skipFields.has(field)) continue;
        const oldVal = before[field];
        const newVal = after[field];
        const oldStr = typeof oldVal === "object" ? JSON.stringify(oldVal) : String(oldVal ?? "");
        const newStr = typeof newVal === "object" ? JSON.stringify(newVal) : String(newVal ?? "");
        if (oldStr !== newStr) {
          changes.push({ field, oldValue: oldVal ?? "", newValue: newVal ?? "" });
        }
      }

      if (changes.length > 0) {
        await this.logChange(jobId, jobNumber, changedBy, source, changes);
      }
    } catch (error) {
      console.error("Error recording changes:", error);
    }
  }

  private changeLogListeners: Set<(entry: ChangeLogEntry) => void> = new Set();

  onChangeLogEntry(listener: (entry: ChangeLogEntry) => void): () => void {
    this.changeLogListeners.add(listener);
    return () => { this.changeLogListeners.delete(listener); };
  }

  async logChange(
    jobId: string,
    jobNumber: string,
    changedBy: string,
    source: "dashboard" | "sync" | "system",
    changes: ChangeLogChange[]
  ): Promise<void> {
    try {
      const collection = await getChangeLogCollection();
      const entry: ChangeLogEntry = {
        jobId,
        jobNumber,
        changedBy,
        changedAt: new Date().toISOString(),
        source,
        changes,
      };
      await collection.insertOne(entry);
      for (const listener of this.changeLogListeners) {
        try { listener(entry); } catch {}
      }
    } catch (error) {
      console.error("Error logging change:", error);
    }
  }

  async getChangeLog(filters: {
    jobNumber?: string;
    changedBy?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ entries: ChangeLogEntry[]; total: number }> {
    try {
      const collection = await getChangeLogCollection();
      const query: any = {};

      if (filters.jobNumber) {
        query.jobNumber = { $regex: filters.jobNumber, $options: "i" };
      }
      if (filters.changedBy) {
        query.changedBy = filters.changedBy;
      }
      if (filters.startDate || filters.endDate) {
        query.changedAt = {};
        if (filters.startDate) query.changedAt.$gte = filters.startDate;
        if (filters.endDate) query.changedAt.$lte = filters.endDate;
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const [entries, total] = await Promise.all([
        collection.find(query).sort({ changedAt: -1 }).skip(offset).limit(limit).toArray(),
        collection.countDocuments(query),
      ]);

      return { entries, total };
    } catch (error) {
      console.error("Error fetching change log:", error);
      throw error;
    }
  }

  async getChangeLogForJob(jobNumber: string): Promise<ChangeLogEntry[]> {
    try {
      const collection = await getChangeLogCollection();
      return await collection.find({ jobNumber }).sort({ changedAt: -1 }).toArray();
    } catch (error) {
      console.error("Error fetching change log for job:", error);
      throw error;
    }
  }

  async unsplitJob(parentJobNumber: string): Promise<{ deletedCount: number }> {
    try {
      const collection = await getJobsCollection();
      const result = await collection.deleteMany({ parentJobNumber, isSplitChild: true });
      return { deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Error unsplitting job:", error);
      throw error;
    }
  }

  async getChildJobs(parentJobNumber: string): Promise<MongoJob[]> {
    try {
      const collection = await getJobsCollection();
      const [children, parentDoc] = await Promise.all([
        collection.find({ parentJobNumber, isSplitChild: true }).sort({ splitIndex: 1 }).toArray(),
        collection.findOne({ jobNumber: parentJobNumber, isSplitChild: { $ne: true } }),
      ]);
      const parentOps = (parentDoc as any)?.operations;
      const parentStatus = (parentDoc as any)?.status || (parentDoc as any)?.Status || "";

      return children.map(doc => {
        const job = documentToJob(doc);
        if (job.childComplete) {
          job.task = "Complete";
          job.bucket = "active";
          job.department = "Shipping / Complete";
        } else if (parentOps && job.splitIndex) {
          const childDerived = deriveTaskForSplitChild(parentOps, job.splitIndex, parentStatus);
          job.task = childDerived.task;
          job.bucket = childDerived.bucket;
          job.department = childDerived.department;
          job.isExpedite = childDerived.isExpedite || job.isExpedite;
          job.requiresCert = childDerived.requiresCert || job.requiresCert;
        }
        return job;
      });
    } catch (error) {
      console.error("Error fetching child jobs:", error);
      throw error;
    }
  }
}

export const mongoJobStorage = new MongoJobStorage();
