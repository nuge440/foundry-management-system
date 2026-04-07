# Foundry Management System

## Overview
This project is an enterprise foundry management system designed to track manufacturing jobs through multi-stage workflows. It provides real-time status monitoring, job information management, and workflow coordination across design, assembly, casting, and quality control processes. The system aims to streamline foundry operations, improve efficiency, and provide a clear overview of the manufacturing process, ultimately enhancing productivity and decision-making within the foundry industry.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18, TypeScript, and Vite. It leverages Radix UI primitives with shadcn/ui for accessible components, styled with Tailwind CSS and custom design tokens supporting light/dark modes and a 7-status color-coded workflow. State management includes TanStack Query for server state, React Hook Form with Zod for form validation, and Wouter for client-side routing.

### Backend
The backend is a Node.js Express.js server providing a RESTful JSON API. It uses a domain-based architecture for organizing routes, central error handling, and API call logging. The system is deployed as a single-port application serving both UI and API.

### Data Storage
The system uses **MongoDB exclusively** as its single database. All collections — users, authentication, organization hierarchy, job data, workflow statuses, time entries, schedules, checklist templates, materials, job attachments, and all other operational data — are stored in MongoDB. The `IStorage` interface in `server/storage.ts` is implemented by `MongoStorage`, which reads/writes all MongoDB collections. Collection helpers are defined in `server/mongodb.ts`. Types are pure TypeScript interfaces with Zod validation schemas in `shared/schema.ts`. There is no PostgreSQL, no Drizzle ORM, and no SQL migrations.

### JobBoss Sync System
A Python script (`jb_sync.py` v3.2) syncs data from JobBoss SQL Server to MongoDB Atlas. It features dashboard-safe updates, prioritizes dashboard-specific sub-documents, syncs full operation routing data, and includes incremental sync based on operation updates. It also uses external classification files and computes flags like `is_expedite`. An **active jobs operations refresh** runs every 4 hours to re-fetch operations for ALL active jobs, catching status changes that slip through incremental sync when `Last_Updated` timestamps don't update. Can be triggered manually with `--refresh-ops` flag.

### Department Bucketing & Task Derivation
The system categorizes jobs into 9 departments (Engineering, Core Room, Mold/Pattern, Robot/iCast, Pouring/Melt, Post-Pour/Finishing, Inspection/QC, Machining, Shipping/Complete) and assigns them to "Active" or "Waiting" buckets. Tasks are derived from conditional work center logic, and specific work centers can be skipped during derivation. Flags like `isExpedite` and `requiresCert` are computed. The dashboard displays department cards with counts, and allows inline editing for material and owner fields. A reset endpoint `/api/workflow-statuses/reset-defaults` replaces workflow statuses with R2 defaults.

### Remake (Scrap) Feature
Jobs can be flagged as "Remake" with an `isRemake` boolean, `remakeReason`, and `remakeDate`. This is managed via an API endpoint and affects dashboard styling (blue background, "REMAKE" badge).

### Job Splitting Feature
The system supports splitting jobs into multiple child parts for parallel tracking. Children are independently tracked, named `{parentJobNumber}-{index}`, and can be individually marked complete. The API provides endpoints for splitting, unsplitting, and retrieving children. Sync protects child documents as they have no JobBoss counterpart.

### NDT Specifications Management
A dedicated NDT Specifications page (`/ndt-specifications`) allows CRUD management of NDT (Non-Destructive Testing) specifications. Each spec has a code, description, and optional document path. The NDT specs are stored in the `ndt_specifications` MongoDB collection with API routes at `/api/ndt-specifications`. When a job's "Certs" field is set to "Yes" in the job edit modal, an NDT Specification dropdown appears allowing selection of a spec. The selected spec ID is saved as `ndtSpecId` on the job document via the dashboard overlay system.

### File Storage (Object Storage)
Photos and files attached to jobs are stored in Object Storage (cloud-based, S3-compatible). MongoDB stores only file path references, not raw data. The `ObjectStorageService` in `server/objectStorage.ts` handles signed upload URLs, view URLs, and file deletion. On-prem deployment can swap to MinIO (self-hosted S3-compatible) or a local network share by replacing `objectStorage.ts`. Documentation in `docs/file-management-options.md` and `docs/on-prem-file-storage-plan.md`.

### Part Thumbnails
Each job can have a part thumbnail image. Upload is done via the Job Information section of the edit modal, stored in Object Storage with `thumbnailPath` reference on the job document. The job detail page displays the thumbnail in the Job Information card. View URLs are generated on-demand from the stored file path.

### Config-Driven Job Edit Modal
A job edit modal is configured via `foundryConfig.ts`, defining sections, field types (text, number, select, textarea, date, checkbox), and behaviors. It supports nested fields, per-section media attachments, and conditional logic (e.g., auto-setting 'Inform Melt' based on pour weight, showing NDT spec dropdown when Certs is "Yes").

### BambooHR Integration
Employee and department data is synced from BambooHR into MongoDB. This includes user and department creation, mapping job titles to roles, and updating user records with department and job title information. API endpoints manage sync initiation and status.

### Change Log System
Every dashboard edit is tracked in a MongoDB `change_log` collection, storing old/new values and user attribution. The system automatically captures before/after states for updates. An SSE endpoint (`/api/change-log/stream`) provides real-time updates to connected clients.

### Authentication and Authorization
The system uses token-based and session-based authentication with bcrypt hashing. `express-session` with `connect-mongo` manages sessions. HMAC-SHA256 signed Bearer tokens are used for API authentication. Public routes are defined, and `requireAuth` middleware protects other API endpoints. A first-time login flow handles placeholder passwords for BambooHR-synced users. Role-Based Access Control (RBAC) is implemented with four roles (Admin, Manager, Designer, Operator) and permission-based page access.

## External Dependencies

**UI/UX Libraries**:
- @radix-ui/*
- shadcn/ui
- cmdk
- lucide-react

**Data Management**:
- @tanstack/react-query
- react-hook-form
- @hookform/resolvers
- date-fns

**Styling**:
- Tailwind CSS
- clsx, tailwind-merge, class-variance-authority

**Database**:
- mongodb (Node.js driver)
- connect-mongo (session store)

**Build & Development Tools**:
- Vite
- ESBuild
- TypeScript
- PostCSS, Autoprefixer
- @replit/vite-plugin-*
