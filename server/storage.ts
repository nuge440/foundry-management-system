import {
  type User,
  type InsertUser,
  type WorkflowStatus,
  type InsertWorkflowStatus,
  type InsertUserManagement,
  type MoldChecklistItem,
  type InsertMoldChecklistItem,
  type ChecklistTemplate,
  type InsertChecklistTemplate,
  type ChecklistTemplateItem,
  type InsertChecklistTemplateItem,
  type Job,
  type InsertJob,
  type DesignInfo,
  type InsertDesignInfo,
  type AssemblyInfo,
  type InsertAssemblyInfo,
  type CleaningRoomInfo,
  type InsertCleaningRoomInfo,
  type Material,
  type InsertMaterial,
  type JobAttachment,
  type InsertJobAttachment,
  type TimeEntry,
  type InsertTimeEntry,
  type Schedule,
  type InsertSchedule,
  type ShiftTemplate,
  type InsertShiftTemplate,
  type DayTemplate,
  type InsertDayTemplate,
  type DayTemplateShift,
  type InsertDayTemplateShift,
  type Department,
  type InsertDepartment,
  type Position,
  type InsertPosition,
  type CustomPermission,
  type InsertCustomPermission,
  type PositionPermission,
  type InsertPositionPermission,
  type PouringInstructions,
  type InsertPouringInstructions,
  type NdTestRequirements,
  type InsertNdTestRequirements,
  type LessonsLearned,
  type InsertLessonsLearned,
  type NdtSpecification,
  type InsertNdtSpecification
} from "@shared/schema";

import { ObjectId } from "mongodb";
import {
  getUsersCollection,
  getWorkflowStatusesCollection,
  getMaterialsCollection,
  getNdtSpecificationsCollection,
  getJobAttachmentsCollection,
  getTimeEntriesCollection,
  getSchedulesCollection,
  getShiftTemplatesCollection,
  getDayTemplatesCollection,
  getDayTemplateShiftsCollection,
  getChecklistTemplatesCollection,
  getChecklistTemplateItemsCollection,
  getMoldChecklistItemsCollection,
  getStorageJobsCollection,
  getDesignInfoCollection,
  getAssemblyInfoCollection,
  getCleaningRoomInfoCollection,
  getDepartmentsCollection,
  getPositionsCollection,
  getCustomPermissionsCollection,
  getPositionPermissionsCollection,
  getPouringInstructionsCollection,
  getNdTestRequirementsCollection,
  getLessonsLearnedCollection,
} from "./mongodb";

