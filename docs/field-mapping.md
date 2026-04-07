# Field Mapping: Dashboard <-> JobBoss SQL <-> MongoDB

This document maps every field in the system to its data source, based on analysis of the full JobBoss SQL schema (131 tables, 2,294 columns). It identifies what can be pulled automatically from JobBoss, what must be entered on the Dashboard, and how job status/task should be derived from routing operations.

## Legend

| Symbol | Meaning |
|--------|---------|
| **JB** | Sourced from JobBoss SQL (read-only in dashboard, synced to MongoDB) |
| **DASH** | Entered/managed on the Dashboard only, stored in MongoDB |
| **CALC** | Calculated or derived at display time from other data |
| **HYBRID** | Seeded from JobBoss but can be overridden/extended on Dashboard |

---

## Section 1: Dashboard Table Columns - Current Mapping

### Dashboard Table Columns

| # | Dashboard Column | App Field | JobBoss SQL Table.Column | Source | Sync Notes |
|---|---|---|---|---|---|
| 1 | Status | `status` | `Job.Status` | **JB** | Values: Active, Complete, Closed, Canceled, Template |
| 2 | Company | `company` | `Job.Customer` -> `Customer.Customer` | **JB** | FK to Customer table. Could also pull full company name from `Customer.Name` |
| 3 | Part Number | `partNumber` | `Job.Part_Number` | **JB** | varchar(50) |
| 4 | Job Number | `jobNumber` | `Job.Job` | **JB** | Primary key, varchar(30) |
| 5 | Sand Mold | `sandMoldSize` | -- | **DASH** | No equivalent in JobBoss |
| 6 | Material | `material` | Derived from `Material_Req` | **JB** | See "Material Selection Rule" below. Current sync uses a pre-derived `Material` field on the job doc |
| 7 | Pour Weight | `pourWeight` | -- | **DASH** | No equivalent in JobBoss |
| 8 | Owner | `owner` | `Job.Sales_Code` | **HYBRID** | Sales code in JobBoss. Dashboard may reassign |
| 9 | Quantity Needed | `quantityNeeded` | `Job.Order_Quantity` | **JB** | int, NOT NULL |
| 10 | Molds Needed | `moldsNeeded` | `Job.Make_Quantity` | **HYBRID** | JobBoss tracks make qty, foundry may adjust |
| 11 | Certs | `certs` | `Job.Certs_Required` | **JB** | bit (boolean) in SQL -> "Yes"/"No" on dashboard |
| 12 | Cores Ordered | `coresOrdered` | -- | **DASH** | No equivalent in JobBoss |
| 13 | Promised Date | `promisedDate` | `Delivery.Promised_Date` | **JB** | From Delivery table (FK: Job). Falls back to `Job.Order_Date` |
| 14 | Heat Treat | `heatTreat` | -- | **DASH** | No equivalent. Could potentially parse from Job.Note_Text or Job.Description |
| 15 | Notes | `notes` | `Job.Note_Text` + `Job.Comment` | **HYBRID** | JobBoss has both Note_Text (text) and Comment (text). Dashboard can add more |
| 16 | Inform Melt | `informMelt` | -- | **DASH** | No equivalent in JobBoss |
| 17 | Molds Split Off | `moldsSplitOff` | `Job.Split_Quantity` / `Job.Split_To_Job` | **HYBRID** | JobBoss tracks split quantity and whether it was split. Dashboard may extend |
| 18 | Days on Floor | `daysOnFloor` | -- | **CALC** | Can calculate from `Job.Order_Date` or `Job.Released_Date` to today |

### All MongoJob Fields (Complete List)

These are ALL fields in the app's `MongoJob` interface, with their source classification:

