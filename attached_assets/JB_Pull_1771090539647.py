# -*- coding: utf-8 -*-
"""
================================================================================
JobBOSS to MongoDB Atlas - Production Sync System
================================================================================

OVERVIEW:
    Syncs job data from on-premise JobBOSS SQL Server to MongoDB Atlas cloud
    database. Supports incremental updates, change tracking, and automatic
    cleanup of deleted jobs.

VERSION: 
    2.1 - November 2025
    - Removed primary_process and primary_work_center fields
    - Moved metal classification to external metal_classifications.txt file
    - Added Unit_Price field for piece pricing

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

SQL SERVER CONNECTION:
    Server: SCP-SQL\JOBBOSS
    Database: ProductionSQL

MONGODB STRUCTURE:
    Database: JobBoss
    Collections:
        - jobs: Main job data with classifications
        - sync_metadata: Sync timestamps
    
    Document Field Order (jobs collection):
        1. Core identification: Job, Customer, Part_Number, Description
        2. Classifications: part_type, casting_type, material_category
        3. Material: Material, Material_Description
        4. Quantities: Order_Quantity, Make_Quantity, Shipped_Quantity, Remaining_Quantity
        5. Pricing: Unit_Price
        6. Dates: Order_Date, Last_Updated
        7. Status: Status, Type
        8. Flags: is_expedite, requires_material_certs
        9. Reference: Quote, Sales_Code, Notes
        10. Arrays: Deliveries
        11. Metadata: synced_at

================================================================================
CLASSIFICATION SYSTEM:
================================================================================

PART TYPE (from Description field):
    Loaded from part_type_classifications.txt
    Examples: IMPELLER, HOUSING, COVER, CASE, VALVE, PISTON, etc.
    To modify: Edit part_type_classifications.txt (no code changes needed)

CASTING TYPE (from Part_Number):
    - ROBOCAST: "ROBOCAST" or "ROBO CAST" in part number
    - PATTERNCAST: "PATTERNCAST" or "PATTERN CAST" in part number
    - TEST_BAR: Test bar parts (Y BAR, C BAR, B BAR, etc.)
    - STANDARD: All other jobs

MATERIAL CATEGORY (from Material field):
    Loaded from metal_classifications.txt
    Examples: Ductile_Iron, Gray_Iron, Aluminum, Stainless_Steel, etc.
    To modify: Edit metal_classifications.txt (no code changes needed)

================================================================================
EXPEDITE & MATERIAL CERTS FLAGS:
================================================================================

DETECTION METHOD:
    Uses Job_Operation (routing) table Work_Center field
    
    is_expedite = True when routing contains:
        - Work_Center = 'EXPEDITE'
    
    requires_material_certs = True when routing contains:
        - Work_Center = 'CERT'

================================================================================
"""

import pyodbc
import logging
import os
from datetime import datetime, timedelta
from pymongo import MongoClient, UpdateOne, ReplaceOne
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

# MongoDB Atlas - FROM ENVIRONMENT VARIABLE
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DATABASE = 'JobBoss'
MONGO_COLLECTION = 'jobs'
MONGO_METADATA_COLLECTION = 'sync_metadata'

# Path to classification files
EXCLUSION_FILE = Path(__file__).parent / 'excluded_materials.txt'
CLASSIFICATION_FILE = Path(__file__).parent / 'part_type_classifications.txt'
METAL_CLASSIFICATION_FILE = Path(__file__).parent / 'metal_classifications.txt'

