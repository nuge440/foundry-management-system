import { z } from "zod";

export const userRoles = ["Admin", "Manager", "Designer", "Operator"] as const;
export type UserRole = typeof userRoles[number];

export const availablePermissions = [
  "Dashboard",
  "Job Information",
  "Design Information",
  "Assembly Information",
  "Cleaning Room Info",
  "Checklist Design",
  "Workflow Status",
  "User Management",
  "Materials",
  "Time & Attendance",
  "Employee Scheduling"
] as const;
export type Permission = typeof availablePermissions[number];

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  department: string | null;
  jobTitle: string | null;
}

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserManagementSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(userRoles, {
    errorMap: () => ({ message: "Invalid role" }),
  }),
  permissions: z.array(z.enum(availablePermissions)).min(0).refine(
    (perms) => {
      const unique = new Set(perms);
      return unique.size === perms.length;
    },
    { message: "Duplicate permissions are not allowed" }
  ),
});

export type InsertUserManagement = z.infer<typeof insertUserManagementSchema>;

export interface Department {
  id: string;
  name: string;
  description: string;
  parentDepartmentId: string | null;
  color: string;
}

export const insertDepartmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  parentDepartmentId: z.string().nullable().optional(),
  color: z.string().default("#64748b"),
});

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export interface Position {
  id: string;
  name: string;
  description: string;
  departmentId: string | null;
  level: number;
}

export const insertPositionSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  departmentId: z.string().nullable().optional(),
  level: z.number().int().min(1).default(1),
});

export type InsertPosition = z.infer<typeof insertPositionSchema>;

export interface CustomPermission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export const insertCustomPermissionSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  module: z.string().min(1),
});

export type InsertCustomPermission = z.infer<typeof insertCustomPermissionSchema>;

export interface PositionPermission {
  id: string;
  positionId: string;
  permissionId: string;
}

export const insertPositionPermissionSchema = z.object({
  positionId: z.string().min(1),
  permissionId: z.string().min(1),
});

export type InsertPositionPermission = z.infer<typeof insertPositionPermissionSchema>;

export interface WorkflowStatus {
  id: string;
  task: string;
  color: string;
  sortOrder: number;
  department: string;
}

export const insertWorkflowStatusSchema = z.object({
  task: z.string().min(1),
  color: z.string().min(1),
  sortOrder: z.number().int().default(0),
  department: z.string().default(""),
});

export type InsertWorkflowStatus = z.infer<typeof insertWorkflowStatusSchema>;

export interface Job {
  id: string;
  status: string;
  task: string;
  company: string;
  partNumber: string;
  jobNumber: string;
  moldSize: string;
  material: string;
  pourWeight: string;
  owner: string;
  quantityNeeded: string;
  quantityCompleted: number;
  moldsNeeded: string;
  certs: string;
  customChills: string;
  coresOrdered: string;
  promisedDate: string;
  heatTreat: string;
  assemblyCode: string;
  estAssemblyTime: string;
  modelApproved: string;
  notes: string;
  informMelt: string;
  moldsSplitOff: string;
}

export const insertJobSchema = z.object({
  status: z.string(),
  task: z.string(),
  company: z.string(),
  partNumber: z.string(),
  jobNumber: z.string(),
  moldSize: z.string(),
  material: z.string(),
  pourWeight: z.string(),
  owner: z.string(),
  quantityNeeded: z.string(),
  quantityCompleted: z.number().int().min(0).default(0),
  moldsNeeded: z.string(),
  certs: z.string(),
  customChills: z.string(),
  coresOrdered: z.string(),
  promisedDate: z.string(),
  heatTreat: z.string(),
  assemblyCode: z.string(),
  estAssemblyTime: z.string(),
  modelApproved: z.string(),
  notes: z.string(),
  informMelt: z.string(),
  moldsSplitOff: z.string(),
});

export type InsertJob = z.infer<typeof insertJobSchema>;

export interface DesignInfo {
  id: string;
  jobId: string;
  solidificationGating: string;
  quality: string;
  sprues: string;
  basinSize: string;
  feeders: string;
  chills: string;
  gatingSystem: string;
  moldCoating: string;
}