| App Field | JobBoss SQL Source | Source | Notes |
|---|---|---|---|
| `id` | `Job._id` (MongoDB ObjectId) | auto | Generated |
| `jobNumber` | `Job.Job` | **JB** | Primary identifier |
| `status` | `Job.Status` | **JB** | ERP status (Active/Complete/etc.) |
| `task` | Derived from `Job_Operation` routing | **CALC** | See Section 4. NOT from `Job.Type`. `Job.Type` is the job type (Regular/Rework/etc.), not the workflow stage |
| `company` | `Job.Customer` | **JB** | Customer code |
| `customer` | `Job.Customer` | **JB** | Same as company (alias) |
| `partNumber` | `Job.Part_Number` | **JB** | Part identifier |
| `description` | `Job.Description` | **JB** | Part description |
| `partType` | Derived by sync script | **JB** | Part category (IMPELLER, BODY, etc.) |
| `castingType` | Derived by sync script | **JB** | ROBOCAST, STANDARD, etc. |
| `moldSize` | -- | **DASH** | Not in JobBoss |
| `sandMoldSize` | -- | **DASH** | Not in JobBoss |
| `material` | Derived from `Material_Req` | **JB** | See Material Selection Rule |
| `pourWeight` | -- | **DASH** | Not in JobBoss |
| `owner` | `Job.Sales_Code` | **HYBRID** | Can be overridden on dashboard |
| `quantityNeeded` | `Job.Order_Quantity` | **JB** | |
| `quantityCompleted` | `Job.Completed_Quantity` or `Job.Shipped_Quantity` | **JB** | Currently mapped from `Shipped_Quantity`. Should use `Completed_Quantity` for in-process accuracy |
| `moldsNeeded` | `Job.Make_Quantity` | **HYBRID** | |
| `certs` | `Job.Certs_Required` | **JB** | Boolean -> Yes/No |
| `customChills` | -- | **DASH** | Not in JobBoss |
| `coresOrdered` | -- | **DASH** | Not in JobBoss |
| `promisedDate` | `Delivery.Promised_Date` | **JB** | |
| `heatTreat` | -- | **DASH** | Not in JobBoss |
| `assemblyCode` | -- | **DASH** | Not in JobBoss. Foundry-specific internal code |
| `estAssemblyTime` | -- | **DASH** | Not in JobBoss. Could potentially derive from Job_Operation est hours for assembly ops |
| `modelApproved` | -- | **DASH** | Not in JobBoss. Could tie to a specific operation's completion status |
| `notes` | `Job.Note_Text` + `Job.Comment` | **HYBRID** | |
| `informMelt` | -- | **DASH** | Not in JobBoss |
| `moldsSplitOff` | `Job.Split_Quantity` | **HYBRID** | JB has the split count; dashboard may add context |
| `daysOnFloor` | -- | **CALC** | Calculate from `Job.Released_Date` to today |
| `designInfo` | -- | **DASH** | Nested sub-document, all dashboard entry |
| `assemblyInfo` | -- | **DASH** | Nested sub-document, all dashboard entry |
| `cleaningInfo` | -- | **DASH** | Nested sub-document, all dashboard entry |
| `pouringInstructions` | -- | **DASH** | Nested sub-document, all dashboard entry |
| `ndTestRequirements` | -- | **DASH** | Nested sub-document, all dashboard entry |
| `lessonsLearned` | -- | **DASH** | Nested sub-document, all dashboard entry |
| `createdAt` | `Job.Order_Date` | **JB** | |
| `updatedAt` | `Job.Last_Updated` | **JB** | |

### Material Selection Rule

A job can have multiple `Material_Req` records (one per operation that needs material). The current Python sync script derives a single `Material` field using this logic:

1. Query `Material_Req` where `Material_Req.Job = Job.Job`
2. Filter to the PRIMARY material requirement (typically `Material_Req.Type = 'R'` for raw material, excluding hardware/supplies)
3. If multiple raw materials exist, use the one linked to the FIRST operation (`Material_Req.Job_Operation` with lowest sequence)
4. The `Material_Req.Material` value references `Material.Material` for the full material code

The sync script may also derive `Material_Description` by joining to the `Material` table for the description + cost info.

**Current state**: The sync script appears to pre-compute `Material` and `Material_Description` fields before writing to MongoDB, so the dashboard reads these as flat fields

---

## Section 2: Additional Fields Available from JobBoss SQL (Not Yet Synced)

These fields exist in JobBoss SQL and could be synced to MongoDB to enrich the dashboard.

### From the `Job` Table (33,474 rows)

