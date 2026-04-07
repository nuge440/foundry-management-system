# JobBoss Sync Script

This folder contains the Python sync script that runs **on-premise** to pull data from the JobBoss SQL Server and push it to MongoDB Atlas.

## Setup

### Prerequisites
- Python 3.8+
- Access to the JobBoss SQL Server (`SCP-SQL\JOBBOSS`)
- `pyodbc` and `pymongo` Python packages

### Install Dependencies
```bash
pip install pyodbc pymongo
```

### Environment Variable
Set `MONGO_URI` to your MongoDB Atlas connection string:
```bash
export MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority"
```

This should be the same connection string used by the dashboard's `MONGODB_URI` secret.

## Files

| File | Purpose |
|------|---------|
| `jb_sync.py` | Main sync script - run this |
| `excluded_materials.txt` | Materials to filter out (non-metals) |
| `part_type_classifications.txt` | Part type keyword rules |
| `metal_classifications.txt` | Metal category keyword rules |

## Running

```bash
# Normal incremental sync (only jobs changed since last sync)
python jb_sync.py

# Full re-sync (re-processes ALL jobs - use after first install or to populate operations)
python jb_sync.py --full

# Schedule via Task Scheduler (Windows) or cron (Linux)
# Recommended: every 5-15 minutes for near-real-time updates
```

## Key Behavior

- **Dashboard-safe**: Uses `$set` updates instead of replacing entire documents
- **Preserves dashboard data**: Never touches designInfo, assemblyInfo, cleaningInfo, etc.
- **Full routing sync**: Includes complete `operations` array from Job_Operation table
- **Incremental**: Only syncs jobs changed since last sync
- **Weekly cleanup**: Removes jobs from MongoDB that were deleted from JobBoss

## What Gets Synced

| Data | Source Table | Notes |
|------|-------------|-------|
| Job core fields | Job | Status, quantities, dates, notes, etc. |
| Materials | Material_Req + Material | First metal material per job |
| Deliveries | Delivery | Open deliveries with dates/quantities |
| Operations/Routing | Job_Operation | Full routing with work centers, status, hours |
| Flags | Derived from operations | is_expedite, requires_material_certs |
| Classifications | Derived from description/part number/material | part_type, casting_type, material_category |