export const insertDesignInfoSchema = z.object({
  jobId: z.string(),
  solidificationGating: z.string(),
  quality: z.string(),
  sprues: z.string(),
  basinSize: z.string(),
  feeders: z.string(),
  chills: z.string(),
  gatingSystem: z.string(),
  moldCoating: z.string(),
});

export type InsertDesignInfo = z.infer<typeof insertDesignInfoSchema>;

export interface AssemblyInfo {
  id: string;
  jobId: string;
  moldSize: string;
  paint: string;
  robotTimeCope: string;
  robotTimeDrag: string;
  mpiCerted: string;
  assemblyNotes: string;
  coreBoxes: string;
  specialTooling: string;
}

export const insertAssemblyInfoSchema = z.object({
  jobId: z.string(),
  moldSize: z.string(),
  paint: z.string(),
  robotTimeCope: z.string(),
  robotTimeDrag: z.string(),
  mpiCerted: z.string(),
  assemblyNotes: z.string(),
  coreBoxes: z.string(),
  specialTooling: z.string(),
});

export type InsertAssemblyInfo = z.infer<typeof insertAssemblyInfoSchema>;

export interface CleaningRoomInfo {
  id: string;
  jobId: string;
  cleanTime: string;
  moldRating: string;
  pouringPictures: string;
  castingPictures: string;
  coreAssembly: string;
  coreCost: string;
  moldAssembly: string;
  castingWeightLbs: string;
  pourPoint: string;
  assembly: string;
  additionalNotesInitial: string;
}

export const insertCleaningRoomInfoSchema = z.object({
  jobId: z.string(),
  cleanTime: z.string(),
  moldRating: z.string(),
  pouringPictures: z.string(),
  castingPictures: z.string(),
  coreAssembly: z.string(),
  coreCost: z.string(),
  moldAssembly: z.string(),
  castingWeightLbs: z.string(),
  pourPoint: z.string(),
  assembly: z.string(),
  additionalNotesInitial: z.string(),
});

export type InsertCleaningRoomInfo = z.infer<typeof insertCleaningRoomInfoSchema>;

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
}

export const insertChecklistTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
});

export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  itemDescription: string;
  orderIndex: number;
  fieldType: string;
  picklistOptions: string[] | null;
  numericMin: number | null;
  numericMax: number | null;
  numericUnit: string | null;
}

export const insertChecklistTemplateItemSchema = z.object({
  templateId: z.string(),
  itemDescription: z.string(),
  orderIndex: z.number().default(0),
  fieldType: z.enum(["text", "picklist", "numeric"]).default("text"),
  picklistOptions: z.array(z.string()).optional().nullable(),
  numericMin: z.number().optional().nullable(),
  numericMax: z.number().optional().nullable(),
  numericUnit: z.string().optional().nullable(),
});

export type InsertChecklistTemplateItem = z.infer<typeof insertChecklistTemplateItemSchema>;

export interface MoldChecklistItem {
  id: string;
  jobId: string;
  item: string;
  initial: string;
  date: string;
  notes: string;
}

export const insertMoldChecklistItemSchema = z.object({
  jobId: z.string(),
  item: z.string(),
  initial: z.string(),
  date: z.string(),
  notes: z.string(),
});

export type InsertMoldChecklistItem = z.infer<typeof insertMoldChecklistItemSchema>;

export interface Material {
  id: string;
  code: string;
  description: string;
  documentPath: string | null;
}

export const insertMaterialSchema = z.object({
  code: z.string(),
  description: z.string(),
  documentPath: z.string().default(""),
});

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export interface NdtSpecification {
  id: string;
  code: string;
  description: string;
  documentPath: string | null;
}

export const insertNdtSpecificationSchema = z.object({
  code: z.string(),
  description: z.string(),
  documentPath: z.string().default(""),
});

export type InsertNdtSpecification = z.infer<typeof insertNdtSpecificationSchema>;

export interface JobAttachment {
  id: string;
  jobId: string;
  fileName: string;
  fileType: string;
  attachmentType: string;
  filePath: string | null;
  localFilePath: string | null;
  fileSize: string;
  uploadedAt: string;
}

export const insertJobAttachmentSchema = z.object({
  jobId: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  attachmentType: z.enum(["upload", "local_link"]).default("upload"),
  filePath: z.union([z.string(), z.null()]).optional(),
  localFilePath: z.union([z.string(), z.null()]).optional(),
  fileSize: z.string(),
  uploadedAt: z.string(),
});