| JobBoss SQL Column | Type | Currently Synced? | Recommended Action |
|---|---|---|---|
| `Job.Description` | varchar(50) | Yes (as `Description`) | Keep - show in detail panel |
| `Job.Ext_Description` | text | No | Sync - extended part description |
| `Job.Rev` | varchar(10) | No | Sync - part revision level |
| `Job.Drawing` | varchar(30) | No | Sync - drawing number reference |
| `Job.Type` | varchar(8) | Yes (as `Type`) | Keep - job type (Regular/Rework/Assembly). NOT the workflow stage. See Section 4 for `task` derivation |
| `Job.Order_Date` | datetime | Yes | Keep |
| `Job.Status_Date` | datetime | No | Sync - when status last changed |
| `Job.Completed_Quantity` | int | No | **Sync** - actual completed castings |
| `Job.Shipped_Quantity` | int | Yes | Keep - progress tracking |
| `Job.Remaining_Quantity` (calc) | -- | Yes | Keep |
| `Job.In_Production_Quantity` | int | No | **Sync** - currently in production |
| `Job.Split_Quantity` | int | No | **Sync** - maps to `moldsSplitOff` |
| `Job.Split_To_Job` | bit | No | **Sync** - whether job was split |
| `Job.Extra_Quantity` | int | No | Sync - extra quantity ordered |
| `Job.Pick_Quantity` | int | No | Optional |
| `Job.Open_Operations` | smallint | No | **Sync** - number of ops not yet complete |
| `Job.Scrap_Pct` | float | No | Sync - expected scrap percentage |
| `Job.Est_Scrap_Qty` | int | No | Sync |
| `Job.Act_Scrap_Quantity` | int | No | **Sync** - actual scrap count |
| `Job.Priority` | smallint | No | **Sync** - job priority ranking |
| `Job.Unit_Price` | float | Yes | Keep |
| `Job.Total_Price` | money | No | Sync - total order value |
| `Job.Customer_PO` | varchar(20) | No | **Sync** - customer purchase order number |
| `Job.Customer_PO_LN` | varchar(6) | No | Sync - PO line number |
| `Job.Sched_Start` | datetime | No | **Sync** - scheduled start date |
| `Job.Sched_End` | datetime | No | **Sync** - scheduled end date |
| `Job.Released_Date` | datetime | No | **Sync** - when released to production |
| `Job.Certs_Required` | bit | Yes (as `requires_material_certs`) | Keep |
| `Job.Sales_Rep` | varchar(6) | No | Sync - FK to Employee table |
| `Job.Quote` | varchar(30) | Yes | Keep - quote reference |
| `Job.Top_Lvl_Job` | varchar(30) | No | Sync - parent job for assemblies |
| `Job.Est_Total_Hrs` | float | No | Sync - estimated total hours |
| `Job.Est_Rem_Hrs` | float | No | **Sync** - estimated remaining hours |
| `Job.Act_Total_Hrs` | float | No | Sync - actual hours spent |
| `Job.Comment` | text | No | **Sync** - separate from Note_Text |
| `Job.Assembly_Level` | smallint | No | Sync - for multi-level jobs |
| `Job.Source` | varchar(20) | No | Optional |
| `Job.Last_Updated` | datetime | Yes | Keep |

### From the `Job_Operation` Table (155,483 rows) - CRITICAL FOR STATUS RULES

This is the routing table. Each job has multiple operations in sequence. The status of these operations determines where a job is in the workflow.

| JobBoss SQL Column | Type | Purpose for Dashboard |
|---|---|---|
| `Job_Operation.Job` | varchar(30) | FK to Job - links operations to jobs |
| `Job_Operation.Sequence` | smallint | Operation order (10, 20, 30, etc.) |
| `Job_Operation.Work_Center` | varchar(10) | Which work center/department (FK to Work_Center) |
| `Job_Operation.Description` | varchar(25) | Operation name (e.g., "MOLD", "POUR", "CLEAN", "ASSEMBLE") |
| `Job_Operation.Status` | varchar(1) | **O**=Open, **S**=Started, **C**=Complete |
| `Job_Operation.Sequence` | smallint | Determines operation order |
| `Job_Operation.Act_Run_Qty` | int | Actual quantity run through this operation |
| `Job_Operation.Act_Scrap_Qty` | int | Scrap at this operation |
| `Job_Operation.Setup_Pct_Complete` | float | Setup progress percentage |
| `Job_Operation.Run_Pct_Complete` | float | Run progress percentage |
| `Job_Operation.Sched_Start` | datetime | Scheduled start for this operation |
| `Job_Operation.Sched_End` | datetime | Scheduled end for this operation |
| `Job_Operation.Due_Date` | datetime | Due date for this operation |
| `Job_Operation.Actual_Start` | datetime | When work actually began |
| `Job_Operation.Est_Setup_Hrs` | float | Estimated setup hours |
| `Job_Operation.Est_Run_Hrs` | float | Estimated run hours |
| `Job_Operation.Act_Setup_Hrs` | float | Actual setup hours |
| `Job_Operation.Act_Run_Hrs` | float | Actual run hours |
| `Job_Operation.Rem_Run_Hrs` | float | Remaining run hours |
| `Job_Operation.Rem_Setup_Hrs` | float | Remaining setup hours |
| `Job_Operation.Floor_Notes` | text | Notes visible on shop floor |
| `Job_Operation.Inside_Oper` | bit | True = done in-house, False = outsourced |
| `Job_Operation.Vendor` | varchar(10) | Outside vendor if not inside |
| `Job_Operation.Note_Text` | text | Operation-level notes |