# Fields to track changes for
TRACKED_FIELDS = [
    'Status', 'Make_Quantity', 'Order_Quantity', 'Material', 
    'Material_Description', 'Notes', 'Remaining_Quantity', 'Shipped_Quantity',
    'is_expedite', 'requires_material_certs', 'Quote', 'Sales_Code',
    'part_type', 'casting_type', 'material_category', 'Unit_Price'
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
    """Load the list of materials to exclude from text file"""
    excluded = set()
    
    if not EXCLUSION_FILE.exists():
        log.warning(f"Exclusion file not found: {EXCLUSION_FILE}")
        log.warning("No materials will be filtered - all materials will be included")
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
    """Load part type classification rules from text file"""
    classifications = []
    
    if not CLASSIFICATION_FILE.exists():
        log.warning(f"Classification file not found: {CLASSIFICATION_FILE}")
        log.warning("Using default classification: OTHER for all parts")
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
    """Load metal category classification rules from text file"""
    classifications = []
    
    if not METAL_CLASSIFICATION_FILE.exists():
        log.warning(f"Metal classification file not found: {METAL_CLASSIFICATION_FILE}")
        log.warning("Using default classification: Unknown for all materials")
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

# Load classifications at startup
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
# GET LAST SYNC TIMESTAMP
# ----------------------------------------------------------------------
def get_last_sync_time(mongo_client):
    """Get the last successful sync timestamp from MongoDB"""
    try:
        db = mongo_client[MONGO_DATABASE]
        metadata_coll = db[MONGO_METADATA_COLLECTION]
        
        sync_doc = metadata_coll.find_one({'_id': 'last_sync'})
        
        if sync_doc and 'timestamp' in sync_doc:
            last_sync = sync_doc['timestamp']
            log.info(f"Last sync was: {last_sync}")
            return last_sync
        else:
            # First run - get jobs from last year
            one_year_ago = datetime.now() - timedelta(days=365)
            log.info(f"First sync - loading jobs from last year: {one_year_ago}")
            return one_year_ago
            
    except Exception as e:
        log.error(f"Error getting last sync time: {e}")
        return datetime.now() - timedelta(days=365)

# ----------------------------------------------------------------------
# UPDATE LAST SYNC TIMESTAMP
# ----------------------------------------------------------------------
def update_last_sync_time(mongo_client, timestamp):
    """Store the current sync timestamp in MongoDB"""
    try:
        db = mongo_client[MONGO_DATABASE]
        metadata_coll = db[MONGO_METADATA_COLLECTION]
        
        metadata_coll.update_one(
            {'_id': 'last_sync'},
            {'$set': {'timestamp': timestamp, 'updated_at': datetime.now()}},
            upsert=True
        )
        log.info(f"Updated last sync timestamp to: {timestamp}")
        
    except Exception as e:
        log.error(f"Error updating last sync time: {e}")

# ----------------------------------------------------------------------
# CLASSIFICATION FUNCTIONS
# ----------------------------------------------------------------------
def classify_part_type(description):
    """Classify part type based on description using loaded rules"""
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
    """Classify casting type based on part number"""
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
    """Classify material category using loaded rules"""
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
# FETCH EXPEDITE AND CERTS FLAGS FROM ROUTING
# ----------------------------------------------------------------------
def fetch_routing_flags(job_list):
    """Check if jobs are expedite or require material certs from Job_Operation routing"""
    if not job_list:
        return {}
    
    conn = get_sql_conn()
    if not conn:
        return {}
    
    placeholders = ','.join(['?' for _ in job_list])
    sql = f"""
    SELECT DISTINCT
        Job,
        Work_Center
    FROM Job_Operation
    WHERE Job IN ({placeholders})
        AND Work_Center IN ('CERT', 'EXPEDITE')
    """
    
    try:
        cursor = conn.cursor()
        cursor.execute(sql, job_list)
        
        flags_dict = {}
        
        for job, work_center in cursor.fetchall():
            if job not in flags_dict:
                flags_dict[job] = {
                    'is_expedite': False,
                    'requires_material_certs': False
                }
            
            wc = work_center.strip() if work_center else ''
            
            if wc == 'CERT':
                flags_dict[job]['requires_material_certs'] = True
            elif wc == 'EXPEDITE':
                flags_dict[job]['is_expedite'] = True
        
        conn.close()
        
        expedite_count = sum(1 for f in flags_dict.values() if f['is_expedite'])
        certs_count = sum(1 for f in flags_dict.values() if f['requires_material_certs'])
        log.info(f"Found {expedite_count} expedite jobs and {certs_count} jobs requiring material certs (from routing)")
        
        return flags_dict
        
    except Exception as e:
        log.error(f"Routing flags query failed: {e}")
        conn.close()
        return {}

# ----------------------------------------------------------------------
# FETCH MATERIALS FOR JOBS (FIRST METAL ONLY)
# ----------------------------------------------------------------------
def fetch_materials_for_jobs(job_list):
    """Fetch first metal material for given jobs"""
    if not job_list:
        return {}
    
    conn = get_sql_conn()
    if not conn:
        return {}
    
    placeholders = ','.join(['?' for _ in job_list])
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
        cursor.execute(sql, job_list)
        
        materials_dict = {}
        filtered_count = 0
        
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
        log.info(f"Fetched materials for {len(materials_dict)} jobs (filtered out {filtered_count} non-metals)")
        return materials_dict
        
    except Exception as e:
        log.error(f"Materials query failed: {e}")
        conn.close()
        return {}

# ----------------------------------------------------------------------
# FETCH OPEN DELIVERIES FOR JOBS
# ----------------------------------------------------------------------
def fetch_deliveries_for_jobs(job_list):
    """Fetch all open deliveries for given jobs as arrays"""
    if not job_list:
        return {}
    
    conn = get_sql_conn()
    if not conn:
        return {}
    
    placeholders = ','.join(['?' for _ in job_list])
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
        cursor.execute(sql, job_list)
        
        deliveries_dict = {}
        
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
        log.info(f"Fetched deliveries for {len(deliveries_dict)} jobs")
        return deliveries_dict
        
    except Exception as e:
        log.error(f"Deliveries query failed: {e}")
        conn.close()
        return {}

# ----------------------------------------------------------------------
# FETCH JOBS (INITIAL OR INCREMENTAL) - ALL STATUSES
# ----------------------------------------------------------------------
def fetch_jobs(last_sync_time):
    """Fetch jobs from JobBOSS that have been updated since last_sync_time - ALL STATUSES"""
    conn = get_sql_conn()
    if not conn:
        return []

    # Query for ALL jobs updated since last sync (all statuses)
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
        j.Note_Text AS Notes,
        j.Quote,
        j.Sales_Code,
        j.Unit_Price
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
            
            # Convert datetime to ISO string for MongoDB
            if job_dict.get('Order_Date'):
                job_dict['Order_Date'] = job_dict['Order_Date'].isoformat()
            if job_dict.get('Last_Updated'):
                job_dict['Last_Updated'] = job_dict['Last_Updated'].isoformat()
            
            # Add sync metadata
            job_dict['synced_at'] = datetime.now().isoformat()
            
            jobs.append(job_dict)
        
        conn.close()
        
        # Fetch related data for these jobs
        if jobs:
            materials_dict = fetch_materials_for_jobs(job_list)
            deliveries_dict = fetch_deliveries_for_jobs(job_list)
            flags_dict = fetch_routing_flags(job_list)
            
            # Rebuild jobs with desired field order
            ordered_jobs = []
            for job in jobs:
                job_number = job['Job']
                
                # Get related data
                material_data = materials_dict.get(job_number, {})
                flags = flags_dict.get(job_number, {})
                material = material_data.get('Material', None)
                
                # Build document in desired order
                ordered_job = {
                    # Core identification
                    'Job': job_number,
                    'Customer': job.get('Customer'),
                    'Part_Number': job.get('Part_Number'),
                    'Description': job.get('Description'),
                    
                    # Classifications
                    'part_type': classify_part_type(job.get('Description')),
                    'casting_type': classify_casting_type(job.get('Part_Number')),
                    'material_category': classify_material_category(material),
                    
                    # Material
                    'Material': material,
                    'Material_Description': material_data.get('Material_Description', None),
                    
                    # Quantities
                    'Order_Quantity': job.get('Order_Quantity'),
                    'Make_Quantity': job.get('Make_Quantity'),
                    'Shipped_Quantity': job.get('Shipped_Quantity'),
                    'Remaining_Quantity': job.get('Remaining_Quantity'),
                    
                    # Pricing
                    'Unit_Price': job.get('Unit_Price'),
                    
                    # Dates
                    'Order_Date': job.get('Order_Date'),
                    'Last_Updated': job.get('Last_Updated'),
                    
                    # Status
                    'Status': job.get('Status'),
                    'Type': job.get('Type'),
                    
                    # Flags
                    'is_expedite': flags.get('is_expedite', False),
                    'requires_material_certs': flags.get('requires_material_certs', False),
                    
                    # Reference fields
                    'Quote': job.get('Quote'),
                    'Sales_Code': job.get('Sales_Code'),
                    'Notes': job.get('Notes'),
                    
                    # Arrays
                    'Deliveries': deliveries_dict.get(job_number, []),
                    
                    # Metadata
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
    """Build change history entries for tracked fields"""
    changes = []
    timestamp = datetime.now().isoformat()
    
    if not old_doc:
        # New document - no history
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
# PUSH TO MONGODB
# ----------------------------------------------------------------------
def push_to_mongo(mongo_client, jobs):
    """Push jobs to MongoDB with change tracking"""
    if not jobs:
        log.info("No jobs to push to MongoDB")
        return True
    
    try:
        db = mongo_client[MONGO_DATABASE]
        collection = db[MONGO_COLLECTION]
        
        # Prepare bulk operations
        bulk_operations = []
        change_count = 0
        new_count = 0
        
        for job in jobs:
            job_number = job['Job']
            
            # Get existing document for change tracking
            old_doc = collection.find_one({'Job': job_number})
            
            if old_doc:
                # Build change history
                changes = build_change_history(old_doc, job)
                
                # Preserve existing change_history and add new changes
                existing_history = old_doc.get('change_history', [])
                
                if changes:
                    change_count += 1
                    # Add new changes and keep last 100
                    new_history = existing_history + changes
                    job['change_history'] = new_history[-100:]
                else:
                    # No changes, preserve existing history
                    job['change_history'] = existing_history
                
                # Replace entire document to maintain field order
                bulk_operations.append(
                    ReplaceOne(
                        {'Job': job_number},
                        job
                    )
                )
            else:
                # New job - initialize change_history
                new_count += 1
                job['change_history'] = []
                bulk_operations.append(
                    ReplaceOne(
                        {'Job': job_number},
                        job,
                        upsert=True
                    )
                )
        
        # Execute bulk operations
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
    """Remove jobs from MongoDB that no longer exist in JobBOSS"""
    try:
        db = mongo_client[MONGO_DATABASE]
        collection = db[MONGO_COLLECTION]
        
        # Get all Job numbers from MongoDB
        mongo_jobs = set(doc['Job'] for doc in collection.find({}, {'Job': 1}))
        log.info(f"Found {len(mongo_jobs)} jobs in MongoDB")
        
        # Get all Job numbers from JobBOSS
        conn = get_sql_conn()
        if not conn:
            return
        
        cursor = conn.cursor()
        cursor.execute("SELECT Job FROM Job")
        jobboss_jobs = set(row[0] for row in cursor.fetchall())
        conn.close()
        
        log.info(f"Found {len(jobboss_jobs)} jobs in JobBOSS")
        
        # Find jobs in MongoDB but not in JobBOSS
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
    """Check if it's been more than 7 days since last reconciliation"""
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
    """Update last reconciliation timestamp"""
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
# MAIN SYNC FUNCTION
# ----------------------------------------------------------------------
def sync_jobboss_to_mongo():
    """Main sync function - handles both initial and incremental sync"""
    
    if not MONGO_URI:
        log.error("MONGO_URI environment variable not set - skipping sync")
        return
    
    # Get current timestamp for this sync
    current_sync_time = datetime.now()
    
    # Connect to MongoDB
    mongo_client = get_mongo_client()
    if not mongo_client:
        return
    
    try:
        # Check if weekly reconciliation is needed
        if should_run_reconciliation(mongo_client):
            reconcile_deletions(mongo_client)
            update_reconciliation_time(mongo_client)
        
        # Get last sync timestamp (or 1 year ago if first run)
        last_sync_time = get_last_sync_time(mongo_client)
        
        # Determine if this is initial load or incremental
        days_since_last_sync = (current_sync_time - last_sync_time).days
        if days_since_last_sync > 7:
            log.info(f"INITIAL LOAD: Syncing {days_since_last_sync} days of data")
        else:
            log.info(f"INCREMENTAL SYNC: Last sync was {days_since_last_sync} days ago")
        
        # Fetch jobs from JobBOSS
        jobs = fetch_jobs(last_sync_time)
        
        if jobs:
            # Push to MongoDB
            success = push_to_mongo(mongo_client, jobs)
            
            if success:
                # Update last sync timestamp
                update_last_sync_time(mongo_client, current_sync_time)
            else:
                log.error("Failed to push to MongoDB - not updating sync timestamp")
        else:
            log.info("No new or updated jobs to sync")
            # Still update sync time to avoid querying same window repeatedly
            update_last_sync_time(mongo_client, current_sync_time)
        
    finally:
        mongo_client.close()
        log.info("MongoDB connection closed")

# ----------------------------------------------------------------------
# STATS FUNCTION
# ----------------------------------------------------------------------
def show_mongo_stats():
    """Display statistics about MongoDB data"""
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
        
        # Get counts by status
        status_counts = {}
        for status in ['Active', 'Complete', 'Closed', 'Canceled', 'Hold', 'Pending', 'Template']:
            count = collection.count_documents({'Status': status})
            if count > 0:
                status_counts[status] = count
        
        # Get counts by part type (handle None)
        part_type_counts = {}
        for doc in collection.aggregate([
            {'$group': {'_id': '$part_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]):
            part_type = doc['_id'] if doc['_id'] else 'UNCLASSIFIED'
            part_type_counts[part_type] = doc['count']
        
        # Get counts by casting type (handle None)
        casting_type_counts = {}
        for doc in collection.aggregate([
            {'$group': {'_id': '$casting_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]):
            casting_type = doc['_id'] if doc['_id'] else 'UNCLASSIFIED'
            casting_type_counts[casting_type] = doc['count']
        
        # Get counts by material category (handle None)
        material_category_counts = {}
        for doc in collection.aggregate([
            {'$group': {'_id': '$material_category', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]):
            category = doc['_id'] if doc['_id'] else 'UNCLASSIFIED'
            material_category_counts[category] = doc['count']
        
        log.info(f"MongoDB Stats:")
        log.info(f"  Total Jobs: {total_jobs}")
        log.info(f"  Expedite Jobs: {expedite_jobs}")
        log.info(f"  Jobs Requiring Material Certs: {material_certs_jobs}")
        
        log.info(f"  Status Breakdown:")
        for status, count in sorted(status_counts.items(), key=lambda x: x[1], reverse=True):
            log.info(f"    {status:<15} : {count:>6} jobs")
        
        log.info(f"  Top Part Types:")
        for part_type, count in list(part_type_counts.items())[:10]:
            log.info(f"    {part_type:<15} : {count:>6} jobs")
        
        log.info(f"  Casting Types:")
        for casting_type, count in casting_type_counts.items():
            log.info(f"    {casting_type:<15} : {count:>6} jobs")
        
        log.info(f"  Material Categories:")
        for category, count in material_category_counts.items():
            log.info(f"    {category:<15} : {count:>6} jobs")
        
        # Get date range
        oldest = collection.find_one(sort=[('Last_Updated', 1)])
        newest = collection.find_one(sort=[('Last_Updated', -1)])
        
        if oldest and newest:
            log.info(f"  Date Range: {oldest.get('Last_Updated')} to {newest.get('Last_Updated')}")
        
        # Get last sync info
        metadata_coll = db[MONGO_METADATA_COLLECTION]
        sync_doc = metadata_coll.find_one({'_id': 'last_sync'})
        if sync_doc:
            log.info(f"  Last Sync: {sync_doc.get('timestamp')}")
        
        recon_doc = metadata_coll.find_one({'_id': 'last_reconciliation'})
        if recon_doc:
            log.info(f"  Last Reconciliation: {recon_doc.get('timestamp')}")
        
    finally:
        mongo_client.close()

# ----------------------------------------------------------------------
# MAIN
# ----------------------------------------------------------------------
if __name__ == "__main__":
    log.info("=== JobBOSS to MongoDB Sync START ===")
    
    # Run the sync
    sync_jobboss_to_mongo()
    
    # Show stats
    show_mongo_stats()
    
    log.info("=== JobBOSS to MongoDB Sync COMPLETE ===")
