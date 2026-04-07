# File Management Options — Southern Cast Products

## Current State

Photos and files attached to jobs are stored as base64-encoded strings directly in MongoDB documents. This approach has several limitations:

- **Database bloat**: A single photo can add 1–5 MB to a document. With multiple photos per section across hundreds of jobs, the database grows rapidly.
- **Slow queries**: Loading a job pulls all photo data even when only metadata is needed.
- **Backup size**: Full database backups become very large.
- **No streaming**: Files must be fully loaded into memory before serving.

## Option 1: Cloud Object Storage (Current Recommendation)

**How it works:** Files are uploaded to a cloud storage service (Replit Object Storage, AWS S3, Azure Blob, Google Cloud Storage). MongoDB stores only a reference path. Signed URLs provide secure, time-limited access to files.

**Advantages:**
- Separates file storage from data storage
- Near-unlimited scalable storage
- Built-in redundancy and durability
- Signed URLs provide secure, expiring access
- CDN integration possible for fast delivery
- Already partially implemented in this project (Replit Object Storage)

**Disadvantages:**
- Requires internet connectivity (not ideal for air-gapped environments)
- Ongoing cloud storage costs (typically low for this volume)
- Data leaves the facility

**Best for:** Development, cloud-hosted deployments, or environments with reliable internet.

## Option 2: On-Premises File Server (SMB/NFS Share)

**How it works:** Files are stored on a local network file share (Windows SMB share or Linux NFS). MongoDB stores the network path. The application server reads/writes files directly from the share.

**Advantages:**
- Data stays completely on-site
- No cloud dependency or internet required
- Uses existing IT infrastructure (NAS, file server)
- No ongoing cloud costs
- IT team has full control over storage, backups, and access
- Fast local network speeds

**Disadvantages:**
- Requires managing your own storage, backups, and redundancy
- Storage capacity limited by hardware
- No built-in CDN or signed URLs (must handle access control in the app)
- Requires the app server to have network access to the share

**Best for:** On-premises deployments, air-gapped environments, or when data must stay on-site.

## Option 3: Self-Hosted S3-Compatible Storage (MinIO)

**How it works:** MinIO is an open-source, S3-compatible object storage server you run on your own hardware. It uses the exact same API as AWS S3, so the application code works with minimal changes.

**Advantages:**
- Data stays on-site
- S3-compatible API — minimal code changes from cloud to on-prem
- Web-based management console
- Supports signed URLs, versioning, encryption
- Can run on modest hardware
- Open source and free

**Disadvantages:**
- Another service to install, configure, and maintain
- Requires dedicated storage hardware or disk space
- You handle backups, redundancy, and monitoring

**Best for:** On-premises deployments that want the flexibility of cloud-style object storage without sending data off-site. This is the recommended on-prem approach.

## Option 4: Hybrid (Cloud + On-Prem Sync)

**How it works:** Files are stored in cloud object storage during development and remote access, but automatically synced to an on-prem location for local backups and availability.

**Advantages:**
- Flexibility to access files from anywhere
- Local backup of all files
- Graceful fallback if internet goes down

**Disadvantages:**
- Most complex to implement and maintain
- Potential sync conflicts
- Requires both cloud and on-prem infrastructure

**Best for:** Organizations that need both remote access and guaranteed local availability.

## Recommendation

| Environment | Recommended Option |
|---|---|
| Development (Replit) | Cloud Object Storage (already set up) |
| On-Premises Production | MinIO (S3-compatible, self-hosted) |
| Simple On-Prem | Network File Share (SMB/NFS) |

The application is designed with a storage abstraction layer. The `ObjectStorageService` class in `server/objectStorage.ts` handles all file operations. To switch storage backends, you only need to swap or extend this class — the rest of the application (routes, frontend) remains unchanged.