### From the `Work_Center` Table (59 rows)

| Column | Purpose |
|---|---|
| `Work_Center.Work_Center` | ID (e.g., "MOLD", "POUR", "CLEAN", "GRIND", "ASSEMBLE") |
| `Work_Center.Department` | Department grouping |
| `Work_Center.Type` | Work center type |
| `Work_Center.Setup_Labor_Rate` | Cost rate |
| `Work_Center.Run_Labor_Rate` | Cost rate |

### From the `Delivery` Table (46,285 rows)

| Column | Currently Synced? | Purpose |
|---|---|---|
| `Delivery.Promised_Date` | Yes (first delivery) | Promised ship date |
| `Delivery.Requested_Date` | Yes | Customer requested date |
| `Delivery.Promised_Quantity` | Yes | Qty promised for this delivery |
| `Delivery.Shipped_Quantity` | Yes | Qty shipped |
| `Delivery.Remaining_Quantity` | Yes | Qty remaining |
| `Delivery.Shipped_Date` | No | **Sync** - actual ship date |
| `Delivery.Invoice` | No | Optional - invoice reference |

### From the `Material` Table (298 rows)

| Column | Purpose |
|---|---|
| `Material.Material` | Material ID/code |
| `Material.Description` | Full material description |
| `Material.Type` | Material type |
| `Material.Class` | Material class |
| `Material.Standard_Cost` | Standard cost per unit |
| `Material.Average_Cost` | Average cost |
| `Material.Last_Cost` | Most recent cost |
| `Material.On_Order_Qty` | Quantity on order |
| `Material.Lot_Trace` | Whether lot tracing is required |

### From the `Material_Req` Table (98,861 rows)

Material requirements per job - what raw materials are needed.

| Column | Purpose |
|---|---|
| `Material_Req.Job` | FK to Job |
| `Material_Req.Material` | FK to Material |
| `Material_Req.Job_Operation` | FK to which operation needs it |
| `Material_Req.Description` | Material description for this req |
| `Material_Req.Est_Qty` | Estimated quantity needed |
| `Material_Req.Act_Qty` | Actual quantity used |
| `Material_Req.Est_Unit_Cost` | Estimated cost |
| `Material_Req.Certs_Required` | Whether certs needed for this material |
| `Material_Req.Status` | Requirement status |
| `Material_Req.Due_Date` | When material is needed |

### From the `Customer` Table

| Column | Purpose |
|---|---|
| `Customer.Customer` | Customer code (FK from Job) |
| `Customer.Name` | Full company name (currently we only show the code) |
| `Customer.Status` | Customer status |

### From the `Job_Operation_Time` Table (113,264 rows)

Actual time entries by employees against operations. Useful for tracking labor.

| Column | Purpose |
|---|---|
| `Job_Operation_Time.Job_Operation` | FK to operation |
| `Job_Operation_Time.Employee` | Who worked on it |
| `Job_Operation_Time.Work_Date` | Date of work |
| `Job_Operation_Time.Act_Setup_Hrs` | Setup hours logged |
| `Job_Operation_Time.Act_Run_Hrs` | Run hours logged |
| `Job_Operation_Time.Act_Run_Qty` | Pieces completed |
| `Job_Operation_Time.Act_Scrap_Qty` | Pieces scrapped |
| `Job_Operation_Time.Operation_Complete` | Whether this entry completed the operation |

### From the `Quote` Table (25,978 rows)

| Column | Purpose |
|---|---|
| `Quote.Quote` | Quote number (cross-ref from Job) |
| `Quote.Part_Number` | Part quoted |
| `Quote.Description` | Quote description |
| `Quote.Status` | Quote status |

### From the `Attachment` Table (53,526 rows)

| Column | Purpose |
|---|---|
| `Attachment.Owner_Type` | What the attachment belongs to (Job, Quote, etc.) |
| `Attachment.Owner_ID` | The job/quote number |
| `Attachment.Attach_Path` | File path |
| `Attachment.Description` | File description |

---

## Section 3: Recommended Additional Fields to Sync from JobBoss

Priority fields that would most benefit the Dashboard:

### High Priority (Sync ASAP)

