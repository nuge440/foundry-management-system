# Foundry Management System - Data Structures Documentation

This document provides a comprehensive overview of all data structures used in the Foundry Management System application.

---

## Table of Contents

1. [User Management](#user-management)
2. [Organization Hierarchy](#organization-hierarchy)
3. [Job Management](#job-management)
4. [Design Information](#design-information)
5. [Assembly Information](#assembly-information)
6. [Cleaning Room Information](#cleaning-room-information)
7. [Checklist System](#checklist-system)
8. [Materials Management](#materials-management)
9. [File Attachments](#file-attachments)
10. [Time & Attendance](#time--attendance)
11. [Employee Scheduling](#employee-scheduling)
12. [Workflow Status](#workflow-status)

---

## User Management

### Users Table (`users`)

Stores user account information for authentication and authorization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier (auto-generated) |
| `username` | TEXT | NOT NULL, UNIQUE | Login username |
| `password` | TEXT | NOT NULL | Hashed password |
| `name` | TEXT | NOT NULL | Display name |
| `email` | TEXT | NOT NULL, UNIQUE | Email address |
| `role` | TEXT | NOT NULL | User role (Admin, Manager, Designer, Operator) |
| `permissions` | TEXT[] | NOT NULL | Array of permission strings |

**Available Roles:**
- `Admin` - Full system access
- `Manager` - Management-level access
- `Designer` - Design-related access
- `Operator` - Operational access

**Available Permissions:**
- Dashboard
- Job Information
- Design Information
- Assembly Information
- Cleaning Room Info
- Checklist Design
- Workflow Status
- User Management
- Materials
- Time & Attendance
- Employee Scheduling

---

## Organization Hierarchy

### Departments Table (`departments`)

Defines organizational departments with hierarchical structure support.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `name` | TEXT | NOT NULL | Department name |
| `description` | TEXT | NOT NULL, DEFAULT "" | Department description |
| `parentDepartmentId` | VARCHAR | NULLABLE | Parent department reference (for hierarchy) |
| `color` | TEXT | NOT NULL, DEFAULT "#64748b" | Display color for UI |

### Positions Table (`positions`)

Defines job positions/roles within departments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `name` | TEXT | NOT NULL | Position name |
| `description` | TEXT | NOT NULL, DEFAULT "" | Position description |
| `departmentId` | VARCHAR | NULLABLE | Associated department |
| `level` | INTEGER | NOT NULL, DEFAULT 1 | Hierarchy level (1 = lowest) |

### Custom Permissions Table (`custom_permissions`)

Defines custom permission types for fine-grained access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `name` | TEXT | NOT NULL, UNIQUE | Permission name |
| `description` | TEXT | NOT NULL, DEFAULT "" | Permission description |
| `module` | TEXT | NOT NULL | Associated module/feature |

### Position Permissions Table (`position_permissions`)

Junction table linking positions to permissions (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `positionId` | VARCHAR | NOT NULL | Reference to position |
| `permissionId` | VARCHAR | NOT NULL | Reference to permission |

---

## Job Management

### Jobs Table (`jobs`)

Core table storing all job/order information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `status` | TEXT | NOT NULL | Current job status |
| `task` | TEXT | NOT NULL | Task/workflow status reference |
| `company` | TEXT | NOT NULL | Customer company name |
| `partNumber` | TEXT | NOT NULL | Part number identifier |
| `jobNumber` | TEXT | NOT NULL | Job number (from JobBoss or internal) |
| `moldSize` | TEXT | NOT NULL | Mold size specification |
| `material` | TEXT | NOT NULL | Material type/code |
| `pourWeight` | TEXT | NOT NULL | Pour weight specification |
| `owner` | TEXT | NOT NULL | Job owner/assignee |
| `quantityNeeded` | TEXT | NOT NULL | Total quantity required |
| `quantityCompleted` | INTEGER | NOT NULL, DEFAULT 0 | Quantity completed so far |
| `moldsNeeded` | TEXT | NOT NULL | Number of molds required |
| `certs` | TEXT | NOT NULL | Required certifications |
| `customChills` | TEXT | NOT NULL | Custom chill requirements |
| `coresOrdered` | TEXT | NOT NULL | Core ordering status |
| `promisedDate` | TEXT | NOT NULL | Promised delivery date |
| `heatTreat` | TEXT | NOT NULL | Heat treatment requirements |
| `assemblyCode` | TEXT | NOT NULL | Assembly code reference |
| `estAssemblyTime` | TEXT | NOT NULL | Estimated assembly time |
| `modelApproved` | TEXT | NOT NULL | Model approval status |
| `notes` | TEXT | NOT NULL | General notes |
| `informMelt` | TEXT | NOT NULL | Melt department notification status |
| `moldsSplitOff` | TEXT | NOT NULL | Molds split-off status |

---

## Design Information

### Design Info Table (`design_info`)

Stores design-related information for each job.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `jobId` | VARCHAR | NOT NULL, FK(jobs.id) | Reference to parent job |
| `solidificationGating` | TEXT | NOT NULL | Solidification gating analysis |
| `quality` | TEXT | NOT NULL | Quality specifications |
| `sprues` | TEXT | NOT NULL | Sprue design details |
| `basinSize` | TEXT | NOT NULL | Basin size specification |
| `feeders` | TEXT | NOT NULL | Feeder design details |
| `chills` | TEXT | NOT NULL | Chill specifications |
| `gatingSystem` | TEXT | NOT NULL | Gating system design |
| `moldCoating` | TEXT | NOT NULL | Mold coating requirements |

---

## Assembly Information

### Assembly Info Table (`assembly_info`)

Stores assembly-related information for each job.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `jobId` | VARCHAR | NOT NULL, FK(jobs.id) | Reference to parent job |
| `moldSize` | TEXT | NOT NULL | Mold size for assembly |
| `paint` | TEXT | NOT NULL | Paint/coating requirements |
| `robotTimeCope` | TEXT | NOT NULL | Robot time for cope |
| `robotTimeDrag` | TEXT | NOT NULL | Robot time for drag |
| `mpiCerted` | TEXT | NOT NULL | MPI certification status |
| `assemblyNotes` | TEXT | NOT NULL | Assembly-specific notes |
| `coreBoxes` | TEXT | NOT NULL | Core box specifications |
| `specialTooling` | TEXT | NOT NULL | Special tooling requirements |

---

## Cleaning Room Information

### Cleaning Room Info Table (`cleaning_room_info`)

Stores cleaning room process information for each job.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `jobId` | VARCHAR | NOT NULL, FK(jobs.id) | Reference to parent job |
| `cleanTime` | TEXT | NOT NULL | Cleaning time estimate |
| `moldRating` | TEXT | NOT NULL | Mold quality rating |
| `pouringPictures` | TEXT | NOT NULL | Pouring pictures reference |
| `castingPictures` | TEXT | NOT NULL | Casting pictures reference |
| `coreAssembly` | TEXT | NOT NULL | Core assembly details |
| `coreCost` | TEXT | NOT NULL | Core cost information |
| `moldAssembly` | TEXT | NOT NULL | Mold assembly details |
| `castingWeightLbs` | TEXT | NOT NULL | Casting weight in pounds |
| `pourPoint` | TEXT | NOT NULL | Pour point specification |
| `assembly` | TEXT | NOT NULL | Assembly details |
| `additionalNotesInitial` | TEXT | NOT NULL | Additional notes and initials |

---

## Checklist System

### Checklist Templates Table (`checklist_templates`)

Defines reusable checklist templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `name` | TEXT | NOT NULL | Template name |
| `description` | TEXT | DEFAULT "" | Template description |

### Checklist Template Items Table (`checklist_template_items`)

Stores items belonging to checklist templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `templateId` | VARCHAR | NOT NULL, FK(checklist_templates.id) | Reference to template |
| `itemDescription` | TEXT | NOT NULL | Description of the checklist item |
| `orderIndex` | INTEGER | NOT NULL, DEFAULT 0 | Display order |

### Mold Design Checklist Items Table (`mold_design_checklist_items`)

Stores actual checklist item entries for jobs (legacy/instance data).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `jobId` | VARCHAR | NOT NULL, FK(jobs.id) | Reference to job |
| `item` | TEXT | NOT NULL | Checklist item description |
| `initial` | TEXT | NOT NULL | User initials |
| `date` | TEXT | NOT NULL | Completion date |
| `notes` | TEXT | NOT NULL | Additional notes |

---

## Materials Management

### Materials Table (`materials`)

Stores material specifications and documentation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `code` | TEXT | NOT NULL | Material code/identifier |
| `description` | TEXT | NOT NULL | Material description |
| `documentPath` | TEXT | DEFAULT "" | Path to material documentation |

---

## File Attachments

### Job Attachments Table (`job_attachments`)

Stores file attachments linked to jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `jobId` | VARCHAR | NOT NULL, FK(jobs.id) | Reference to job |
| `fileName` | TEXT | NOT NULL | Original file name |
| `fileType` | TEXT | NOT NULL | MIME type or file extension |
| `attachmentType` | TEXT | NOT NULL, DEFAULT "upload" | Type: "upload" or "local_link" |
| `filePath` | TEXT | NULLABLE | Object storage path (for uploads) |
| `localFilePath` | TEXT | NULLABLE | Local file system path (for links) |
| `fileSize` | TEXT | NOT NULL | File size |
| `uploadedAt` | TEXT | NOT NULL | Upload timestamp |

**Attachment Types:**
- `upload` - File uploaded to object storage
- `local_link` - Reference to a file on local/network storage

---

## Time & Attendance

### Time Entries Table (`time_entries`)

Tracks employee time entries for jobs and attendance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `userId` | VARCHAR | NOT NULL, FK(users.id) | Reference to user |
| `jobId` | VARCHAR | NULLABLE, FK(jobs.id) | Reference to job (optional) |
| `clockIn` | TEXT | NOT NULL | Clock-in timestamp |
| `clockOut` | TEXT | NULLABLE | Clock-out timestamp |
| `piecesCompleted` | INTEGER | NOT NULL, DEFAULT 0 | Pieces completed during shift |
| `notes` | TEXT | NOT NULL, DEFAULT "" | Additional notes |

---

## Employee Scheduling

### Schedule Statuses
- `scheduled` - Shift is scheduled
- `confirmed` - Shift is confirmed by employee
- `cancelled` - Shift has been cancelled

### Schedules Table (`schedules`)

Stores individual employee schedule entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `userId` | VARCHAR | NOT NULL, FK(users.id) | Reference to user |
| `department` | TEXT | NULLABLE | Department assignment |
| `date` | TEXT | NOT NULL | Schedule date |
| `startTime` | TEXT | NOT NULL | Shift start time |
| `endTime` | TEXT | NOT NULL | Shift end time |
| `status` | TEXT | NOT NULL, DEFAULT "scheduled" | Schedule status |
| `notes` | TEXT | NOT NULL, DEFAULT "" | Additional notes |

### Shift Templates Table (`shift_templates`)

Defines reusable shift definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `name` | TEXT | NOT NULL | Shift template name |
| `startTime` | TEXT | NOT NULL | Default start time |
| `endTime` | TEXT | NOT NULL | Default end time |
| `description` | TEXT | NOT NULL, DEFAULT "" | Shift description |
| `color` | TEXT | NOT NULL, DEFAULT "#3b82f6" | Display color |

### Day Templates Table (`day_templates`)

Defines preset schedules for specific days of the week.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `name` | TEXT | NOT NULL | Template name |
| `dayOfWeek` | INTEGER | NOT NULL | Day of week (0=Sunday, 6=Saturday) |
| `description` | TEXT | NOT NULL, DEFAULT "" | Template description |
| `isActive` | BOOLEAN | NOT NULL, DEFAULT true | Whether template is active |

### Day Template Shifts Table (`day_template_shifts`)

Junction table linking day templates to shift templates with assignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `dayTemplateId` | VARCHAR | NOT NULL, FK(day_templates.id), ON DELETE CASCADE | Reference to day template |
| `shiftTemplateId` | VARCHAR | NOT NULL, FK(shift_templates.id) | Reference to shift template |
| `department` | TEXT | NULLABLE | Department assignment |
| `userId` | VARCHAR | NULLABLE, FK(users.id) | Assigned user |
| `notes` | TEXT | NOT NULL, DEFAULT "" | Additional notes |

---

## Workflow Status

### Workflow Statuses Table (`workflow_statuses`)

Defines available workflow/task status options.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, UUID | Unique identifier |
| `task` | TEXT | NOT NULL | Status/task name |
| `color` | TEXT | NOT NULL | Display color (hex code) |

---

## Entity Relationships

```
users
  ├── timeEntries (1:N) - user tracks time
  ├── schedules (1:N) - user has schedules
  └── dayTemplateShifts (1:N) - user assigned to shifts

jobs
  ├── designInfo (1:1) - job has design info
  ├── assemblyInfo (1:1) - job has assembly info
  ├── cleaningRoomInfo (1:1) - job has cleaning room info
  ├── moldDesignChecklistItems (1:N) - job has checklist items
  ├── jobAttachments (1:N) - job has attachments
  └── timeEntries (1:N) - job has time entries

departments
  └── positions (1:N) - department has positions
  └── departments (self-referential) - parent/child hierarchy

positions
  └── positionPermissions (1:N) - position has permissions

customPermissions
  └── positionPermissions (1:N) - permission assigned to positions

checklistTemplates
  └── checklistTemplateItems (1:N) - template has items

dayTemplates
  └── dayTemplateShifts (1:N, CASCADE DELETE) - day template has shifts

shiftTemplates
  └── dayTemplateShifts (1:N) - shift template used in day templates
```

---

## Notes

1. **UUID Generation**: All primary keys use `gen_random_uuid()` for automatic UUID generation.

2. **Soft References**: Some foreign key relationships are implemented as VARCHAR references without explicit FK constraints for flexibility.

3. **Text-based Dates/Times**: Dates and times are stored as TEXT for flexibility in formatting. Consider using proper DATE/TIMESTAMP types if strict validation is needed.

4. **Array Columns**: The `permissions` column in users table uses PostgreSQL array type (`TEXT[]`).

5. **Cascade Deletes**: Only `dayTemplateShifts` has cascade delete configured. Other related records should be handled manually before deleting parent records.

---

*Last Updated: November 2024*