function docToId(doc: any): any {
  if (!doc) return undefined;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function safeObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAllWorkflowStatuses(): Promise<WorkflowStatus[]>;
  getWorkflowStatus(id: string): Promise<WorkflowStatus | undefined>;
  createWorkflowStatus(status: InsertWorkflowStatus): Promise<WorkflowStatus>;
  updateWorkflowStatus(id: string, status: InsertWorkflowStatus): Promise<WorkflowStatus | undefined>;
  deleteWorkflowStatus(id: string): Promise<boolean>;
  reorderWorkflowStatuses(orderedIds: string[]): Promise<WorkflowStatus[]>;

  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  createUserManagement(user: InsertUserManagement): Promise<User>;
  updateUserManagement(id: string, user: InsertUserManagement): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  getAllJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: InsertJob): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;

  getDesignInfoByJobId(jobId: string): Promise<DesignInfo | undefined>;
  createDesignInfo(designInfo: InsertDesignInfo): Promise<DesignInfo>;
  updateDesignInfo(id: string, designInfo: InsertDesignInfo): Promise<DesignInfo | undefined>;

  getAssemblyInfoByJobId(jobId: string): Promise<AssemblyInfo | undefined>;
  createAssemblyInfo(assemblyInfo: InsertAssemblyInfo): Promise<AssemblyInfo>;
  updateAssemblyInfo(id: string, assemblyInfo: InsertAssemblyInfo): Promise<AssemblyInfo | undefined>;

  getCleaningRoomInfoByJobId(jobId: string): Promise<CleaningRoomInfo | undefined>;
  createCleaningRoomInfo(cleaningRoomInfo: InsertCleaningRoomInfo): Promise<CleaningRoomInfo>;
  updateCleaningRoomInfo(id: string, cleaningRoomInfo: InsertCleaningRoomInfo): Promise<CleaningRoomInfo | undefined>;

  getAllChecklistItems(): Promise<MoldChecklistItem[]>;
  getChecklistItemsByJobId(jobId: string): Promise<MoldChecklistItem[]>;
  getChecklistItem(id: string): Promise<MoldChecklistItem | undefined>;
  createChecklistItem(item: InsertMoldChecklistItem): Promise<MoldChecklistItem>;
  updateChecklistItem(id: string, item: InsertMoldChecklistItem): Promise<MoldChecklistItem | undefined>;
  deleteChecklistItem(id: string): Promise<boolean>;

  getAllChecklistTemplates(): Promise<ChecklistTemplate[]>;
  getChecklistTemplate(id: string): Promise<ChecklistTemplate | undefined>;
  createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate>;
  updateChecklistTemplate(id: string, template: InsertChecklistTemplate): Promise<ChecklistTemplate | undefined>;
  deleteChecklistTemplate(id: string): Promise<boolean>;

  getChecklistTemplateItems(templateId: string): Promise<ChecklistTemplateItem[]>;
  getChecklistTemplateItem(id: string): Promise<ChecklistTemplateItem | undefined>;
  createChecklistTemplateItem(item: InsertChecklistTemplateItem): Promise<ChecklistTemplateItem>;
  updateChecklistTemplateItem(id: string, item: InsertChecklistTemplateItem): Promise<ChecklistTemplateItem | undefined>;
  deleteChecklistTemplateItem(id: string): Promise<boolean>;

  getAllMaterials(): Promise<Material[]>;
  getMaterial(id: string): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, material: InsertMaterial): Promise<Material | undefined>;
  deleteMaterial(id: string): Promise<boolean>;

  getAllNdtSpecifications(): Promise<NdtSpecification[]>;
  getNdtSpecification(id: string): Promise<NdtSpecification | undefined>;
  createNdtSpecification(spec: InsertNdtSpecification): Promise<NdtSpecification>;
  updateNdtSpecification(id: string, spec: InsertNdtSpecification): Promise<NdtSpecification | undefined>;
  deleteNdtSpecification(id: string): Promise<boolean>;

  getAttachmentsByJobId(jobId: string): Promise<JobAttachment[]>;
  getAttachmentById(id: string): Promise<JobAttachment | undefined>;
  createAttachment(attachment: InsertJobAttachment): Promise<JobAttachment>;
  deleteAttachment(id: string): Promise<boolean>;

  getAllTimeEntries(): Promise<TimeEntry[]>;
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  getTimeEntriesByUserId(userId: string): Promise<TimeEntry[]>;
  getTimeEntriesByJobId(jobId: string): Promise<TimeEntry[]>;
  getActiveTimeEntries(): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, entry: InsertTimeEntry): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;

  getAllSchedules(): Promise<Schedule[]>;
  getSchedule(id: string): Promise<Schedule | undefined>;
  getSchedulesByUserId(userId: string): Promise<Schedule[]>;
  getSchedulesByDate(date: string): Promise<Schedule[]>;
  getSchedulesByDateRange(startDate: string, endDate: string): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, schedule: InsertSchedule): Promise<Schedule | undefined>;
  deleteSchedule(id: string): Promise<boolean>;

  getAllShiftTemplates(): Promise<ShiftTemplate[]>;
  getShiftTemplate(id: string): Promise<ShiftTemplate | undefined>;
  createShiftTemplate(template: InsertShiftTemplate): Promise<ShiftTemplate>;
  updateShiftTemplate(id: string, template: InsertShiftTemplate): Promise<ShiftTemplate | undefined>;
  deleteShiftTemplate(id: string): Promise<boolean>;

  getAllDayTemplates(): Promise<DayTemplate[]>;
  getDayTemplate(id: string): Promise<DayTemplate | undefined>;
  getDayTemplatesByDayOfWeek(dayOfWeek: number): Promise<DayTemplate[]>;
  getActiveDayTemplates(): Promise<DayTemplate[]>;
  createDayTemplate(template: InsertDayTemplate): Promise<DayTemplate>;
  updateDayTemplate(id: string, template: InsertDayTemplate): Promise<DayTemplate | undefined>;
  deleteDayTemplate(id: string): Promise<boolean>;

  getDayTemplateShifts(dayTemplateId: string): Promise<DayTemplateShift[]>;
  getDayTemplateShift(id: string): Promise<DayTemplateShift | undefined>;
  createDayTemplateShift(shift: InsertDayTemplateShift): Promise<DayTemplateShift>;
  updateDayTemplateShift(id: string, shift: InsertDayTemplateShift): Promise<DayTemplateShift | undefined>;
  deleteDayTemplateShift(id: string): Promise<boolean>;

  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  getChildDepartments(parentId: string): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: InsertDepartment): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<boolean>;

  getAllPositions(): Promise<Position[]>;
  getPosition(id: string): Promise<Position | undefined>;
  getPositionsByDepartmentId(departmentId: string): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, position: InsertPosition): Promise<Position | undefined>;
  deletePosition(id: string): Promise<boolean>;

  getAllCustomPermissions(): Promise<CustomPermission[]>;
  getCustomPermission(id: string): Promise<CustomPermission | undefined>;
  getCustomPermissionsByModule(module: string): Promise<CustomPermission[]>;
  createCustomPermission(permission: InsertCustomPermission): Promise<CustomPermission>;
  updateCustomPermission(id: string, permission: InsertCustomPermission): Promise<CustomPermission | undefined>;
  deleteCustomPermission(id: string): Promise<boolean>;

  getPositionPermissions(positionId: string): Promise<PositionPermission[]>;
  createPositionPermission(positionPermission: InsertPositionPermission): Promise<PositionPermission>;
  deletePositionPermission(id: string): Promise<boolean>;
  deletePositionPermissionsByPositionId(positionId: string): Promise<boolean>;

  getPouringInstructionsByJobId(jobId: string): Promise<PouringInstructions | undefined>;
  createPouringInstructions(instructions: InsertPouringInstructions): Promise<PouringInstructions>;
  updatePouringInstructions(id: string, instructions: InsertPouringInstructions): Promise<PouringInstructions | undefined>;

  getNdTestRequirementsByJobId(jobId: string): Promise<NdTestRequirements | undefined>;
  createNdTestRequirements(requirements: InsertNdTestRequirements): Promise<NdTestRequirements>;
  updateNdTestRequirements(id: string, requirements: InsertNdTestRequirements): Promise<NdTestRequirements | undefined>;

  getLessonsLearnedByJobId(jobId: string): Promise<LessonsLearned[]>;
  getLessonsLearned(id: string): Promise<LessonsLearned | undefined>;
  createLessonsLearned(entry: InsertLessonsLearned): Promise<LessonsLearned>;
  updateLessonsLearned(id: string, entry: InsertLessonsLearned): Promise<LessonsLearned | undefined>;
  deleteLessonsLearned(id: string): Promise<boolean>;
}

