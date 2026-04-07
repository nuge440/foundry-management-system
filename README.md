# Foundry Management System

An enterprise manufacturing management platform for tracking foundry jobs through multi-stage workflows. Built for Southern Cast Products to streamline operations across design, assembly, casting, and quality control processes.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [JobBoss Sync](#jobboss-sync)
- [BambooHR Integration](#bamboohr-integration)
- [API Reference](#api-reference)
- [Documentation](#documentation)

---

## Overview

The Foundry Management System provides real-time visibility into manufacturing job status across all production departments. It integrates with JobBoss ERP for job data and BambooHR for employee management, presenting a unified dashboard that tracks jobs from engineering through shipping.

Key capabilities:
- **Department-based job tracking** across 9 production departments
- **Real-time task derivation** from JobBoss routing operations
- **Inline editing** for material, owner, and other dashboard fields
- **Job splitting** for parallel work tracking
- **Change log** with real-time SSE updates
- **Role-based access control** with BambooHR-synced employees

---

## Features

### Dashboard
Jobs organized by department cards (Engineering, Core Room, Mold/Pattern, Robot/iCast, Pouring/Melt, Post-Pour/Finishing, Inspection/QC, Machining, Shipping/Complete). Each card shows active and waiting job counts. Clicking a department drills into task-level breakdowns. Expedite jobs are highlighted in red; remake jobs in blue.

### Job Management
Config-driven edit modal with 7 sections covering job information, design, assembly, pouring instructions, cleaning room, additional processes, and lessons learned. Supports text, number, select, textarea, date, and checkbox fields with nested children. JobBoss-synced fields are read-only with lock icons.

### Job Splitting
Split a job into multiple child parts for parallel tracking. Each child independently derives its task from routing operations. Children can be individually marked complete.

### Remake/Scrap Tracking
Flag jobs for remake with reason and timestamp. Visual indicators on the dashboard distinguish remake jobs from regular and expedited jobs.

### Change Log
Every edit is tracked with before/after values, user attribution, and timestamp. Real-time updates via Server-Sent Events. Filterable by job number, user, and date range.

### User Management & Organization
CRUD for users, departments, positions, and permissions. Four RBAC roles: Admin, Manager, Designer, Operator. Permission-based access to system modules.

### Time & Attendance
Employee time entry tracking and schedule management with configurable shift templates.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│   React 18 · TypeScript · Vite · Tailwind CSS    │
│   shadcn/ui · TanStack Query · Wouter            │
├─────────────────────────────────────────────────┤
│                   Backend                        │
│   Node.js · Express.js · RESTful JSON API        │
│   Domain-based route modules                     │
├─────────────────────────────────────────────────┤
│               MongoDB (Atlas)                    │
│                                                   │
│  • users              • workflow_statuses         │
│  • departments        • time_entries              │
│  • positions          • schedules                 │
│  • permissions        • checklist_templates       │
│  • sessions           • materials                 │
│  • jobs               • job_attachments           │
│  • change_log         • shift/day templates       │
│  • design_info        • pouring_instructions      │
│  • assembly_info      • nd_test_requirements      │
│  • cleaning_room_info • lessons_learned           │
└─────────────────────────────────────────────────┘
         ▲
         │
    JobBoss Sync
    (Python script)
```

**Frontend**: React 18 with TypeScript, built with Vite. Uses Radix UI primitives via shadcn/ui for accessible components. Styling with Tailwind CSS and custom design tokens. TanStack Query for server state, React Hook Form with Zod for validation, Wouter for routing.

**Backend**: Express.js server with domain-based route architecture. Single-port deployment serves both the UI and API. Centralized error handling and API call logging.

**MongoDB**: Single database for all data — users, authentication, sessions, organization hierarchy, jobs, workflow statuses, change log, time entries, schedules, checklist templates, materials, attachments, and all operational data. Accessed via the native MongoDB Node.js driver through the `MongoStorage` class.

---

## Getting Started

### Prerequisites

- Node.js 18+ (20 recommended)
- npm 9+
- MongoDB Atlas cluster (or local MongoDB 6+)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`.

### Production Build

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### First Login

On first startup with an empty MongoDB users collection, the system seeds an admin account:
- **Email**: `nugent@southerncast.com`
- **Password**: You'll be prompted to set one on first login

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Secret for signing sessions and auth tokens. Must be set — app will not start without it. |
| `MONGODB_URI` | MongoDB connection string |

### Optional

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `5000`) |
| `BAMBOOHR_API_KEY` | BambooHR API key for employee sync |
| `BAMBOOHR_COMPANY` | BambooHR company subdomain |

---

## Project Structure

```
├── client/                     # Frontend (React)
│   └── src/
│       ├── components/         # Reusable UI components
│       │   ├── ui/             # shadcn/ui primitives
│       │   ├── organization/   # Org setup components
│       │   └── scheduling/     # Scheduling components
│       ├── config/             # App configuration (foundryConfig.ts)
│       ├── contexts/           # React contexts (AuthContext)
│       ├── hooks/              # Custom hooks
│       ├── lib/                # Utilities (queryClient, utils)
│       └── pages/              # Route pages
│           ├── Dashboard.tsx
│           ├── Login.tsx
│           ├── JobInformation.tsx
│           ├── JobDetail.tsx
│           ├── ChangeLog.tsx
│           ├── UserManagement.tsx
│           ├── OrganizationSetup.tsx
│           ├── WorkflowStatus.tsx
│           ├── Materials.tsx
│           ├── TimeAttendance.tsx
│           ├── EmployeeScheduling.tsx
│           └── ... (13 more)
├── server/                     # Backend (Express)
│   ├── index.ts                # App entry, MongoDB init, session setup
│   ├── mongodb.ts              # MongoDB connection, collection helpers
│   ├── mongoStorage.ts         # Job storage, task derivation logic
│   ├── storage.ts              # IStorage interface, MongoStorage implementation
│   ├── vite.ts                 # Vite dev server integration
│   └── api/
│       ├── router.ts           # Route aggregation, auth middleware
│       ├── bamboohr.ts         # BambooHR API helper
│       └── routes/             # Domain-specific route modules
│           ├── auth.ts         # Login, logout, token auth
│           ├── mongoJobs.ts    # Job CRUD, split, remake
│           ├── users.ts        # User management
│           ├── organization.ts # Departments, positions, permissions
│           ├── bamboohr.ts     # BambooHR sync endpoint
│           ├── changeLog.ts    # Change log + SSE stream
│           ├── workflow.ts     # Workflow status management
│           └── ... (12 more)
├── shared/
│   └── schema.ts               # TypeScript interfaces, Zod schemas
├── sync/
│   └── jb_sync.py              # JobBoss SQL → MongoDB sync script
├── docs/                       # Documentation
│   ├── REQUIREMENTS.md         # Full requirements specification
│   ├── DATA_STRUCTURES.md      # Data model documentation
│   ├── ENTITY_RELATIONSHIPS.md # Entity relationship details
│   ├── field-mapping.md        # Dashboard ↔ JobBoss ↔ MongoDB field map
│   ├── department-buckets-proposal.md  # Department bucketing spec (R2)
│   └── form-fields.md          # Job edit modal field definitions
└── package.json
```

---

## Authentication

The system uses dual authentication: session-based (cookies) and token-based (Bearer).

### Flow

1. **Login** — `POST /api/auth/login` validates credentials against MongoDB. Returns a session cookie and a signed auth token.
2. **First-time users** — BambooHR-synced users have placeholder passwords. On first login, they're prompted to set a password.
3. **Token auth** — HMAC-SHA256 signed tokens stored in localStorage. Sent as `Authorization: Bearer <token>` on every request.
4. **Session auth** — `express-session` with `connect-mongo` stores sessions in MongoDB. Cookies are HttpOnly, Secure, SameSite=None.

### Roles & Permissions

| Role | Access Level |
|---|---|
| Admin | Full access to all modules |
| Manager | Access to most modules |
| Designer | Access to design-related modules |
| Operator | Limited access to operational modules |

Permissions control access to: Dashboard, Job Information, Design Information, Assembly Information, Cleaning Room Info, Checklist Design, Workflow Status, User Management, Materials, Time & Attendance, Employee Scheduling.

The Dashboard is always publicly accessible without authentication.

---

## JobBoss Sync

The Python sync script (`sync/jb_sync.py`) runs on-premise and syncs job data from JobBoss SQL Server to MongoDB Atlas.

### Key Design Decisions

- **Dashboard-safe updates**: Uses `$set` (not `ReplaceOne`) to preserve user-edited fields.
- **Dashboard sub-document**: User edits stored in `dashboard.*` sub-document which always takes precedence over synced values.
- **Operation routing**: Full `Job_Operation` array synced per job, enabling task derivation.
- **Incremental sync**: Checks both `Job.Last_Updated` and `Job_Operation.Last_Updated` for changes.
- **Split child protection**: Sync skips documents where `isSplitChild: true`.
- **Expedite flag**: Computed from EXPEDITE work center presence in routing.

### Running the Sync

```bash
cd sync

# Incremental sync (only changed jobs)
python jb_sync.py

# Full sync (all jobs)
python jb_sync.py --full
```

---

## BambooHR Integration

Employee data syncs from BambooHR into MongoDB:

- **Endpoint**: `POST /api/bamboohr/sync`
- **What syncs**: Employee names, emails, departments, job titles
- **Role mapping**: Job titles and departments mapped to system roles
- **Password**: New users get placeholder passwords and must set their own on first login

Requires `BAMBOOHR_API_KEY` and `BAMBOOHR_COMPANY` environment variables.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/set-password` | First-time password setup |
| `POST` | `/api/auth/logout` | End session |
| `GET` | `/api/auth/me` | Get current user |

### Jobs (MongoDB)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/mongo/jobs` | List all jobs |
| `GET` | `/api/mongo/jobs/:id` | Get single job |
| `PATCH` | `/api/mongo/jobs/:id` | Update job fields |
| `POST` | `/api/mongo/jobs/:id/split` | Split job into children |
| `POST` | `/api/mongo/jobs/:jobNumber/unsplit` | Remove split children |
| `GET` | `/api/mongo/jobs/:jobNumber/children` | Get split children |
| `POST` | `/api/mongo/jobs/:id/toggle-remake` | Toggle remake flag |

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Create user |
| `PATCH` | `/api/users/:id` | Update user |
| `DELETE` | `/api/users/:id` | Delete user |

### Organization

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/departments` | List departments |
| `POST` | `/api/departments` | Create department |
| `GET` | `/api/positions` | List positions |
| `POST` | `/api/positions` | Create position |
| `GET` | `/api/custom-permissions` | List permissions |

### Change Log

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/change-log` | List changes (paginated, filterable) |
| `GET` | `/api/change-log/job/:jobNumber` | Changes for a specific job |
| `GET` | `/api/change-log/stream` | SSE stream of real-time changes |

### Other

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workflow-statuses` | List workflow statuses |
| `POST` | `/api/workflow-statuses/reset-defaults` | Reset to R2 defaults |
| `GET` | `/api/workflow-departments` | Get department order |
| `POST` | `/api/bamboohr/sync` | Sync employees from BambooHR |
| `GET` | `/api/bamboohr/status` | BambooHR sync status |
| `GET` | `/api/database/active` | Current active database |

---

## Documentation

Additional documentation in the `docs/` directory:

| File | Description |
|---|---|
| `REQUIREMENTS.md` | Full functional and non-functional requirements |
| `DATA_STRUCTURES.md` | Complete data model documentation |
| `ENTITY_RELATIONSHIPS.md` | Entity relationships and foreign keys |
| `field-mapping.md` | Field mapping between Dashboard, JobBoss SQL, and MongoDB |
| `department-buckets-proposal.md` | Department bucketing and task derivation specification (R2) |
| `form-fields.md` | Job edit modal field definitions and configuration |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (frontend + backend on port 5000) |
| `npm run build` | Build frontend (Vite) and backend (esbuild) for production |
| `npm start` | Run production server from `dist/` |
| `npm run check` | TypeScript type checking |