| Field | Source | Why |
|---|---|---|
| `Completed_Quantity` | Job | Shows actual castings completed vs ordered |
| `In_Production_Quantity` | Job | Shows what's currently being worked on |
| `Customer_PO` | Job | Customers reference PO numbers constantly |
| `Sched_Start` / `Sched_End` | Job | Scheduling visibility |
| `Released_Date` | Job | Needed to calculate `daysOnFloor` |
| `Priority` | Job | Job priority for sorting/flagging |
| `Open_Operations` | Job | Quick indicator of remaining work |
| `Est_Rem_Hrs` | Job | Estimated remaining hours |
| `Split_Quantity` | Job | Replace manual `moldsSplitOff` entry |
| `Job_Operation.*` (routing) | Job_Operation | **Critical for status/task rules** |
| `Customer.Name` | Customer | Show full company name instead of code |

### Medium Priority

| Field | Source | Why |
|---|---|---|
| `Rev` | Job | Part revision tracking |
| `Drawing` | Job | Drawing reference |
| `Act_Scrap_Quantity` | Job | Quality tracking |
| `Est_Total_Hrs` / `Act_Total_Hrs` | Job | Labor tracking |
| `Comment` | Job | Additional notes field |
| `Status_Date` | Job | When status last changed |
| `Delivery.Shipped_Date` | Delivery | Actual ship dates |
| `Material_Req.*` | Material_Req | Material requirements per job |

### Low Priority (Nice to Have)

| Field | Source | Why |
|---|---|---|
| `Total_Price` | Job | Financial info |
| `Top_Lvl_Job` | Job | Parent/child job tracking |
| `Assembly_Level` | Job | Multi-level BOM tracking |
| `Attachment.*` | Attachment | Linked files/drawings |
| `Quote.*` | Quote | Quote history |
| `Job_Operation_Time.*` | Job_Operation_Time | Detailed labor entries |

---

## Section 4: Status / Task Rules Based on Routing

The `task` field on the Dashboard should reflect WHERE a job currently is in the foundry workflow. This can be derived from `Job_Operation` records.

### How JobBoss Routing Works

Each job has multiple `Job_Operation` records ordered by `Sequence` (typically 10, 20, 30, etc.). Each operation has:
- `Work_Center` - which department/station (e.g., "DESIGN", "MOLD", "POUR", "CLEAN", "GRIND", "ASSEMBLE", "SHIP")
- `Status` - **O** (Open), **S** (Started/In Progress), **C** (Complete)
- `Actual_Start` - when work actually began (null if not started)

### Task/Status Derivation Rules

The Dashboard `task` (or a new `currentStation` field) is determined by scanning a job's `operations` array in sequence order:

```
Rule 1: Find the FIRST operation where Status = 'S' (Started)
        -> That operation's Work_Center = current task/station

Rule 2: If NO operation is Started, find the FIRST operation where Status = 'O' (Open)
        -> That operation's Work_Center = next task/station (waiting)

Rule 3: If ALL operations are Complete (Status = 'C')
        -> Task = "Complete" or "Ready to Ship"

Rule 4: If Job.Status = 'Active' but no operations exist
        -> Task = "New" or "Awaiting Routing"
```

### Actual Work Centers (35 used on 2025 jobs)