export class MongoStorage implements IStorage {

  async getUser(id: string): Promise<User | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getUsersCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const col = await getUsersCollection();
    const doc = await col.findOne({ username });
    return doc ? docToId(doc) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const col = await getUsersCollection();
    const result = await col.insertOne({ ...user, name: "", email: "", role: "Operator", permissions: [], department: null, jobTitle: null } as any);
    return { id: result.insertedId.toString(), ...user, name: "", email: "", role: "Operator", permissions: [], department: null, jobTitle: null };
  }

  async getAllWorkflowStatuses(): Promise<WorkflowStatus[]> {
    const col = await getWorkflowStatusesCollection();
    const docs = await col.find({}).sort({ sortOrder: 1 }).toArray();
    return docs.map(docToId);
  }

  async getWorkflowStatus(id: string): Promise<WorkflowStatus | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getWorkflowStatusesCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createWorkflowStatus(status: InsertWorkflowStatus): Promise<WorkflowStatus> {
    const col = await getWorkflowStatusesCollection();
    const result = await col.insertOne(status as any);
    return { id: result.insertedId.toString(), ...status, department: status.department || "" };
  }

  async updateWorkflowStatus(id: string, status: InsertWorkflowStatus): Promise<WorkflowStatus | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getWorkflowStatusesCollection();
    await col.updateOne({ _id: oid }, { $set: status });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteWorkflowStatus(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getWorkflowStatusesCollection();
    const result = await col.deleteOne({ _id: oid });
    return result.deletedCount > 0;
  }

  async reorderWorkflowStatuses(orderedIds: string[]): Promise<WorkflowStatus[]> {
    const col = await getWorkflowStatusesCollection();
    for (let i = 0; i < orderedIds.length; i++) {
      const oid = safeObjectId(orderedIds[i]);
      if (oid) await col.updateOne({ _id: oid }, { $set: { sortOrder: i } });
    }
    return this.getAllWorkflowStatuses();
  }

  async getAllUsers(): Promise<User[]> {
    const col = await getUsersCollection();
    const docs = await col.find({}).toArray();
    return docs.map(docToId);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async createUserManagement(user: InsertUserManagement): Promise<User> {
    const col = await getUsersCollection();
    const result = await col.insertOne({ ...user, username: user.email, password: "bamboohr_placeholder", department: null, jobTitle: null } as any);
    return { id: result.insertedId.toString(), username: user.email, password: "bamboohr_placeholder", ...user, department: null, jobTitle: null };
  }

  async updateUserManagement(id: string, user: InsertUserManagement): Promise<User | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getUsersCollection();
    await col.updateOne({ _id: oid }, { $set: user });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getUsersCollection();
    const result = await col.deleteOne({ _id: oid });
    return result.deletedCount > 0;
  }

  async getAllJobs(): Promise<Job[]> {
    const col = await getStorageJobsCollection();
    const docs = await col.find({}).toArray();
    return docs.map(docToId);
  }

  async getJob(id: string): Promise<Job | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getStorageJobsCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const col = await getStorageJobsCollection();
    const result = await col.insertOne(job as any);
    return { id: result.insertedId.toString(), ...job, quantityCompleted: job.quantityCompleted ?? 0 };
  }

  async updateJob(id: string, job: InsertJob): Promise<Job | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getStorageJobsCollection();
    await col.updateOne({ _id: oid }, { $set: job });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteJob(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getStorageJobsCollection();
    const result = await col.deleteOne({ _id: oid });
    return result.deletedCount > 0;
  }

  async getDesignInfoByJobId(jobId: string): Promise<DesignInfo | undefined> {
    const col = await getDesignInfoCollection();
    const doc = await col.findOne({ jobId });
    return doc ? docToId(doc) : undefined;
  }

  async createDesignInfo(info: InsertDesignInfo): Promise<DesignInfo> {
    const col = await getDesignInfoCollection();
    const result = await col.insertOne(info as any);
    return { id: result.insertedId.toString(), ...info };
  }

  async updateDesignInfo(id: string, info: InsertDesignInfo): Promise<DesignInfo | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getDesignInfoCollection();
    await col.updateOne({ _id: oid }, { $set: info });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getAssemblyInfoByJobId(jobId: string): Promise<AssemblyInfo | undefined> {
    const col = await getAssemblyInfoCollection();
    const doc = await col.findOne({ jobId });
    return doc ? docToId(doc) : undefined;
  }

  async createAssemblyInfo(info: InsertAssemblyInfo): Promise<AssemblyInfo> {
    const col = await getAssemblyInfoCollection();
    const result = await col.insertOne(info as any);
    return { id: result.insertedId.toString(), ...info };
  }

  async updateAssemblyInfo(id: string, info: InsertAssemblyInfo): Promise<AssemblyInfo | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getAssemblyInfoCollection();
    await col.updateOne({ _id: oid }, { $set: info });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getCleaningRoomInfoByJobId(jobId: string): Promise<CleaningRoomInfo | undefined> {
    const col = await getCleaningRoomInfoCollection();
    const doc = await col.findOne({ jobId });
    return doc ? docToId(doc) : undefined;
  }

  async createCleaningRoomInfo(info: InsertCleaningRoomInfo): Promise<CleaningRoomInfo> {
    const col = await getCleaningRoomInfoCollection();
    const result = await col.insertOne(info as any);
    return { id: result.insertedId.toString(), ...info };
  }

  async updateCleaningRoomInfo(id: string, info: InsertCleaningRoomInfo): Promise<CleaningRoomInfo | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getCleaningRoomInfoCollection();
    await col.updateOne({ _id: oid }, { $set: info });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getAllChecklistItems(): Promise<MoldChecklistItem[]> {
    const col = await getMoldChecklistItemsCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getChecklistItemsByJobId(jobId: string): Promise<MoldChecklistItem[]> {
    const col = await getMoldChecklistItemsCollection();
    return (await col.find({ jobId }).toArray()).map(docToId);
  }

  async getChecklistItem(id: string): Promise<MoldChecklistItem | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getMoldChecklistItemsCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createChecklistItem(item: InsertMoldChecklistItem): Promise<MoldChecklistItem> {
    const col = await getMoldChecklistItemsCollection();
    const result = await col.insertOne(item as any);
    return { id: result.insertedId.toString(), ...item };
  }

  async updateChecklistItem(id: string, item: InsertMoldChecklistItem): Promise<MoldChecklistItem | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getMoldChecklistItemsCollection();
    await col.updateOne({ _id: oid }, { $set: item });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteChecklistItem(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getMoldChecklistItemsCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAllChecklistTemplates(): Promise<ChecklistTemplate[]> {
    const col = await getChecklistTemplatesCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getChecklistTemplate(id: string): Promise<ChecklistTemplate | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getChecklistTemplatesCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate> {
    const col = await getChecklistTemplatesCollection();
    const result = await col.insertOne(template as any);
    return { id: result.insertedId.toString(), ...template, description: template.description || "" };
  }

  async updateChecklistTemplate(id: string, template: InsertChecklistTemplate): Promise<ChecklistTemplate | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getChecklistTemplatesCollection();
    await col.updateOne({ _id: oid }, { $set: template });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteChecklistTemplate(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getChecklistTemplatesCollection();
    const itemsCol = await getChecklistTemplateItemsCollection();
    await itemsCol.deleteMany({ templateId: id });
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getChecklistTemplateItems(templateId: string): Promise<ChecklistTemplateItem[]> {
    const col = await getChecklistTemplateItemsCollection();
    return (await col.find({ templateId }).sort({ orderIndex: 1 }).toArray()).map(docToId);
  }

  async getChecklistTemplateItem(id: string): Promise<ChecklistTemplateItem | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getChecklistTemplateItemsCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createChecklistTemplateItem(item: InsertChecklistTemplateItem): Promise<ChecklistTemplateItem> {
    const col = await getChecklistTemplateItemsCollection();
    const result = await col.insertOne(item as any);
    return { id: result.insertedId.toString(), ...item, orderIndex: item.orderIndex ?? 0, fieldType: item.fieldType ?? "text", picklistOptions: item.picklistOptions ?? null, numericMin: item.numericMin ?? null, numericMax: item.numericMax ?? null, numericUnit: item.numericUnit ?? null };
  }

  async updateChecklistTemplateItem(id: string, item: InsertChecklistTemplateItem): Promise<ChecklistTemplateItem | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getChecklistTemplateItemsCollection();
    await col.updateOne({ _id: oid }, { $set: item });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteChecklistTemplateItem(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getChecklistTemplateItemsCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAllMaterials(): Promise<Material[]> {
    const col = await getMaterialsCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getMaterialsCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const col = await getMaterialsCollection();
    const result = await col.insertOne(material as any);
    return { id: result.insertedId.toString(), ...material, documentPath: material.documentPath || "" };
  }

  async updateMaterial(id: string, material: InsertMaterial): Promise<Material | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getMaterialsCollection();
    await col.updateOne({ _id: oid }, { $set: material });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getMaterialsCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAllNdtSpecifications(): Promise<NdtSpecification[]> {
    const col = await getNdtSpecificationsCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getNdtSpecification(id: string): Promise<NdtSpecification | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getNdtSpecificationsCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createNdtSpecification(spec: InsertNdtSpecification): Promise<NdtSpecification> {
    const col = await getNdtSpecificationsCollection();
    const result = await col.insertOne(spec as any);
    return { id: result.insertedId.toString(), ...spec, documentPath: spec.documentPath || "" };
  }

  async updateNdtSpecification(id: string, spec: InsertNdtSpecification): Promise<NdtSpecification | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getNdtSpecificationsCollection();
    await col.updateOne({ _id: oid }, { $set: spec });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteNdtSpecification(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getNdtSpecificationsCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAttachmentsByJobId(jobId: string): Promise<JobAttachment[]> {
    const col = await getJobAttachmentsCollection();
    return (await col.find({ jobId }).toArray()).map(docToId);
  }

  async getAttachmentById(id: string): Promise<JobAttachment | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getJobAttachmentsCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createAttachment(attachment: InsertJobAttachment): Promise<JobAttachment> {
    const col = await getJobAttachmentsCollection();
    const result = await col.insertOne(attachment as any);
    return { id: result.insertedId.toString(), ...attachment, attachmentType: attachment.attachmentType || "upload", filePath: attachment.filePath ?? null, localFilePath: attachment.localFilePath ?? null };
  }

  async deleteAttachment(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getJobAttachmentsCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAllTimeEntries(): Promise<TimeEntry[]> {
    const col = await getTimeEntriesCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getTimeEntriesCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getTimeEntriesByUserId(userId: string): Promise<TimeEntry[]> {
    const col = await getTimeEntriesCollection();
    return (await col.find({ userId }).toArray()).map(docToId);
  }

  async getTimeEntriesByJobId(jobId: string): Promise<TimeEntry[]> {
    const col = await getTimeEntriesCollection();
    return (await col.find({ jobId }).toArray()).map(docToId);
  }

  async getActiveTimeEntries(): Promise<TimeEntry[]> {
    const col = await getTimeEntriesCollection();
    return (await col.find({ clockOut: null }).toArray()).map(docToId);
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const col = await getTimeEntriesCollection();
    const result = await col.insertOne(entry as any);
    return { id: result.insertedId.toString(), ...entry, jobId: entry.jobId ?? null, clockOut: entry.clockOut ?? null, piecesCompleted: entry.piecesCompleted ?? 0, notes: entry.notes ?? "" };
  }

  async updateTimeEntry(id: string, entry: InsertTimeEntry): Promise<TimeEntry | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getTimeEntriesCollection();
    await col.updateOne({ _id: oid }, { $set: entry });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getTimeEntriesCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAllSchedules(): Promise<Schedule[]> {
    const col = await getSchedulesCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getSchedulesCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getSchedulesByUserId(userId: string): Promise<Schedule[]> {
    const col = await getSchedulesCollection();
    return (await col.find({ userId }).toArray()).map(docToId);
  }

  async getSchedulesByDate(date: string): Promise<Schedule[]> {
    const col = await getSchedulesCollection();
    return (await col.find({ date }).toArray()).map(docToId);
  }

  async getSchedulesByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    const col = await getSchedulesCollection();
    return (await col.find({ date: { $gte: startDate, $lte: endDate } }).toArray()).map(docToId);
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const col = await getSchedulesCollection();
    const result = await col.insertOne(schedule as any);
    return { id: result.insertedId.toString(), ...schedule, department: schedule.department ?? null, status: schedule.status ?? "scheduled", notes: schedule.notes ?? "" };
  }

  async updateSchedule(id: string, schedule: InsertSchedule): Promise<Schedule | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getSchedulesCollection();
    await col.updateOne({ _id: oid }, { $set: schedule });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getSchedulesCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAllShiftTemplates(): Promise<ShiftTemplate[]> {
    const col = await getShiftTemplatesCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getShiftTemplate(id: string): Promise<ShiftTemplate | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getShiftTemplatesCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createShiftTemplate(template: InsertShiftTemplate): Promise<ShiftTemplate> {
    const col = await getShiftTemplatesCollection();
    const result = await col.insertOne(template as any);
    return { id: result.insertedId.toString(), ...template, description: template.description ?? "", color: template.color ?? "#3b82f6" };
  }

  async updateShiftTemplate(id: string, template: InsertShiftTemplate): Promise<ShiftTemplate | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getShiftTemplatesCollection();
    await col.updateOne({ _id: oid }, { $set: template });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteShiftTemplate(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getShiftTemplatesCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAllDayTemplates(): Promise<DayTemplate[]> {
    const col = await getDayTemplatesCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getDayTemplate(id: string): Promise<DayTemplate | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getDayTemplatesCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getDayTemplatesByDayOfWeek(dayOfWeek: number): Promise<DayTemplate[]> {
    const col = await getDayTemplatesCollection();
    return (await col.find({ dayOfWeek }).toArray()).map(docToId);
  }

  async getActiveDayTemplates(): Promise<DayTemplate[]> {
    const col = await getDayTemplatesCollection();
    return (await col.find({ isActive: true }).toArray()).map(docToId);
  }

  async createDayTemplate(template: InsertDayTemplate): Promise<DayTemplate> {
    const col = await getDayTemplatesCollection();
    const result = await col.insertOne(template as any);
    return { id: result.insertedId.toString(), ...template, description: template.description ?? "", isActive: template.isActive ?? true };
  }

  async updateDayTemplate(id: string, template: InsertDayTemplate): Promise<DayTemplate | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getDayTemplatesCollection();
    await col.updateOne({ _id: oid }, { $set: template });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteDayTemplate(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getDayTemplatesCollection();
    const shiftsCol = await getDayTemplateShiftsCollection();
    await shiftsCol.deleteMany({ dayTemplateId: id });
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getDayTemplateShifts(dayTemplateId: string): Promise<DayTemplateShift[]> {
    const col = await getDayTemplateShiftsCollection();
    return (await col.find({ dayTemplateId }).toArray()).map(docToId);
  }

  async getDayTemplateShift(id: string): Promise<DayTemplateShift | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getDayTemplateShiftsCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createDayTemplateShift(shift: InsertDayTemplateShift): Promise<DayTemplateShift> {
    const col = await getDayTemplateShiftsCollection();
    const result = await col.insertOne(shift as any);
    return { id: result.insertedId.toString(), ...shift, department: shift.department ?? null, userId: shift.userId ?? null, notes: shift.notes ?? "" };
  }

  async updateDayTemplateShift(id: string, shift: InsertDayTemplateShift): Promise<DayTemplateShift | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getDayTemplateShiftsCollection();
    await col.updateOne({ _id: oid }, { $set: shift });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteDayTemplateShift(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getDayTemplateShiftsCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAllDepartments(): Promise<Department[]> {
    const col = await getDepartmentsCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getDepartmentsCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getChildDepartments(parentId: string): Promise<Department[]> {
    const col = await getDepartmentsCollection();
    return (await col.find({ parentDepartmentId: parentId }).toArray()).map(docToId);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const col = await getDepartmentsCollection();
    const result = await col.insertOne(department as any);
    return { id: result.insertedId.toString(), ...department, description: department.description ?? "", parentDepartmentId: department.parentDepartmentId ?? null, color: department.color ?? "#64748b" };
  }

  async updateDepartment(id: string, department: InsertDepartment): Promise<Department | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getDepartmentsCollection();
    await col.updateOne({ _id: oid }, { $set: department });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteDepartment(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getDepartmentsCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAllPositions(): Promise<Position[]> {
    const col = await getPositionsCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getPositionsCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getPositionsByDepartmentId(departmentId: string): Promise<Position[]> {
    const col = await getPositionsCollection();
    return (await col.find({ departmentId }).toArray()).map(docToId);
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const col = await getPositionsCollection();
    const result = await col.insertOne(position as any);
    return { id: result.insertedId.toString(), ...position, description: position.description ?? "", departmentId: position.departmentId ?? null, level: position.level ?? 1 };
  }

  async updatePosition(id: string, position: InsertPosition): Promise<Position | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getPositionsCollection();
    await col.updateOne({ _id: oid }, { $set: position });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deletePosition(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getPositionsCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getAllCustomPermissions(): Promise<CustomPermission[]> {
    const col = await getCustomPermissionsCollection();
    return (await col.find({}).toArray()).map(docToId);
  }

  async getCustomPermission(id: string): Promise<CustomPermission | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getCustomPermissionsCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getCustomPermissionsByModule(module: string): Promise<CustomPermission[]> {
    const col = await getCustomPermissionsCollection();
    return (await col.find({ module }).toArray()).map(docToId);
  }

  async createCustomPermission(permission: InsertCustomPermission): Promise<CustomPermission> {
    const col = await getCustomPermissionsCollection();
    const result = await col.insertOne(permission as any);
    return { id: result.insertedId.toString(), ...permission, description: permission.description ?? "" };
  }

  async updateCustomPermission(id: string, permission: InsertCustomPermission): Promise<CustomPermission | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getCustomPermissionsCollection();
    await col.updateOne({ _id: oid }, { $set: permission });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteCustomPermission(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getCustomPermissionsCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async getPositionPermissions(positionId: string): Promise<PositionPermission[]> {
    const col = await getPositionPermissionsCollection();
    return (await col.find({ positionId }).toArray()).map(docToId);
  }

  async createPositionPermission(pp: InsertPositionPermission): Promise<PositionPermission> {
    const col = await getPositionPermissionsCollection();
    const result = await col.insertOne(pp as any);
    return { id: result.insertedId.toString(), ...pp };
  }

  async deletePositionPermission(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getPositionPermissionsCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }

  async deletePositionPermissionsByPositionId(positionId: string): Promise<boolean> {
    const col = await getPositionPermissionsCollection();
    await col.deleteMany({ positionId });
    return true;
  }

  async getPouringInstructionsByJobId(jobId: string): Promise<PouringInstructions | undefined> {
    const col = await getPouringInstructionsCollection();
    const doc = await col.findOne({ jobId });
    return doc ? docToId(doc) : undefined;
  }

  async createPouringInstructions(instr: InsertPouringInstructions): Promise<PouringInstructions> {
    const col = await getPouringInstructionsCollection();
    const result = await col.insertOne(instr as any);
    return { id: result.insertedId.toString(), ...instr, pourTempMin: instr.pourTempMin ?? "", pourTempMax: instr.pourTempMax ?? "", pourUphill: instr.pourUphill ?? false, pourUphillStep: instr.pourUphillStep ?? "", tapOutTemp: instr.tapOutTemp ?? "", vacuumVents: instr.vacuumVents ?? false, vacuumTime: instr.vacuumTime ?? "", hotTop: instr.hotTop ?? false, knockOffRisers: instr.knockOffRisers ?? false, degasInLadle: instr.degasInLadle ?? false, testBarType: instr.testBarType ?? "", charpyRequired: instr.charpyRequired ?? false, buildWall: instr.buildWall ?? false, needsBorescope: instr.needsBorescope ?? false, tiltStepDirection: instr.tiltStepDirection ?? "" };
  }

  async updatePouringInstructions(id: string, instr: InsertPouringInstructions): Promise<PouringInstructions | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getPouringInstructionsCollection();
    await col.updateOne({ _id: oid }, { $set: instr });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getNdTestRequirementsByJobId(jobId: string): Promise<NdTestRequirements | undefined> {
    const col = await getNdTestRequirementsCollection();
    const doc = await col.findOne({ jobId });
    return doc ? docToId(doc) : undefined;
  }

  async createNdTestRequirements(req: InsertNdTestRequirements): Promise<NdTestRequirements> {
    const col = await getNdTestRequirementsCollection();
    const result = await col.insertOne(req as any);
    return { id: result.insertedId.toString(), ...req, mpiRequired: req.mpiRequired ?? false, mpiCertedInHouse: req.mpiCertedInHouse ?? false, lpiRequired: req.lpiRequired ?? false, lpiCertedInHouse: req.lpiCertedInHouse ?? false, utRequired: req.utRequired ?? false, xrayRequired: req.xrayRequired ?? false, xrayNotes: req.xrayNotes ?? "", scanIfRepeated: req.scanIfRepeated ?? false, borescopeRequired: req.borescopeRequired ?? false, skimCuts: req.skimCuts ?? "" };
  }

  async updateNdTestRequirements(id: string, req: InsertNdTestRequirements): Promise<NdTestRequirements | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getNdTestRequirementsCollection();
    await col.updateOne({ _id: oid }, { $set: req });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async getLessonsLearnedByJobId(jobId: string): Promise<LessonsLearned[]> {
    const col = await getLessonsLearnedCollection();
    return (await col.find({ jobId }).toArray()).map(docToId);
  }

  async getLessonsLearned(id: string): Promise<LessonsLearned | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getLessonsLearnedCollection();
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async createLessonsLearned(entry: InsertLessonsLearned): Promise<LessonsLearned> {
    const col = await getLessonsLearnedCollection();
    const result = await col.insertOne(entry as any);
    return { id: result.insertedId.toString(), ...entry, entryDate: entry.entryDate ?? "", description: entry.description ?? "", ncrReference: entry.ncrReference ?? "", followUpActions: entry.followUpActions ?? "", createdBy: entry.createdBy ?? "", ncrNumbers: entry.ncrNumbers ?? "", notes: entry.notes ?? "" };
  }

  async updateLessonsLearned(id: string, entry: InsertLessonsLearned): Promise<LessonsLearned | undefined> {
    const oid = safeObjectId(id);
    if (!oid) return undefined;
    const col = await getLessonsLearnedCollection();
    await col.updateOne({ _id: oid }, { $set: entry });
    const doc = await col.findOne({ _id: oid });
    return doc ? docToId(doc) : undefined;
  }

  async deleteLessonsLearned(id: string): Promise<boolean> {
    const oid = safeObjectId(id);
    if (!oid) return false;
    const col = await getLessonsLearnedCollection();
    return (await col.deleteOne({ _id: oid })).deletedCount > 0;
  }
}

export const storage = new MongoStorage();
