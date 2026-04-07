# On-Premises File Storage Migration Plan

## Overview

This document outlines the plan to transition the Foundry Management System's file storage from Replit Object Storage (used during development) to a self-hosted solution suitable for Southern Cast Products' on-premises deployment.

## Current Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Browser     │────▶│  Express API │────▶│ Replit Object Store  │
│  (Upload)    │     │  (Signed URL)│     │ (GCS-compatible)     │
└─────────────┘     └──────────────┘     └─────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   MongoDB   │
                    │ (reference  │
                    │  paths only)│
                    └─────────────┘
```

The key design decision: MongoDB only stores file **paths/references**, not file data. This makes switching backends straightforward.

## Recommended On-Prem Architecture: MinIO

MinIO is recommended because it's S3-compatible, meaning the existing signed-URL code pattern works with minimal changes.

### Target Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Browser     │────▶│  Express API │────▶│  MinIO Server        │
│  (Upload)    │     │  (Signed URL)│     │  (on-prem hardware)  │
└─────────────┘     └──────────────┘     └─────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   MongoDB   │
                    │ (reference  │
                    │  paths only)│
                    └─────────────┘
```

## Migration Steps

### Phase 1: Install MinIO on Foundry Server

**Hardware Requirements:**
- Minimum: Any server with available disk space (even a NAS)
- Recommended: Dedicated storage with RAID for redundancy
- Can run on the same server as MongoDB and the app, or on a separate machine

**Installation (Linux):**
```bash
# Download MinIO server
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create storage directory
sudo mkdir -p /data/minio

# Start MinIO (for testing)
MINIO_ROOT_USER=admin MINIO_ROOT_PASSWORD=changeme123 minio server /data/minio --console-address ":9001"
```

**Installation (Windows):**
- Download MinIO from https://min.io/download
- Run as a Windows service pointing to a storage directory

**Production Setup:**
- Run MinIO as a systemd service (Linux) or Windows Service
- Set strong root credentials
- Create a dedicated bucket for the foundry app (e.g., `foundry-files`)
- Configure TLS if needed (recommended for production)

### Phase 2: Create On-Prem Storage Adapter

Replace `server/objectStorage.ts` with a MinIO-compatible version:

```typescript
// server/objectStorage.ts (on-prem version)
import * as Minio from "minio";
import { randomUUID } from "crypto";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});

const BUCKET_NAME = process.env.MINIO_BUCKET || "foundry-files";

export class ObjectStorageService {
  async getUploadURL(fileName: string) {
    const objectId = randomUUID();
    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `job-attachments/${objectId}-${sanitized}`;

    const uploadURL = await minioClient.presignedPutObject(
      BUCKET_NAME, filePath, 900
    );

    return { uploadURL, filePath };
  }

  async getViewURL(filePath: string) {
    return await minioClient.presignedGetObject(
      BUCKET_NAME, filePath, 3600
    );
  }

  async deleteFile(filePath: string) {
    await minioClient.removeObject(BUCKET_NAME, filePath);
  }
}
```

### Phase 3: Environment Configuration

Add these environment variables to the on-prem deployment:

```env
MINIO_ENDPOINT=192.168.1.100    # MinIO server IP on your network
MINIO_PORT=9000
MINIO_USE_SSL=false             # Set to true if using TLS
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=foundry-files
```

### Phase 4: Data Migration

If files were uploaded during development on Replit:

1. Export files from Replit Object Storage
2. Upload them to MinIO using the MinIO CLI (`mc cp`)
3. File paths in MongoDB remain the same (they're relative paths)

For a clean start (no existing files to migrate), just deploy with the new adapter.

### Phase 5: Backup Strategy

**MinIO Backup Options:**
- `mc mirror` — sync MinIO data to a backup location
- Filesystem-level backups of the MinIO data directory
- MinIO supports replication to a second MinIO instance

**Recommended Schedule:**
- Daily incremental backups of the MinIO data directory
- Weekly full backups
- Keep 30 days of backups

## Alternative: Simple Network Share (No MinIO)

If MinIO feels like too much infrastructure, a simpler approach:

### Direct File System Storage

Replace signed URLs with direct file writes:

```typescript
// server/objectStorage.ts (file system version)
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const STORAGE_DIR = process.env.FILE_STORAGE_PATH || "/data/foundry-files";

export class ObjectStorageService {
  async uploadFile(fileName: string, buffer: Buffer) {
    const objectId = randomUUID();
    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = path.join("job-attachments", `${objectId}-${sanitized}`);
    const fullPath = path.join(STORAGE_DIR, filePath);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return { filePath };
  }

  async getFilePath(filePath: string) {
    return path.join(STORAGE_DIR, filePath);
  }

  async deleteFile(filePath: string) {
    const fullPath = path.join(STORAGE_DIR, filePath);
    await fs.unlink(fullPath);
  }
}
```

This approach requires the upload flow to change slightly (multipart form upload instead of signed URL), but is the simplest option. The storage directory can be on a network share (SMB/NFS) mapped to the server.

## Timeline Estimate

| Phase | Effort | Notes |
|---|---|---|
| Install MinIO | 1–2 hours | Download, configure, create bucket |
| Swap storage adapter | 1–2 hours | Replace objectStorage.ts, test uploads |
| Environment config | 30 minutes | Set env vars, verify connectivity |
| Data migration | Varies | Only if moving existing files |
| Backup setup | 1–2 hours | Configure automated backups |

## Decision Checklist

Before deploying on-prem, decide:

- [ ] MinIO vs. direct file system — MinIO is more flexible, file system is simpler
- [ ] Storage hardware — dedicated NAS, RAID array, or existing server disk?
- [ ] Backup frequency and retention policy
- [ ] TLS/HTTPS — is the foundry network trusted, or do files need encryption in transit?
- [ ] Access control — should all app users have the same file access, or role-based?