| Work Center | Friendly Name | Department | Dashboard Task Label |
|---|---|---|---|
| **Engineering / Design** | | | |
| `ENG-CAD` | CAD | iCast - Robot | Waiting on CAD |
| `ENG-SIM` | Simulation | iCast - Robot | Solidification / Gating |
| `ENG-PRGM` | Program | iCast - Robot | Programming |
| `ENG-PREP` | (none) | iCast - Robot | Engineering Prep |
| `ENG-INSP` | (none) | iCast - Robot | Engineering Inspection |
| `LASER SCAN` | (none) | iCast - Robot | Laser Scan |
| **Core Making** | | | |
| `CORE` | (none) | Maintenance | Core |
| `CORE -PALM` | (none) | Core | Core - Palmer |
| `CORE-VOX` | (none) | (none) | Core - Voxeljet |
| **Mold / Assembly** | | | |
| `ICAST` | Robot | iCast - Robot | Running on Robot (when Started) / Ready for Robot (when Open & all prior ops complete) |
| `ICAST-ASSY` | Assembly | iCast - Robot | Waiting to be Assembled |
| `ICAST REW` | (none) | iCast - Robot | iCast Rework |
| `MOLD -LOOP` | (none) | Molding | Mold - Looping |
| `MOLD-LOOSE` | (none) | Molding | Mold - Loose |
| `MOLD -PM` | (none) | Perm Mold | Perm Mold |
| `HAAS - PAT` | (none) | Robo Pattern | Pattern Machining |
| **Melting / Pouring** | | | |
| `MELT FE` | Melt | Melting | Ready to Pour |
| **Post-Pour** | | | |
| `SHAKEOUT` | Shakeout | (none) | Shakeout |
| `HEAT TREAT` | (none) | (none) | Heat Treat |
| **Cleaning / Finishing** | | | |
| `CLEAN` | Cleaning Room | Cleaning | Grinding Room |
| `BENCH` | (none) | Cleaning | Bench Work |
| `STRAIGHT` | (none) | Cleaning | Straightening |
| `DIE PEN` | (none) | Cleaning | Dye Penetrant |
| `MPI` | (none) | Cleaning | MPI Testing |
| **Inspection / Certs** | | | |
| `INSPECTION` | Inspection | (none) | Inspection |
| `CERT` | (none) | (none) | Certs / Documentation |
| **Machining** | | | |
| `MACHINE` | (none) | Machining | At Machine Shop |
| `HAAS` | (none) | Machining | At Machine Shop |
| `CMM` | (none) | Machining | CMM Measurement |
| `INTEGREX` | (none) | Machining | At Machine Shop |
| `MAZAKH6800` | (none) | Machining | At Machine Shop |
| **Expedite** | | | |
| `EXPEDITE` | (none) | iCast - Robot | Expedite |
| **Obsolete (still on some 2025 jobs)** | | | |
| `MAZAK 500` | (none) | ZOBSOLETE | At Machine Shop |
| `MAZAK-UNAT` | (none) | ZOBSOLETE | At Machine Shop |
| `NULL` | (no WC assigned) | -- | Unassigned |

### Work Center to Dashboard Task Mapping (Code)

```javascript
const workCenterToTask: Record<string, string> = {
  "ENG-CAD":     "Waiting on CAD",
  "ENG-SIM":     "Solidification / Gating",
  "ENG-PRGM":    "Programming",
  "ENG-PREP":    "Engineering Prep",
  "ENG-INSP":    "Engineering Inspection",
  "LASER SCAN":  "Laser Scan",

  "CORE":        "Core",
  "CORE -PALM":  "Core - Palmer",
  "CORE-VOX":    "Core - Voxeljet",

  "ICAST":       "Running on Robot",  // "Ready for Robot" when Open (all prior ops complete)
  "ICAST-ASSY":  "Waiting to be Assembled",
  "ICAST REW":   "iCast Rework",
  "MOLD -LOOP":  "Mold - Looping",
  "MOLD-LOOSE":  "Mold - Loose",
  "MOLD -PM":    "Perm Mold",
  "HAAS - PAT":  "Pattern Machining",

  "MELT FE":     "Ready to Pour",

  "SHAKEOUT":    "Shakeout",
  "HEAT TREAT":  "Heat Treat",

  "CLEAN":       "Grinding Room",
  "BENCH":       "Bench Work",
  "STRAIGHT":    "Straightening",
  "DIE PEN":     "Dye Penetrant",
  "MPI":         "MPI Testing",

  "INSPECTION":  "Inspection",
  "CERT":        "Certs / Documentation",

  "MACHINE":     "At Machine Shop",
  "HAAS":        "At Machine Shop",
  "CMM":         "CMM Measurement",
  "INTEGREX":    "At Machine Shop",
  "MAZAKH6800":  "At Machine Shop",

  "EXPEDITE":    "Expedite",

  "MAZAK 500":   "At Machine Shop",
  "MAZAK-UNAT":  "At Machine Shop",
};
```

### Additional Status Conditions / Badges

**Currently implemented in code:**

| Condition | Dashboard Behavior |
|---|---|
| `Job.Status = 'Active'` AND no operations array | Task = "Awaiting Routing" |
| First op with `Status = 'S'` found | Task = that op's work center label |
| No started op, first op with `Status = 'O'` found | Task = that op's work center label |
| All ops `Status = 'C'` | Task = "Complete" |

**Planned for future sync script update (not yet implemented):**

| Condition | Dashboard Behavior |
|---|---|
| Any operation has `Inside_Oper = 0` (outsourced) AND is current | Append "(Outside)" to task label |
| `Job.is_expedite = true` | Add "EXPEDITE" flag/badge |
| `Job.Certs_Required = true` | Show "Certs" indicator |
| `Job.Split_To_Job = true` | Show "Split" indicator |
| All ops Complete AND `Delivery.Remaining_Quantity > 0` | Task = "Ready to Ship" |
| All ops Complete AND `Delivery.Remaining_Quantity = 0` | Task = "Shipped" |

