# -*- coding: utf-8 -*-
"""
================================================================================
JobBOSS to MongoDB Atlas - Production Sync System (Enhanced for Dashboard)
================================================================================

OVERVIEW:
    Syncs job data from on-premise JobBOSS SQL Server to MongoDB Atlas cloud
    database. Supports incremental updates, change tracking, automatic
    cleanup of deleted jobs, and full routing/operations sync.

VERSION:
    3.2 - March 2026
    - Added active jobs operations refresh: re-fetches operations from JobBoss
      for ALL active jobs every 4 hours, catching status changes that slip
      through incremental sync when Last_Updated timestamps don't update
    - Can be triggered with --refresh-ops flag
    
    3.1 - February 2026
    - Incremental sync now detects Job_Operation changes (work center status
      updates like Started -> Complete) that don't update Job.Last_Updated
    - Jobs with only operation-level changes are included in incremental sync
    
    3.0 - February 2026
    - CRITICAL: Uses $set instead of ReplaceOne to preserve dashboard fields
    - Added full Job_Operation routing sync (operations array)
    - Added Customer_PO, Sched_Start, Sched_End, Released_Date, Priority
    - Added Completed_Quantity, In_Production_Quantity
    - Dashboard sub-document (designInfo, assemblyInfo, etc.) is never touched
    - Hybrid fields written to top-level only; dashboard.* overrides preserved

DASHBOARD-SAFE SYNC RULES:
    This script ONLY writes JB-owned fields using $set operations.
    It NEVER touches these dashboard-owned fields/sub-documents:
      - dashboard.*  (all override fields)
      - designInfo, assemblyInfo, cleaningInfo
      - pouringInstructions, ndTestRequirements, lessonsLearned
      - sandMoldSize, pourWeight, customChills, coresOrdered
      - heatTreat, informMelt, assemblyCode, estAssemblyTime, modelApproved
    
    It NEVER touches split child documents (isSplitChild=true).
    These are dashboard-only records created by the split feature.

================================================================================
FILE STRUCTURE & DEPENDENCIES:
================================================================================

REQUIRED FILES:
    1. This script (main sync script)
    2. excluded_materials.txt - List of non-metal materials to filter out
    3. part_type_classifications.txt - Part type classification rules
       Format: PART_TYPE | keyword1, keyword2, keyword3
    4. metal_classifications.txt - Metal category classification rules
       Format: CATEGORY | keyword1, keyword2, keyword3

PYTHON DEPENDENCIES:
    - pyodbc: SQL Server connection
    - pymongo: MongoDB connection
    - Standard library: logging, os, datetime, pathlib

================================================================================
CONFIGURATION:
================================================================================

ENVIRONMENT VARIABLES (REQUIRED):
    MONGO_URI - MongoDB Atlas connection string
    (Same connection string as MONGODB_URI used by the dashboard)

SQL SERVER CONNECTION:
    Server: SCP-SQL\\JOBBOSS
    Database: ProductionSQL

MONGODB STRUCTURE:
    Database: JobBoss
    Collections:
        - jobs: Main job data with classifications and operations
        - sync_metadata: Sync timestamps

================================================================================
"""

import pyodbc
import logging
import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient, UpdateOne
from pymongo.errors import ServerSelectionTimeoutError
from pathlib import Path

# ----------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------
DB_CONFIG = {
    'DRIVER': 'SQL Server',
    'SERVER': r'SCP-SQL\JOBBOSS',
    'DATABASE': 'ProductionSQL',
    'UID': 'Support',
    'PWD': 'lonestar'
}

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DATABASE = 'JobBoss'
MONGO_COLLECTION = 'jobs'
MONGO_METADATA_COLLECTION = 'sync_metadata'

EXCLUSION_FILE = Path(__file__).parent / 'excluded_materials.txt'
CLASSIFICATION_FILE = Path(__file__).parent / 'part_type_classifications.txt'
METAL_CLASSIFICATION_FILE = Path(__file__).parent / 'metal_classifications.txt'

TRACKED_FIELDS = [
    'Status', 'Make_Quantity', 'Order_Quantity', 'Material',
    'Material_Description', 'Notes', 'Remaining_Quantity', 'Shipped_Quantity',
    'Completed_Quantity', 'In_Production_Quantity',
    'is_expedite', 'requires_material_certs', 'Quote', 'Sales_Code',
    'part_type', 'casting_type', 'material_category', 'Unit_Price',
    'Customer_PO', 'Priority'
]

JB_OWNED_FIELDS = [
    'Job', 'Customer', 'Part_Number', 'Description',
    'part_type', 'casting_type', 'material_category',
    'Material', 'Material_Description',
    'Order_Quantity', 'Make_Quantity', 'Shipped_Quantity',
    'Remaining_Quantity', 'Completed_Quantity', 'In_Production_Quantity',
    'Unit_Price',
    'Order_Date', 'Last_Updated', 'Sched_Start', 'Sched_End', 'Released_Date',
    'Status', 'Type', 'Priority',
    'is_expedite', 'requires_material_certs',
    'Quote', 'Sales_Code', 'Customer_PO', 'Notes',
    'Deliveries', 'operations',
    'synced_at', 'change_history'
]