export type InsertJobAttachment = z.infer<typeof insertJobAttachmentSchema>;

export interface TimeEntry {
  id: string;
  userId: string;
  jobId: string | null;
  clockIn: string;
  clockOut: string | null;
  piecesCompleted: number;
  notes: string;
}

export const insertTimeEntrySchema = z.object({
  userId: z.string(),
  jobId: z.string().nullable().optional(),
  clockIn: z.string(),
  clockOut: z.string().nullable().optional(),
  piecesCompleted: z.number().int().min(0).default(0),
  notes: z.string().default(""),
});

export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

export const scheduleStatuses = ["scheduled", "confirmed", "cancelled"] as const;
export type ScheduleStatus = typeof scheduleStatuses[number];

export interface Schedule {
  id: string;
  userId: string;
  department: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
}

export const insertScheduleSchema = z.object({
  userId: z.string(),
  department: z.string().nullable().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(scheduleStatuses).default("scheduled"),
  notes: z.string().default(""),
});

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
  color: string;
}

export const insertShiftTemplateSchema = z.object({
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  description: z.string().default(""),
  color: z.string().default("#3b82f6"),
});

export type InsertShiftTemplate = z.infer<typeof insertShiftTemplateSchema>;

export interface DayTemplate {
  id: string;
  name: string;
  dayOfWeek: number;
  description: string;
  isActive: boolean;
}

export const insertDayTemplateSchema = z.object({
  name: z.string(),
  dayOfWeek: z.number().int(),
  description: z.string().default(""),
  isActive: z.boolean().default(true),
});

export type InsertDayTemplate = z.infer<typeof insertDayTemplateSchema>;

export interface DayTemplateShift {
  id: string;
  dayTemplateId: string;
  shiftTemplateId: string;
  department: string | null;
  userId: string | null;
  notes: string;
}

export const insertDayTemplateShiftSchema = z.object({
  dayTemplateId: z.string(),
  shiftTemplateId: z.string(),
  department: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  notes: z.string().default(""),
});

export type InsertDayTemplateShift = z.infer<typeof insertDayTemplateShiftSchema>;

export interface PouringInstructions {
  id: string;
  jobId: string;
  pourTempMin: string;
  pourTempMax: string;
  pourUphill: boolean;
  pourUphillStep: string;
  tapOutTemp: string;
  vacuumVents: boolean;
  vacuumTime: string;
  hotTop: boolean;
  knockOffRisers: boolean;
  degasInLadle: boolean;
  testBarType: string;
  charpyRequired: boolean;
  buildWall: boolean;
  needsBorescope: boolean;
  tiltStepDirection: string;
}

export const insertPouringInstructionsSchema = z.object({
  jobId: z.string(),
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

export type InsertPouringInstructions = z.infer<typeof insertPouringInstructionsSchema>;

export interface NdTestRequirements {
  id: string;
  jobId: string;
  mpiRequired: boolean;
  mpiCertedInHouse: boolean;
  lpiRequired: boolean;
  lpiCertedInHouse: boolean;
  utRequired: boolean;
  xrayRequired: boolean;
  xrayNotes: string;
  scanIfRepeated: boolean;
  borescopeRequired: boolean;
  skimCuts: string;
}

export const insertNdTestRequirementsSchema = z.object({
  jobId: z.string(),
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

export type InsertNdTestRequirements = z.infer<typeof insertNdTestRequirementsSchema>;

export interface LessonsLearned {
  id: string;
  jobId: string;
  entryDate: string;
  description: string;
  ncrReference: string;
  followUpActions: string;
  createdBy: string;
  ncrNumbers: string;
  notes: string;
}

export const insertLessonsLearnedSchema = z.object({
  jobId: z.string(),
  entryDate: z.string().default(""),
  description: z.string().default(""),
  ncrReference: z.string().default(""),
  followUpActions: z.string().default(""),
  createdBy: z.string().default(""),
  ncrNumbers: z.string().default(""),
  notes: z.string().default(""),
});

export type InsertLessonsLearned = z.infer<typeof insertLessonsLearnedSchema>;