**Note on task field precedence:** When an `operations` array exists on the MongoDB document, the task is ALWAYS derived from routing (operations win). If no operations array is present, the stored `task` field is used as fallback. This ensures routing data is always authoritative when available.

---

## Section 5: Dashboard-Only Fields (Must Be Entered Manually)

These fields have NO equivalent anywhere in JobBoss SQL and must be entered on the Dashboard:

| App Field | Dashboard Column | Purpose | Notes |
|---|---|---|---|
| `sandMoldSize` | Sand Mold | Mold size designation | Foundry-specific, not tracked in ERP |
| `pourWeight` | Pour Weight | Weight of metal pour | Could potentially derive from Material_Req quantities + material density |
| `coresOrdered` | Cores Ordered | Core order tracking | Not tracked in JobBoss |
| `heatTreat` | Heat Treat | HT requirements | Could parse from Job.Note_Text or derive from Material/spec |
| `informMelt` | Inform Melt | Melt department notification | Internal foundry coordination |
| `customChills` | (detail panel) | Chill requirements | Design engineering data |
| `modelApproved` | (detail panel) | Model/pattern approval | Could potentially tie to operation status |

### Fields That Could Be REPLACED by JobBoss Data

| Current DASH Field | Could Replace With | How |
|---|---|---|
| `moldsSplitOff` | `Job.Split_Quantity` | Sync from JobBoss SQL |
| `daysOnFloor` | CALC from `Job.Released_Date` | `today - Released_Date` in days |
| `quantityCompleted` | `Job.Completed_Quantity` | Direct sync (more accurate than Shipped_Quantity) |

---

## Section 6: Sub-Document Fields (Job Detail Panel) - All Dashboard Entry

These nested objects are foundry-specific engineering data with no JobBoss equivalent:

### Design Info (`designInfo`) - 8 fields
solidificationGating, quality, sprues, basinSize, feeders, chills, gatingSystem, moldCoating

### Assembly Info (`assemblyInfo`) - 8 fields
moldSize, paint, robotTimeCope, robotTimeDrag, mpiCerted, assemblyNotes, coreBoxes, specialTooling

### Cleaning Room Info (`cleaningInfo`) - 11 fields
cleanTime, moldRating, pouringPictures, castingPictures, coreAssembly, coreCost, moldAssembly, castingWeightLbs, pourPoint, assembly, additionalNotesInitial

### Pouring Instructions (`pouringInstructions`)
All foundry-specific, no JobBoss equivalent

### ND Test Requirements (`ndTestRequirements`)
All foundry-specific, no JobBoss equivalent

### Lessons Learned (`lessonsLearned`)
All foundry-specific, no JobBoss equivalent

---

## Section 7: Data Flow Architecture

```
JobBoss SQL Server (SCP-SQL\JOBBOSS)
  |
  | Python Sync Script (runs periodically)
  | Reads: Job, Job_Operation, Delivery, Material_Req, Customer, Work_Center
  |
  v
MongoDB Atlas (JobBoss database, jobs collection)
  |
  | Contains: JB fields + routing operations + deliveries
  |
  v
Dashboard API (Express server)
  |
  | Reads JB data, merges with Dashboard-entered fields
  | Derives task/status from routing operations
  |
  v
Dashboard UI (React)
  |
  | Displays merged data
  | Users enter foundry-specific fields
  |
  v
MongoDB Atlas (writes back Dashboard-only fields)
```

### Sync Strategy: Dashboard Wins on Hybrid Fields

1. **JB-owned fields**: Only the Python sync writes these. Dashboard displays read-only.
2. **DASH-owned fields**: Only the Dashboard writes these. Python sync must never touch them.
3. **HYBRID fields (Dashboard Wins)**: JB provides the initial/seed value. Once a user edits a hybrid field on the Dashboard, that value takes priority forever.
4. **Routing data**: Sync `Job_Operation` records as an `operations` array per job in MongoDB. Dashboard reads to derive task/status.

**Hybrid fields and their JB seeds:**

| Hybrid Field | JB Seed Source | Dashboard Override Behavior |
|---|---|---|
| `owner` | `Job.Sales_Code` | Once changed on Dashboard, JB sync won't overwrite |
| `moldsNeeded` | `Job.Make_Quantity` | Once changed on Dashboard, JB sync won't overwrite |
| `moldsSplitOff` | `Job.Split_Quantity` | Once changed on Dashboard, JB sync won't overwrite |
| `notes` | `Job.Note_Text` | Dashboard notes appended separately. JB notes preserved as `jb_notes` |