DASHBOARD_PROTECTED_FIELDS = [
    'dashboard',
    'designInfo', 'assemblyInfo', 'cleaningInfo',
    'pouringInstructions', 'ndTestRequirements', 'lessonsLearned',
    'sandMoldSize', 'pourWeight', 'customChills', 'coresOrdered',
    'heatTreat', 'informMelt', 'assemblyCode', 'estAssemblyTime',
    'modelApproved', 'moldSize'
]

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
log = logging.getLogger(__name__)

# ----------------------------------------------------------------------
# LOAD EXCLUSION LIST FROM FILE
# ----------------------------------------------------------------------
def load_excluded_materials():
    excluded = set()
    if not EXCLUSION_FILE.exists():
        log.warning(f"Exclusion file not found: {EXCLUSION_FILE}")
        return excluded
    try:
        with open(EXCLUSION_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                excluded.add(line)
        log.info(f"Loaded {len(excluded)} materials to exclude from {EXCLUSION_FILE.name}")
        return excluded
    except Exception as e:
        log.error(f"Error reading exclusion file: {e}")
        return set()

# ----------------------------------------------------------------------
# LOAD PART TYPE CLASSIFICATIONS FROM FILE
# ----------------------------------------------------------------------
def load_part_type_classifications():
    classifications = []
    if not CLASSIFICATION_FILE.exists():
        log.warning(f"Classification file not found: {CLASSIFICATION_FILE}")
        return [('OTHER', [])]
    try:
        with open(CLASSIFICATION_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '|' not in line:
                    continue
                parts = line.split('|', 1)
                part_type = parts[0].strip()
                keywords_str = parts[1].strip() if len(parts) > 1 else ''
                if keywords_str:
                    keywords = [kw.strip().upper() for kw in keywords_str.split(',') if kw.strip()]
                else:
                    keywords = []
                classifications.append((part_type, keywords))
        log.info(f"Loaded {len(classifications)} part type classifications from {CLASSIFICATION_FILE.name}")
        return classifications
    except Exception as e:
        log.error(f"Error reading classification file: {e}")
        return [('OTHER', [])]

# ----------------------------------------------------------------------
# LOAD METAL CLASSIFICATIONS FROM FILE
# ----------------------------------------------------------------------
def load_metal_classifications():
    classifications = []
    if not METAL_CLASSIFICATION_FILE.exists():
        log.warning(f"Metal classification file not found: {METAL_CLASSIFICATION_FILE}")
        return [('Unknown', [])]
    try:
        with open(METAL_CLASSIFICATION_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '|' not in line:
                    continue
                parts = line.split('|', 1)
                category = parts[0].strip()
                keywords_str = parts[1].strip() if len(parts) > 1 else ''
                if keywords_str:
                    keywords = [kw.strip().upper() for kw in keywords_str.split(',') if kw.strip()]
                else:
                    keywords = []
                classifications.append((category, keywords))
        log.info(f"Loaded {len(classifications)} metal classifications from {METAL_CLASSIFICATION_FILE.name}")
        return classifications
    except Exception as e:
        log.error(f"Error reading metal classification file: {e}")
        return [('Unknown', [])]

EXCLUDED_MATERIALS = load_excluded_materials()
PART_TYPE_CLASSIFICATIONS = load_part_type_classifications()
METAL_CLASSIFICATIONS = load_metal_classifications()

# ----------------------------------------------------------------------
# DB CONNECTIONS
# ----------------------------------------------------------------------
def get_sql_conn():
    try:
        conn_str = ';'.join(
            f"{k}={{{v}}}" if k == 'DRIVER' else f"{k}={v}"
            for k, v in DB_CONFIG.items()
        )
        conn = pyodbc.connect(conn_str)
        log.info("Connected to JobBOSS SQL Server")
        return conn
    except Exception as e:
        log.error(f"SQL connection error: {e}")
        return None

def get_mongo_client():
    if not MONGO_URI:
        log.error("MONGO_URI environment variable not set")
        return None
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        log.info("Connected to MongoDB Atlas")
        return client
    except ServerSelectionTimeoutError:
        log.error("MongoDB connection timeout")
        return None
    except Exception as e:
        log.error(f"MongoDB connection error: {e}")
        return None

# ----------------------------------------------------------------------
# GET / UPDATE LAST SYNC TIMESTAMP
# ----------------------------------------------------------------------
def get_last_sync_time(mongo_client):
    try:
        db = mongo_client[MONGO_DATABASE]
        metadata_coll = db[MONGO_METADATA_COLLECTION]
        sync_doc = metadata_coll.find_one({'_id': 'last_sync'})
        if sync_doc and 'timestamp' in sync_doc:
            last_sync = sync_doc['timestamp']
            log.info(f"Last sync was: {last_sync}")
            return last_sync
        else:
            one_year_ago = datetime.now() - timedelta(days=365)
            log.info(f"First sync - loading jobs from last year: {one_year_ago}")
            return one_year_ago
    except Exception as e:
        log.error(f"Error getting last sync time: {e}")
        return datetime.now() - timedelta(days=365)

def update_last_sync_time(mongo_client, timestamp):
    try:
        db = mongo_client[MONGO_DATABASE]
        metadata_coll = db[MONGO_METADATA_COLLECTION]
        metadata_coll.update_one(
            {'_id': 'last_sync'},
            {'$set': {'timestamp': timestamp, 'updated_at': datetime.utcnow()}},
            upsert=True
        )
        log.info(f"Updated last sync timestamp to: {timestamp}")
    except Exception as e:
        log.error(f"Error updating last sync time: {e}")

# ----------------------------------------------------------------------
# CLASSIFICATION FUNCTIONS
# ----------------------------------------------------------------------
def classify_part_type(description):
    if not description:
        return 'OTHER'
    desc = description.upper()
    for part_type, keywords in PART_TYPE_CLASSIFICATIONS:
        if not keywords:
            return part_type
        for keyword in keywords:
            if keyword in desc:
                return part_type
    return 'OTHER'

def classify_casting_type(part_number):
    if not part_number:
        return 'STANDARD'
    part = part_number.upper()
    if 'ROBOCAST' in part or 'ROBO CAST' in part:
        return 'ROBOCAST'
    elif 'PATTERNCAST' in part or 'PATTERN CAST' in part:
        return 'PATTERNCAST'
    elif any(x in part for x in ['TEST BAR', 'Y BAR', 'C BAR', 'B BAR']):
        return 'TEST_BAR'
    else:
        return 'STANDARD'

def classify_material_category(material):
    if not material:
        return 'Unknown'
    mat = material.upper()
    for category, keywords in METAL_CLASSIFICATIONS:
        if not keywords:
            return category
        for keyword in keywords:
            if keyword in mat:
                return category
    return 'Other_Metal'

# ----------------------------------------------------------------------
# BATCH HELPER - SQL Server limits ~2100 params per query
# ----------------------------------------------------------------------
BATCH_SIZE = 2000

def batched(iterable, n):
    """Split a list into chunks of size n."""
    for i in range(0, len(iterable), n):
        yield iterable[i:i + n]

# ----------------------------------------------------------------------
# FETCH FULL ROUTING / OPERATIONS FROM Job_Operation
# ----------------------------------------------------------------------
def fetch_operations_for_jobs(job_list):
    """Fetch complete Job_Operation routing data for given jobs.
    Returns dict: { job_number: [ { Sequence, Work_Center, Status, ... }, ... ] }
    """
    if not job_list:
        return {}

    ops_dict = {}
    for batch in batched(job_list, BATCH_SIZE):
        conn = get_sql_conn()
        if not conn:
            continue

        placeholders = ','.join(['?' for _ in batch])
        sql = f"""
        SELECT
            jo.Job,
            jo.Sequence,
            jo.Work_Center,
            jo.Status,
            jo.Description AS Op_Description,
            jo.Est_Total_Hrs,
            jo.Act_Run_Hrs,
            jo.Act_Setup_Hrs,
            jo.Act_Run_Qty,
            jo.Inside_Oper,
            jo.Vendor
        FROM Job_Operation jo
        WHERE jo.Job IN ({placeholders})
        ORDER BY jo.Job, jo.Sequence
        """

        try:
            cursor = conn.cursor()
            cursor.execute(sql, batch)

            for row in cursor.fetchall():
                job = row[0]
                if job not in ops_dict:
                    ops_dict[job] = []

                ops_dict[job].append({
                    'Sequence': row[1],
                    'Work_Center': (row[2] or '').strip(),
                    'Status': (row[3] or '').strip(),
                    'Description': row[4],
                    'Est_Total_Hrs': float(row[5]) if row[5] else 0,
                    'Act_Run_Hrs': float(row[6]) if row[6] else 0,
                    'Act_Setup_Hrs': float(row[7]) if row[7] else 0,
                    'Act_Run_Qty': row[8],
                    'Inside_Oper': row[9],
                    'Vendor': (row[10] or '').strip() if row[10] else None
                })

            conn.close()
        except Exception as e:
            log.error(f"Operations query failed for batch: {e}")
            conn.close()

    log.info(f"Fetched operations for {len(ops_dict)} jobs ({sum(len(v) for v in ops_dict.values())} total ops)")
    return ops_dict

# ----------------------------------------------------------------------
# DERIVE FLAGS FROM OPERATIONS (replaces separate routing flags query)
# ----------------------------------------------------------------------
def derive_flags_from_operations(operations):
    """Derive is_expedite and requires_material_certs from operations array"""
    flags = {
        'is_expedite': False,
        'requires_material_certs': False
    }
    if not operations:
        return flags

    for op in operations:
        wc = op.get('Work_Center', '')
        if wc == 'EXPEDITE':
            flags['is_expedite'] = True
        elif wc == 'CERT':
            flags['requires_material_certs'] = True

    return flags

# ----------------------------------------------------------------------
# FETCH MATERIALS FOR JOBS (FIRST METAL ONLY)
# ----------------------------------------------------------------------
def fetch_materials_for_jobs(job_list):
    if not job_list:
        return {}
    materials_dict = {}
    filtered_count = 0
    for batch in batched(job_list, BATCH_SIZE):
        conn = get_sql_conn()
        if not conn:
            continue
        placeholders = ','.join(['?' for _ in batch])
        sql = f"""
        SELECT
            mr.Job,
            mr.Material,
            m.Description AS Material_Description
        FROM Material_Req mr
        LEFT JOIN Material m ON mr.Material = m.Material
        WHERE mr.Job IN ({placeholders})
        ORDER BY mr.Job, mr.Material_Req
        """
        try:
            cursor = conn.cursor()
            cursor.execute(sql, batch)
            for job, material, description in cursor.fetchall():
                if job in materials_dict:
                    continue
                if material and material.strip() not in EXCLUDED_MATERIALS:
                    materials_dict[job] = {
                        'Material': material,
                        'Material_Description': description if description else ''
                    }
                else:
                    filtered_count += 1
            conn.close()
        except Exception as e:
            log.error(f"Materials query failed for batch: {e}")
            conn.close()
    log.info(f"Fetched materials for {len(materials_dict)} jobs (filtered out {filtered_count} non-metals)")
    return materials_dict

# ----------------------------------------------------------------------
# FETCH OPEN DELIVERIES FOR JOBS
# ----------------------------------------------------------------------
def fetch_deliveries_for_jobs(job_list):
    if not job_list:
        return {}
    deliveries_dict = {}
    for batch in batched(job_list, BATCH_SIZE):
        conn = get_sql_conn()
        if not conn:
            continue
        placeholders = ','.join(['?' for _ in batch])
        sql = f"""
        SELECT
            d.Job,
            d.Delivery,
            d.Promised_Date,
            d.Promised_Quantity,
            d.Shipped_Quantity,
            d.Remaining_Quantity,
            d.Requested_Date
        FROM Delivery d
        WHERE d.Job IN ({placeholders})
            AND d.Remaining_Quantity > 0
        ORDER BY d.Job, d.Promised_Date
        """
        try:
            cursor = conn.cursor()
            cursor.execute(sql, batch)
            for job, delivery, promised_date, promised_qty, shipped_qty, remaining_qty, requested_date in cursor.fetchall():
                if job not in deliveries_dict:
                    deliveries_dict[job] = []
                deliveries_dict[job].append({
                    'Delivery': delivery,
                    'Promised_Date': promised_date.isoformat() if promised_date else None,
                    'Requested_Date': requested_date.isoformat() if requested_date else None,
                    'Promised_Quantity': promised_qty,
                    'Shipped_Quantity': shipped_qty,
                    'Remaining_Quantity': remaining_qty
                })
            conn.close()
        except Exception as e:
            log.error(f"Deliveries query failed for batch: {e}")
            conn.close()
    log.info(f"Fetched deliveries for {len(deliveries_dict)} jobs")
    return deliveries_dict

# ----------------------------------------------------------------------
# FETCH JOBS WITH RECENTLY CHANGED OPERATIONS
# ----------------------------------------------------------------------
def fetch_jobs_with_changed_operations(last_sync_time):
    """Find job numbers where Job_Operation records changed since last sync.
    This catches work center status changes (e.g., Started -> Complete)
    that don't update the parent Job.Last_Updated field.
    """
    conn = get_sql_conn()
    if not conn:
        return set()

    sql = """
    SELECT DISTINCT jo.Job
    FROM Job_Operation jo
    WHERE jo.Last_Updated >= ?
    """

    try:
        cursor = conn.cursor()
        cursor.execute(sql, last_sync_time)
        jobs = set(row[0] for row in cursor.fetchall())
        conn.close()
        if jobs:
            log.info(f"Found {len(jobs)} jobs with operation changes since {last_sync_time}")
        return jobs
    except Exception as e:
        log.warning(f"Could not query Job_Operation.Last_Updated (column may not exist): {e}")
        if conn:
            conn.close()
        return set()

# ----------------------------------------------------------------------
# FETCH JOBS (INITIAL OR INCREMENTAL) - ALL STATUSES
# ----------------------------------------------------------------------
def fetch_jobs(last_sync_time):
    """Fetch jobs from JobBOSS that have been updated since last_sync_time.
    Also includes jobs where operations changed (work center status updates)."""
    conn = get_sql_conn()
    if not conn:
        return []

    ops_changed_jobs = fetch_jobs_with_changed_operations(last_sync_time)

    sql = """
    SELECT
        j.Job,
        j.Customer,
        j.Part_Number,
        j.Description,
        j.Order_Date,
        j.Make_Quantity,
        j.Order_Quantity,
        j.Last_Updated,
        j.Status,
        j.Type,
        j.Order_Quantity - j.Shipped_Quantity AS Remaining_Quantity,
        j.Shipped_Quantity,
        j.Completed_Quantity,
        j.In_Production_Quantity,
        j.Note_Text AS Notes,
        j.Quote,
        j.Sales_Code,
        j.Unit_Price,
        j.Customer_PO,
        j.Sched_Start,
        j.Sched_End,
        j.Released_Date,
        j.Priority
    FROM Job j
    WHERE j.Last_Updated >= ?
    ORDER BY j.Last_Updated DESC
    """

    try:
        cursor = conn.cursor()
        cursor.execute(sql, last_sync_time)
        rows = cursor.fetchall()
        cols = [c[0] for c in cursor.description]

        jobs = []
        job_list = []

        for row in rows:
            job_dict = dict(zip(cols, row))
            job_list.append(job_dict['Job'])

            for date_field in ['Order_Date', 'Last_Updated', 'Sched_Start', 'Sched_End', 'Released_Date']:
                if job_dict.get(date_field):
                    job_dict[date_field] = job_dict[date_field].isoformat()

            job_dict['synced_at'] = datetime.now().isoformat()
            jobs.append(job_dict)

        already_fetched = set(job_list)
        ops_only_jobs = ops_changed_jobs - already_fetched
        if ops_only_jobs:
            log.info(f"Fetching {len(ops_only_jobs)} additional jobs with operation-only changes")
            for batch in batched(list(ops_only_jobs), BATCH_SIZE):
                placeholders = ','.join(['?' for _ in batch])
                ops_sql = f"""
                SELECT
                    j.Job, j.Customer, j.Part_Number, j.Description,
                    j.Order_Date, j.Make_Quantity, j.Order_Quantity,
                    j.Last_Updated, j.Status, j.Type,
                    j.Order_Quantity - j.Shipped_Quantity AS Remaining_Quantity,
                    j.Shipped_Quantity, j.Completed_Quantity, j.In_Production_Quantity,
                    j.Note_Text AS Notes, j.Quote, j.Sales_Code, j.Unit_Price,
                    j.Customer_PO, j.Sched_Start, j.Sched_End, j.Released_Date, j.Priority
                FROM Job j
                WHERE j.Job IN ({placeholders})
                """
                cursor.execute(ops_sql, batch)
                extra_rows = cursor.fetchall()
                for row in extra_rows:
                    job_dict = dict(zip(cols, row))
                    job_list.append(job_dict['Job'])
                    for date_field in ['Order_Date', 'Last_Updated', 'Sched_Start', 'Sched_End', 'Released_Date']:
                        if job_dict.get(date_field):
                            job_dict[date_field] = job_dict[date_field].isoformat()
                    job_dict['synced_at'] = datetime.now().isoformat()
                    jobs.append(job_dict)

        conn.close()

        if jobs:
            materials_dict = fetch_materials_for_jobs(job_list)
            deliveries_dict = fetch_deliveries_for_jobs(job_list)
            operations_dict = fetch_operations_for_jobs(job_list)

            ordered_jobs = []
            for job in jobs:
                job_number = job['Job']

                material_data = materials_dict.get(job_number, {})
                material = material_data.get('Material', None)

                operations = operations_dict.get(job_number, [])
                flags = derive_flags_from_operations(operations)

                ordered_job = {
                    'Job': job_number,
                    'Customer': job.get('Customer'),
                    'Part_Number': job.get('Part_Number'),
                    'Description': job.get('Description'),

                    'part_type': classify_part_type(job.get('Description')),
                    'casting_type': classify_casting_type(job.get('Part_Number')),
                    'material_category': classify_material_category(material),

                    'Material': material,
                    'Material_Description': material_data.get('Material_Description', None),

                    'Order_Quantity': job.get('Order_Quantity'),
                    'Make_Quantity': job.get('Make_Quantity'),
                    'Shipped_Quantity': job.get('Shipped_Quantity'),
                    'Remaining_Quantity': job.get('Remaining_Quantity'),
                    'Completed_Quantity': job.get('Completed_Quantity'),
                    'In_Production_Quantity': job.get('In_Production_Quantity'),

                    'Unit_Price': job.get('Unit_Price'),

                    'Order_Date': job.get('Order_Date'),
                    'Last_Updated': job.get('Last_Updated'),
                    'Sched_Start': job.get('Sched_Start'),
                    'Sched_End': job.get('Sched_End'),
                    'Released_Date': job.get('Released_Date'),

                    'Status': job.get('Status'),
                    'Type': job.get('Type'),
                    'Priority': job.get('Priority'),

                    'is_expedite': flags.get('is_expedite', False),
                    'requires_material_certs': flags.get('requires_material_certs', False),

                    'Quote': job.get('Quote'),
                    'Sales_Code': job.get('Sales_Code'),
                    'Customer_PO': job.get('Customer_PO'),
                    'Notes': job.get('Notes'),

                    'Deliveries': deliveries_dict.get(job_number, []),
                    'operations': operations,

                    'synced_at': job.get('synced_at')
                }

                ordered_jobs.append(ordered_job)

            jobs = ordered_jobs

        log.info(f"Fetched {len(jobs)} jobs updated since {last_sync_time}")
        return jobs

    except Exception as e:
        log.error(f"Query failed: {e}")
        if conn:
            conn.close()
        return []

# ----------------------------------------------------------------------
# TRACK CHANGES
# ----------------------------------------------------------------------
def build_change_history(old_doc, new_doc):
    changes = []
    timestamp = datetime.now().isoformat()
    if not old_doc:
        return []
    for field in TRACKED_FIELDS:
        old_val = old_doc.get(field)
        new_val = new_doc.get(field)
        if old_val != new_val:
            changes.append({
                'field': field,
                'old_value': old_val,
                'new_value': new_val,
                'changed_at': timestamp
            })
    return changes

# ----------------------------------------------------------------------
# PUSH TO MONGODB (DASHBOARD-SAFE: uses $set, never overwrites dashboard fields)
# ----------------------------------------------------------------------
def push_to_mongo(mongo_client, jobs):
    """Push jobs to MongoDB using $set to preserve dashboard-owned fields.

    CRITICAL: This uses UpdateOne with $set instead of ReplaceOne.
    This ensures that dashboard-only fields (designInfo, assemblyInfo,
    cleaningInfo, pouringInstructions, ndTestRequirements, lessonsLearned,
    dashboard.*, etc.) are NEVER overwritten by the sync.
    """
    if not jobs:
        log.info("No jobs to push to MongoDB")
        return True

    try:
        db = mongo_client[MONGO_DATABASE]
        collection = db[MONGO_COLLECTION]

        bulk_operations = []
        change_count = 0
        new_count = 0

        child_job_numbers = set()
        child_cursor = collection.find(
            {'isSplitChild': True},
            {'jobNumber': 1, 'parentJobNumber': 1}
        )
        for child_doc in child_cursor:
            child_job_numbers.add(child_doc.get('jobNumber', ''))

        for job in jobs:
            job_number = job['Job']

            if job_number in child_job_numbers:
                continue

            old_doc = collection.find_one({'Job': job_number})

            if old_doc:
                changes = build_change_history(old_doc, job)

                existing_history = old_doc.get('change_history', [])
                if changes:
                    change_count += 1
                    new_history = existing_history + changes
                    job['change_history'] = new_history[-100:]
                else:
                    job['change_history'] = existing_history

                set_fields = {}
                for key, value in job.items():
                    if key not in DASHBOARD_PROTECTED_FIELDS and key != '_id':
                        set_fields[key] = value

                bulk_operations.append(
                    UpdateOne(
                        {'Job': job_number},
                        {'$set': set_fields}
                    )
                )
            else:
                new_count += 1
                job['change_history'] = []

                bulk_operations.append(
                    UpdateOne(
                        {'Job': job_number},
                        {'$set': job},
                        upsert=True
                    )
                )

        if bulk_operations:
            result = collection.bulk_write(bulk_operations, ordered=False)

            log.info(f"MongoDB Sync Results:")
            log.info(f"  New jobs inserted: {new_count}")
            log.info(f"  Jobs with changes: {change_count}")
            log.info(f"  Jobs unchanged: {len(jobs) - new_count - change_count}")
            log.info(f"  Total upserted: {result.upserted_count}")
            log.info(f"  Total modified: {result.modified_count}")

            return True
        else:
            log.info("No operations to perform")
            return True

    except Exception as e:
        log.error(f"MongoDB push failed: {e}")
        return False

# ----------------------------------------------------------------------
# RECONCILE DELETIONS
# ----------------------------------------------------------------------
def reconcile_deletions(mongo_client):
    try:
        db = mongo_client[MONGO_DATABASE]
        collection = db[MONGO_COLLECTION]

        mongo_jobs = set(doc['Job'] for doc in collection.find({}, {'Job': 1}))
        log.info(f"Found {len(mongo_jobs)} jobs in MongoDB")

        conn = get_sql_conn()
        if not conn:
            return

        cursor = conn.cursor()
        cursor.execute("SELECT Job FROM Job")
        jobboss_jobs = set(row[0] for row in cursor.fetchall())
        conn.close()

        log.info(f"Found {len(jobboss_jobs)} jobs in JobBOSS")

        deleted_jobs = mongo_jobs - jobboss_jobs

        if deleted_jobs:
            result = collection.delete_many({'Job': {'$in': list(deleted_jobs)}})
            log.info(f"Deleted {result.deleted_count} jobs from MongoDB that no longer exist in JobBOSS")
        else:
            log.info("No deleted jobs found - database is in sync")

    except Exception as e:
        log.error(f"Deletion reconciliation error: {e}")

# ----------------------------------------------------------------------
# CHECK IF RECONCILIATION NEEDED
# ----------------------------------------------------------------------
def should_run_reconciliation(mongo_client):
    try:
        db = mongo_client[MONGO_DATABASE]
        metadata_coll = db[MONGO_METADATA_COLLECTION]
        recon_doc = metadata_coll.find_one({'_id': 'last_reconciliation'})
        if not recon_doc:
            return True
        last_recon = recon_doc.get('timestamp')
        if not last_recon:
            return True
        days_since = (datetime.now() - last_recon).days
        return days_since >= 7
    except Exception as e:
        log.error(f"Error checking reconciliation: {e}")
        return False

def update_reconciliation_time(mongo_client):
    try:
        db = mongo_client[MONGO_DATABASE]
        metadata_coll = db[MONGO_METADATA_COLLECTION]
        metadata_coll.update_one(
            {'_id': 'last_reconciliation'},
            {'$set': {'timestamp': datetime.now()}},
            upsert=True
        )
    except Exception as e:
        log.error(f"Error updating reconciliation time: {e}")

# ----------------------------------------------------------------------
# REFRESH OPERATIONS FOR ALL ACTIVE JOBS
# ----------------------------------------------------------------------
def refresh_active_job_operations(mongo_client):
    """Re-fetch operations from JobBoss for ALL active jobs in MongoDB.
    This catches operation status changes (e.g., Started -> Complete)
    that the incremental sync may miss when Job.Last_Updated and
    Job_Operation.Last_Updated don't update.
    Also refreshes job-level Status to catch Active→Pending/Complete changes.
    """
    try:
        db = mongo_client[MONGO_DATABASE]
        collection = db[MONGO_COLLECTION]

        # Get ALL non-inactive jobs from MongoDB (Active + Pending)
        non_closed = collection.find(
            {
                'Status': {'$nin': ['Closed', 'Complete', 'Canceled', 'Template']},
                'Job': {'$exists': True},
                'isSplitChild': {'$ne': True}
            },
            {'Job': 1, 'Status': 1}
        )
        mongo_jobs = {doc['Job']: doc.get('Status', '') for doc in non_closed if doc.get('Job')}

        if not mongo_jobs:
            log.info("No non-closed jobs to refresh")
            return 0

        job_list = list(mongo_jobs.keys())
        log.info(f"Refreshing status and operations for {len(job_list)} non-closed jobs")

        # Step 1: Refresh job-level Status from JobBoss
        status_updated = 0
        for batch in batched(job_list, BATCH_SIZE):
            conn = get_sql_conn()
            if not conn:
                continue
            placeholders = ','.join(['?' for _ in batch])
            sql = f"SELECT Job, Status FROM Job WHERE Job IN ({placeholders})"
            try:
                cursor = conn.cursor()
                cursor.execute(sql, batch)
                for job_number, jb_status in cursor.fetchall():
                    mongo_status = mongo_jobs.get(job_number, '')
                    if jb_status and jb_status.strip() != mongo_status:
                        collection.update_one(
                            {'Job': job_number},
                            {'$set': {'Status': jb_status.strip(), 'synced_at': datetime.now().isoformat()}}
                        )
                        status_updated += 1
                        log.info(f"  Job {job_number}: Status changed {mongo_status} -> {jb_status.strip()}")
                conn.close()
            except Exception as e:
                log.error(f"Status refresh query failed: {e}")
                conn.close()

        if status_updated:
            log.info(f"Status refresh: {status_updated} jobs had status changes")

        # Step 2: Refresh operations for Active jobs only
        active_job_list = [j for j in job_list if mongo_jobs.get(j) == 'Active']
        if not active_job_list:
            log.info("No active jobs to refresh operations for")
            return status_updated

        log.info(f"Refreshing operations for {len(active_job_list)} active jobs")
        operations_dict = fetch_operations_for_jobs(active_job_list)

        if not operations_dict:
            log.warning("No operations fetched - SQL connection may have failed")
            return status_updated

        ops_updated = 0
        for job_number, new_ops in operations_dict.items():
            old_doc = collection.find_one({'Job': job_number})
            if not old_doc:
                continue

            old_ops = old_doc.get('operations', [])

            old_op_map = {}
            for op in old_ops:
                wc = (op.get('Work_Center') or '').strip()
                seq = op.get('Sequence', 0)
                old_op_map[(seq, wc)] = {
                    'Status': (op.get('Status') or '').strip(),
                    'Act_Run_Qty': op.get('Act_Run_Qty', 0),
                    'Act_Run_Hrs': op.get('Act_Run_Hrs', 0),
                }

            changed = False
            for op in new_ops:
                wc = (op.get('Work_Center') or '').strip()
                seq = op.get('Sequence', 0)
                old_data = old_op_map.get((seq, wc), {})
                if (op.get('Status') or '').strip() != old_data.get('Status', ''):
                    changed = True
                    break
                if op.get('Act_Run_Qty', 0) != old_data.get('Act_Run_Qty', 0):
                    changed = True
                    break
                if op.get('Act_Run_Hrs', 0) != old_data.get('Act_Run_Hrs', 0):
                    changed = True
                    break

            if changed:
                flags = derive_flags_from_operations(new_ops)
                collection.update_one(
                    {'Job': job_number},
                    {'$set': {
                        'operations': new_ops,
                        'is_expedite': flags.get('is_expedite', False),
                        'requires_material_certs': flags.get('requires_material_certs', False),
                        'synced_at': datetime.now().isoformat()
                    }}
                )
                ops_updated += 1

        log.info(f"Operations refresh complete: {ops_updated} jobs had changed operations out of {len(active_job_list)} active jobs")
        log.info(f"Total refresh: {status_updated} status changes + {ops_updated} operation changes")
        return status_updated + ops_updated

    except Exception as e:
        log.error(f"Error refreshing active job operations: {e}")
        return 0


def should_refresh_operations(mongo_client):
    """Check if we should run the active jobs operations refresh.
    Runs every sync cycle to keep operations fresh."""
    try:
        db = mongo_client[MONGO_DATABASE]
        metadata_coll = db[MONGO_METADATA_COLLECTION]
        refresh_doc = metadata_coll.find_one({'_id': 'last_ops_refresh'})
        if not refresh_doc:
            return True
        last_refresh = refresh_doc.get('timestamp')
        if not last_refresh:
            return True
        hours_since = (datetime.now() - last_refresh).total_seconds() / 3600
        return hours_since >= 4
    except Exception as e:
        log.error(f"Error checking ops refresh: {e}")
        return False


def update_ops_refresh_time(mongo_client):
    try:
        db = mongo_client[MONGO_DATABASE]
        metadata_coll = db[MONGO_METADATA_COLLECTION]
        metadata_coll.update_one(
            {'_id': 'last_ops_refresh'},
            {'$set': {'timestamp': datetime.now()}},
            upsert=True
        )
    except Exception as e:
        log.error(f"Error updating ops refresh time: {e}")


# ----------------------------------------------------------------------
# MAIN SYNC FUNCTION
# ----------------------------------------------------------------------
def sync_jobboss_to_mongo(force_full=False):
    if not MONGO_URI:
        log.error("MONGO_URI environment variable not set - skipping sync")
        return

    current_sync_time = datetime.utcnow()

    mongo_client = get_mongo_client()
    if not mongo_client:
        return

    try:
        if should_run_reconciliation(mongo_client):
            reconcile_deletions(mongo_client)
            update_reconciliation_time(mongo_client)

        if force_full:
            last_sync_time = current_sync_time - timedelta(days=5*365)
            log.info(f"FULL SYNC: Re-syncing all jobs from last 5 years (since {last_sync_time.strftime('%Y-%m-%d')})")
        else:
            last_sync_time = get_last_sync_time(mongo_client)

            days_since_last_sync = (current_sync_time - last_sync_time).days
            if days_since_last_sync > 7:
                log.info(f"INITIAL LOAD: Syncing {days_since_last_sync} days of data")
            else:
                log.info(f"INCREMENTAL SYNC: Last sync was {days_since_last_sync} days ago")

        jobs = fetch_jobs(last_sync_time)

        if jobs:
            success = push_to_mongo(mongo_client, jobs)
            if success:
                update_last_sync_time(mongo_client, current_sync_time)
            else:
                log.error("Failed to push to MongoDB - not updating sync timestamp")
        else:
            log.info("No new or updated jobs to sync")
            update_last_sync_time(mongo_client, current_sync_time)

        if should_refresh_operations(mongo_client) or force_full:
            log.info("Running active jobs operations refresh...")
            refresh_active_job_operations(mongo_client)
            update_ops_refresh_time(mongo_client)

    finally:
        mongo_client.close()
        log.info("MongoDB connection closed")

# ----------------------------------------------------------------------
# STATS FUNCTION
# ----------------------------------------------------------------------
def show_mongo_stats():
    if not MONGO_URI:
        log.warning("MONGO_URI not set - cannot show stats")
        return

    mongo_client = get_mongo_client()
    if not mongo_client:
        return

    try:
        db = mongo_client[MONGO_DATABASE]
        collection = db[MONGO_COLLECTION]

        total_jobs = collection.count_documents({})
        expedite_jobs = collection.count_documents({'is_expedite': True})
        material_certs_jobs = collection.count_documents({'requires_material_certs': True})
        with_ops = collection.count_documents({'operations': {'$exists': True, '$ne': []}})

        status_counts = {}
        for status in ['Active', 'Complete', 'Closed', 'Canceled', 'Hold', 'Pending', 'Template']:
            count = collection.count_documents({'Status': status})
            if count > 0:
                status_counts[status] = count

        part_type_counts = {}
        for doc in collection.aggregate([
            {'$group': {'_id': '$part_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]):
            part_type = doc['_id'] if doc['_id'] else 'UNCLASSIFIED'
            part_type_counts[part_type] = doc['count']

        casting_type_counts = {}
        for doc in collection.aggregate([
            {'$group': {'_id': '$casting_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]):
            casting_type = doc['_id'] if doc['_id'] else 'UNCLASSIFIED'
            casting_type_counts[casting_type] = doc['count']

        print("\n" + "=" * 50)
        print("MONGODB STATISTICS")
        print("=" * 50)
        print(f"Total Jobs: {total_jobs}")
        print(f"Jobs with Operations: {with_ops}")
        print(f"Expedite Jobs: {expedite_jobs}")
        print(f"Material Certs Required: {material_certs_jobs}")
        print(f"\nBy Status:")
        for status, count in sorted(status_counts.items(), key=lambda x: -x[1]):
            print(f"  {status}: {count}")
        print(f"\nBy Part Type (Top 10):")
        for pt, count in list(part_type_counts.items())[:10]:
            print(f"  {pt}: {count}")
        print(f"\nBy Casting Type:")
        for ct, count in casting_type_counts.items():
            print(f"  {ct}: {count}")
        print("=" * 50)

    finally:
        mongo_client.close()

# ----------------------------------------------------------------------
# ENTRY POINT
# ----------------------------------------------------------------------
if __name__ == '__main__':
    force_full = '--full' in sys.argv
    refresh_ops_only = '--refresh-ops' in sys.argv

    print("=" * 60)
    print("JobBOSS to MongoDB Atlas - Dashboard-Safe Sync v3.2")
    if force_full:
        print("MODE: FULL RE-SYNC (all jobs will be re-processed)")
    elif refresh_ops_only:
        print("MODE: OPERATIONS REFRESH ONLY (re-fetch ops for active jobs)")
    print("=" * 60)

    if refresh_ops_only:
        mongo_client = get_mongo_client()
        if mongo_client:
            try:
                refresh_active_job_operations(mongo_client)
                update_ops_refresh_time(mongo_client)
            finally:
                mongo_client.close()
    else:
        sync_jobboss_to_mongo(force_full=force_full)
    show_mongo_stats()

    print("\nSync complete.")
