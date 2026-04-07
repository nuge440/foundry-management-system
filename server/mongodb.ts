import { MongoClient, Db, Collection, ObjectId } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const AVAILABLE_DATABASES = ["foundry", "JobBoss"] as const;
export type DatabaseName = typeof AVAILABLE_DATABASES[number];
let activeDatabaseName: DatabaseName = "JobBoss";

export function getAvailableDatabases(): readonly string[] {
  return AVAILABLE_DATABASES;
}

export function getActiveDatabaseName(): string {
  return activeDatabaseName;
}

export async function switchDatabase(name: DatabaseName): Promise<void> {
  if (!AVAILABLE_DATABASES.includes(name)) {
    throw new Error(`Invalid database name: ${name}. Must be one of: ${AVAILABLE_DATABASES.join(", ")}`);
  }
  if (name === activeDatabaseName && db) {
    return;
  }
  activeDatabaseName = name;
  if (client) {
    db = client.db(activeDatabaseName);
    console.log(`Switched to MongoDB database: ${activeDatabaseName}`);
  }
}

export interface DesignInfoDoc {
  solidification?: string;
  solidificationQuality?: string;
  sprues?: number;
  basinSize?: string;
  gatingSystem?: string;
  pourRateDesign?: string;
  pourRateActual?: string;
  powerpointLink?: string;
  cad?: string;
  cam?: string;
  parting?: string;
  moldType?: string;
  castingsPerMold?: number;
  orientation?: string;
}

export interface AssemblyInfoDoc {
  moldSize?: string;
  paint?: string;
  robotTimeCope?: string;
  robotTimeDrag?: string;
  mpiCerted?: string;
  assemblyNotes?: string;
  coreBoxes?: string;
  specialTooling?: string;
}

export interface CleaningInfoDoc {
  cleanTime?: string;
  moldRating?: string;
  pouringPictures?: string;
  castingPictures?: string;
  coreAssembly?: string;
  coreCost?: string;
  moldAssembly?: string;
  castingWeightLbs?: number;
  pourPoint?: string;
  assembly?: string;
  additionalNotesInitial?: string;
}

export interface PouringInstructionsDoc {
  pourTemp?: string;
  pourTempMin?: string;
  pourTempMax?: string;
  pourTime?: string;
  ladleSize?: string;
  inoculant?: string;
  inoculantAmount?: string;
  nodulizer?: string;
  nodularizerAmount?: string;
  filterType?: string;
  filterSize?: string;
  skimTime?: string;
  holdTime?: string;
  shakeoutTime?: string;
  specialInstructions?: string;
  notes?: string;
}

export interface NdTestRequirementsDoc {
  rtRequired?: string;
  rtLevel?: string;
  utRequired?: string;
  utLevel?: string;
  mtRequired?: string;
  mtLevel?: string;
  ptRequired?: string;
  ptLevel?: string;
  visualRequired?: string;
  visualLevel?: string;
  testNotes?: string;
}

export interface LessonLearnedDoc {
  id?: string;
  category?: string;
  issue?: string;
  rootCause?: string;
  solution?: string;
  preventiveMeasure?: string;
  recordedBy?: string;
  recordedDate?: string;
}

export interface JobDocument {
  _id?: ObjectId;
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
  daysOnFloor?: number;
  designInfo?: DesignInfoDoc;
  assemblyInfo?: AssemblyInfoDoc;
  cleaningInfo?: CleaningInfoDoc;
  pouringInstructions?: PouringInstructionsDoc;
  ndTestRequirements?: NdTestRequirementsDoc;
  lessonsLearned?: LessonLearnedDoc[];
  ndtSpecId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function connectToMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(activeDatabaseName);
    console.log(`Connected to MongoDB database: ${activeDatabaseName}`);
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export async function getDatabase(): Promise<Db> {
  if (!db) {
    return await connectToMongoDB();
  }
  return db;
}

export async function getJobsCollection(): Promise<Collection<JobDocument>> {
  const database = await getDatabase();
  return database.collection<JobDocument>("jobs");
}

export interface WorkflowStatusDoc {
  _id?: ObjectId;
  task: string;
  color: string;
  sortOrder: number;
  department?: string;
}

export async function getWorkflowStatusesCollection(): Promise<Collection<WorkflowStatusDoc>> {
  const database = await getDatabase();
  return database.collection<WorkflowStatusDoc>("workflow_statuses");
}

export interface ChangeLogChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface ChangeLogEntry {
  _id?: ObjectId;
  jobId: string;
  jobNumber: string;
  changedBy: string;
  changedAt: string;
  source: "dashboard" | "sync" | "system";
  changes: ChangeLogChange[];
}

export async function getChangeLogCollection(): Promise<Collection<ChangeLogEntry>> {
  const database = await getDatabase();
  return database.collection<ChangeLogEntry>("change_log");
}

export interface UserDoc {
  _id?: ObjectId;
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  department?: string | null;
  jobTitle?: string | null;
}

export interface DepartmentDoc {
  _id?: ObjectId;
  name: string;
  description: string;
  parentDepartmentId?: string | null;
  color: string;
}

export interface PositionDoc {
  _id?: ObjectId;
  name: string;
  description: string;
  departmentId?: string | null;
  level: number;
}

export interface CustomPermissionDoc {
  _id?: ObjectId;
  name: string;
  description: string;
  module: string;
}

export interface PositionPermissionDoc {
  _id?: ObjectId;
  positionId: string;
  permissionId: string;
}

export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const database = await getDatabase();
  return database.collection<UserDoc>("users");
}

export async function getDepartmentsCollection(): Promise<Collection<DepartmentDoc>> {
  const database = await getDatabase();
  return database.collection<DepartmentDoc>("departments");
}

export async function getPositionsCollection(): Promise<Collection<PositionDoc>> {
  const database = await getDatabase();
  return database.collection<PositionDoc>("positions");
}

export async function getCustomPermissionsCollection(): Promise<Collection<CustomPermissionDoc>> {
  const database = await getDatabase();
  return database.collection<CustomPermissionDoc>("customPermissions");
}

export async function getPositionPermissionsCollection(): Promise<Collection<PositionPermissionDoc>> {
  const database = await getDatabase();
  return database.collection<PositionPermissionDoc>("positionPermissions");
}

export async function getMaterialsCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("materials");
}

export async function getNdtSpecificationsCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("ndt_specifications");
}

export async function getJobAttachmentsCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("job_attachments");
}

export async function getTimeEntriesCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("time_entries");
}

export async function getSchedulesCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("schedules");
}

export async function getShiftTemplatesCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("shift_templates");
}

export async function getDayTemplatesCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("day_templates");
}

export async function getDayTemplateShiftsCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("day_template_shifts");
}

export async function getChecklistTemplatesCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("checklist_templates");
}

export async function getChecklistTemplateItemsCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("checklist_template_items");
}

export async function getMoldChecklistItemsCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("mold_checklist_items");
}

export async function getStorageJobsCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("storage_jobs");
}

export async function getDesignInfoCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("design_info");
}

export async function getAssemblyInfoCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("assembly_info");
}

export async function getCleaningRoomInfoCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("cleaning_room_info");
}

export async function getPouringInstructionsCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("pouring_instructions");
}

export async function getNdTestRequirementsCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("nd_test_requirements");
}

export async function getLessonsLearnedCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection("lessons_learned");
}

export function getMongoClient(): MongoClient | null {
  return client;
}

export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB connection closed");
  }
}

export function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}

export { ObjectId };
