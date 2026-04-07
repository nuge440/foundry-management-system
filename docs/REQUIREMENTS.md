# Foundry Management System — Requirements

## Environment Requirements

| Requirement | Version / Details |
|---|---|
| Node.js | v18+ (v20 recommended) |
| npm | v9+ |
| MongoDB | Atlas cluster (or local v6+) |
| Python | 3.9+ (for JobBoss sync script only) |

## Environment Variables

The following environment variables must be set for the application to run:

### Required

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Secret key for signing sessions and auth tokens. Must be a long, random string. The app will refuse to start without it. |
| `MONGODB_URI` | MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/`) |

### Optional

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server listen port | `5000` |
| `BAMBOOHR_API_KEY` | BambooHR API key for employee sync | — |
| `BAMBOOHR_COMPANY` | BambooHR subdomain (e.g., `southerncast`) | — |

### Sync Script (Python)

| Variable | Description |
|---|---|
| `JOBBOSS_SERVER` | SQL Server host for JobBoss |
| `JOBBOSS_DATABASE` | JobBoss database name |
| `JOBBOSS_USER` | SQL Server login |
| `JOBBOSS_PASSWORD` | SQL Server password |
| `MONGODB_URI` | Same MongoDB URI as the web app |

---

## Feature Requirements

### FR-01: Dashboard

- Display all active jobs organized by department cards with active/waiting counts.
- Clicking a department card drills into task-level metric boxes.
- Jobs shown in a sortable, filterable table with color-coded status.
- Expedite jobs displayed bold with red background.
- Remake jobs displayed with blue background and "REMAKE" badge.
- Material and Owner columns are inline-editable directly in the table.
- Split children replace their parent row and sort by index.

### FR-02: Job Information Management

- Config-driven edit modal with 7 sections: Job Info, Design, Assembly, Pouring, Cleaning Room, Additional Processes, Lessons Learned.
- Field types: text, number, select, textarea, date, checkbox with nested children.
- JobBoss-synced fields shown read-only with lock icons.
- Per-section file and photo/video attachments.
- Nested field paths stored as sub-documents in MongoDB.
- Pour weight > 1500 lbs auto-sets "Inform Melt" to Yes.

### FR-03: Department Bucketing & Task Derivation

- 9 departments: Engineering, Core Room, Mold/Pattern, Robot/iCast, Pouring/Melt, Post-Pour/Finishing, Inspection/QC, Machining, Shipping/Complete.
- Task derived from JobBoss routing operations via `deriveTaskFromOperations()`.
- Started operation → Active bucket; first Open operation → Waiting bucket.
- Conditional work center logic for ICAST, CORE-VOX, ICAST-ASSY, CLEAN.
- Skipped work centers: ENG-INSP, CERT, ICAST REW, EXPEDITE.
- Job Status "Hold" → "On Hold" task in Engineering.

### FR-04: Job Splitting

- Split a job into N child parts for parallel tracking.
- Children named `{parentJobNumber}-{index}` (e.g., 35521-1, 35521-2).
- Each child derives its task independently from parent operations using Act_Run_Qty.
- Children can be individually marked complete.
- Unsplit deletes all children and restores the parent row.

### FR-05: Remake (Scrap) Tracking

- Toggle a job as "Remake" with reason and date.
- Dashboard styling: blue background, blue left border, "REMAKE" badge.
- Expedite styling takes precedence over Remake styling.

### FR-06: JobBoss SQL Sync

- Python sync script pulls from SQL Server and pushes to MongoDB Atlas.
- Dashboard-safe `$set` updates preserve user-edited fields.
- Dashboard sub-document (`dashboard.*`) always wins over synced values.
- Full `Job_Operation` routing array synced per job.
- Operation-aware incremental sync (checks `Job_Operation.Last_Updated`).
- Split children are skipped during sync.
- `is_expedite` flag computed from EXPEDITE work center presence.

### FR-07: BambooHR Integration

- Sync employee directory from BambooHR into MongoDB users collection.
- Auto-create departments from BambooHR data.
- Map job titles and departments to roles (Admin, Manager, Designer, Operator).
- Store department and jobTitle on user records.
- Synced users get placeholder passwords and must set their own on first login.

### FR-08: Authentication & Authorization

- Session-based auth with `connect-mongo` session store in MongoDB.
- Token-based auth with HMAC-SHA256 signed Bearer tokens.
- Bcrypt password hashing (salt rounds: 10).
- First-time login flow: placeholder password triggers "Set Your Password" screen.
- Four RBAC roles: Admin, Manager, Designer, Operator.
- Permission-based access to 9 system modules.
- Dashboard is publicly accessible without authentication.
- Admin user auto-seeded on first startup if no users exist.

### FR-09: Change Log

- Every dashboard edit logged with old/new values, user attribution, timestamp.
- Server-Sent Events (SSE) endpoint for real-time change notifications.
- Filterable by job number, user, date range.
- Source badges: dashboard, sync, system.

### FR-10: User Management

- CRUD operations for user accounts.
- Role assignment and permission management.
- Department and job title tracking.

### FR-11: Organization Setup

- Department management (create, edit, delete).
- Position management with department association.
- Custom permissions and position-permission mappings.

### FR-12: Workflow Status Configuration

- Define task labels, colors, sort orders, and department assignments.
- Reset to R2 default statuses via endpoint.

### FR-13: Time & Attendance

- Time entry tracking for employees.
- Schedule management with shift templates.
- Day template system for recurring schedules.

### FR-14: Materials Management

- Track materials linked to jobs.
- Material data accessible via API.

### FR-15: Checklist System

- Configurable checklist templates.
- Mold design checklist items.

---

## Non-Functional Requirements

### NFR-01: Performance

- API responses under 500ms for standard queries.
- Dashboard loads all active jobs in a single request.
- MongoDB indexes on frequently queried fields (jobNumber, status, department).

### NFR-02: Security

- `SESSION_SECRET` required at startup (no fallback).
- Passwords hashed with bcrypt before storage.
- Auth tokens expire after 7 days.
- Sessions expire after 7 days.
- HttpOnly, Secure, SameSite=None cookies.
- Server-side user attribution for change log (never from request body).

### NFR-03: Data Integrity

- Dashboard edits stored in `dashboard.*` sub-document, never overwritten by sync.
- Change log captures before/after state for every mutation.
- Split children protected from sync overwrite.

### NFR-04: Availability

- Single-port deployment serves both frontend and API.
- MongoDB Atlas provides cloud-hosted database availability.
- Dev and production share the same MongoDB instance for data consistency.

### NFR-05: Accessibility

- WCAG-compliant UI components via Radix UI primitives.
- Color-coded statuses supplemented with text labels.
- Light and dark mode support.