**Current implementation (read path):**
The `documentToJob` function in `server/mongoStorage.ts` reads hybrid fields from a `dashboard` sub-document first, then falls back to top-level fields (which include JB-synced values). This ensures that if a `dashboard` sub-doc is present, its values always win.

**What the Python sync script needs to do:**
When syncing JB data, the script should write JB-owned fields to the top level of the document. For hybrid fields, it should:
- Only write to the top-level field (e.g., `Sales_Code`, `Make_Quantity`)
- Never touch the `dashboard` sub-document
- The dashboard API should write user edits into the `dashboard` sub-document

**Dashboard API (IMPLEMENTED):**
When a user edits a hybrid or dashboard-only field, the `updateJob` method in `server/mongoStorage.ts` writes the value to BOTH the top-level field AND `dashboard.{fieldName}`. On read, `documentToJob` checks `dashboard.*` first, so the user's edit always wins over the JB-synced top-level value. Sub-document updates (designInfo, assemblyInfo, etc.) also write to both locations.

### Recommended MongoDB Document Structure (Enhanced)

```json
{
  "_id": "...",
  "Job": 35093,
  "Customer": "FLOWSERVE",
  "Part_Number": "29607016",
  "Status": "Active",
  "Order_Quantity": 1,
  "Make_Quantity": 1,
  "Material": "CA6NM",
  "Certs_Required": true,
  "Customer_PO": "PO-12345",
  "Priority": 5,
  "Sched_Start": "2026-02-01",
  "Sched_End": "2026-03-15",
  "Released_Date": "2026-01-28",
  "Completed_Quantity": 0,
  "In_Production_Quantity": 1,
  "Split_Quantity": 0,
  "Open_Operations": 3,
  "Est_Rem_Hrs": 24.5,

  "operations": [
    {
      "sequence": 10,
      "work_center": "DESIGN",
      "description": "Solidification",
      "status": "C",
      "actual_start": "2026-01-30",
      "act_run_hrs": 4.5
    },
    {
      "sequence": 20,
      "work_center": "MOLD",
      "description": "Mold Assembly",
      "status": "S",
      "actual_start": "2026-02-10",
      "sched_end": "2026-02-14"
    },
    {
      "sequence": 30,
      "work_center": "POUR",
      "description": "Pouring",
      "status": "O",
      "sched_start": "2026-02-15"
    }
  ],

  "deliveries": [
    {
      "promised_date": "2026-03-01",
      "requested_date": "2026-02-15",
      "promised_quantity": 1,
      "shipped_quantity": 0
    }
  ],

  "dashboard": {
    "sandMoldSize": "24x24",
    "pourWeight": "450 lbs",
    "coresOrdered": "Yes - 2/10",
    "heatTreat": "Normalize + Temper",
    "informMelt": "CA6NM - 500 lbs",
    "customChills": "4 external",
    "designInfo": { ... },
    "assemblyInfo": { ... },
    "cleaningInfo": { ... },
    "pouringInstructions": { ... },
    "ndTestRequirements": { ... },
    "lessonsLearned": [ ... ]
  },

  "derived": {
    "current_station": "MOLD",
    "dashboard_status": "Waiting to be Assembled",
    "days_on_floor": 17
  },

  "synced_at": "2026-02-14T08:00:00Z",
  "change_history": [ ... ]
}
```

---

## Section 8: Implementation Status & Next Steps

### Completed
1. Work center mapping: 35 codes mapped to dashboard task labels in `server/mongoStorage.ts`
2. Task derivation: `deriveTaskFromOperations()` reads operations array to determine workflow stage
3. Dashboard-wins logic: Read path checks `dashboard.*` sub-doc first, write path stores edits in both top-level and `dashboard.*`
4. Enhanced sync script: `sync/jb_sync.py` v3.0 with `$set` updates, full operations array, additional JB fields
5. Classification files: `sync/excluded_materials.txt`, `sync/part_type_classifications.txt`, `sync/metal_classifications.txt`

### Remaining
1. **Deploy sync script on-premise**: Copy `sync/` folder to the machine with SQL Server access, set `MONGO_URI` env var, schedule to run every 5-15 minutes
2. **Customize classification files**: Review and update the keyword lists in the .txt files to match your actual materials and part types
3. **Add Customer.Name lookup**: Show full company names instead of codes (requires Customer table join in sync)
4. **Add outside vendor tracking**: Append "(Outside)" to task label when `Inside_Oper = 0`
5. **Add expedite/certs badges**: Display visual indicators on dashboard for flagged jobs
