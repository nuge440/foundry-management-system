"""
MS-SQL to MongoDB Import Script for Foundry Management System
==============================================================

This script imports job data from a Microsoft SQL Server database
and formats it for MongoDB storage, matching the Dashboard/Job Information
structure used in the Foundry Management System.

Database: MongoDB Atlas - "foundry" database
Collection: "jobs" with embedded sub-documents for:
    - designInfo
    - assemblyInfo
    - cleaningInfo
    - pouringInstructions
    - ndTestRequirements
    - lessonsLearned (array for multiple entries)

Requirements:
    pip install pymssql pymongo python-dotenv

Environment Variables (create a .env file):
    MSSQL_SERVER=your_server_name
    MSSQL_DATABASE=your_database_name
    MSSQL_USER=your_username
    MSSQL_PASSWORD=your_password
    MONGODB_URI=mongodb+srv://... (your MongoDB Atlas connection string)

Usage:
    python mssql_to_mongodb_import.py
"""

import os
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    import pymssql
    import pymongo
    from dotenv import load_dotenv
except ImportError as e:
    logger.error(f"Missing required package: {e}")
    logger.info("Install requirements: pip install pymssql pymongo python-dotenv")
    sys.exit(1)

# Load environment variables
load_dotenv()


class MSSQLConnection:
    """Handles MS-SQL database connection and queries."""
    
    def __init__(self):
        self.server = os.getenv('MSSQL_SERVER', 'localhost')
        self.database = os.getenv('MSSQL_DATABASE', 'JobBoss')
        self.user = os.getenv('MSSQL_USER', '')
        self.password = os.getenv('MSSQL_PASSWORD', '')
        self.connection = None
    
    def connect(self):
        """Establish connection to MS-SQL database."""
        try:
            self.connection = pymssql.connect(
                server=self.server,
                database=self.database,
                user=self.user,
                password=self.password
            )
            logger.info(f"Connected to MS-SQL database: {self.database}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MS-SQL: {e}")
            return False
    
    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            logger.info("MS-SQL connection closed")
    
    def execute_query(self, query: str) -> List[Dict]:
        """Execute a query and return results as list of dictionaries."""
        if not self.connection:
            raise Exception("Not connected to database")
        
        cursor = self.connection.cursor(as_dict=True)
        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        return results


class MongoDBConnection:
    """Handles MongoDB connection and operations."""
    
    def __init__(self):
        self.uri = os.getenv('MONGODB_URI')
        self.database_name = 'foundry'  # Fixed database name
        self.client = None
        self.db = None
    
    def connect(self):
        """Establish connection to MongoDB."""
        try:
            self.client = pymongo.MongoClient(self.uri)
            self.db = self.client[self.database_name]
            # Test connection
            self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {self.database_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
    
    def close(self):
        """Close the MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def insert_many(self, collection_name: str, documents: List[Dict]) -> int:
        """Insert multiple documents into a collection."""
        if not self.db:
            raise Exception("Not connected to database")
        
        collection = self.db[collection_name]
        result = collection.insert_many(documents)
        return len(result.inserted_ids)
    
    def upsert_by_job_number(self, collection_name: str, documents: List[Dict]) -> Dict:
        """Upsert documents by job number (update if exists, insert if not)."""
        if not self.db:
            raise Exception("Not connected to database")
        
        collection = self.db[collection_name]
        inserted = 0
        updated = 0
        
        for doc in documents:
            job_number = doc.get('jobNumber')
            if job_number:
                result = collection.update_one(
                    {'jobNumber': job_number},
                    {'$set': doc},
                    upsert=True
                )
                if result.upserted_id:
                    inserted += 1
                elif result.modified_count > 0:
                    updated += 1
        
        return {'inserted': inserted, 'updated': updated}


def transform_job_record(mssql_row: Dict) -> Dict:
    """
    Transform a MS-SQL job record to MongoDB document format.
    
    Adjust the field mappings below to match your MS-SQL schema.
    This example assumes common JobBoss-style field names.
    """
    
    def safe_str(value) -> str:
        """Safely convert value to string."""
        if value is None:
            return ""
        return str(value).strip()
    
    def safe_date(value) -> Optional[str]:
        """Convert date to ISO format string."""
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)
    
    def safe_int(value, default: int = 0) -> int:
        """Safely convert to integer."""
        try:
            return int(value) if value is not None else default
        except (ValueError, TypeError):
            return default
    
    def safe_float(value, default: float = 0.0) -> float:
        """Safely convert to float."""
        try:
            return float(value) if value is not None else default
        except (ValueError, TypeError):
            return default
    
    # Map MS-SQL fields to MongoDB document structure
    # CUSTOMIZE THESE MAPPINGS TO MATCH YOUR MS-SQL SCHEMA
    job_document = {
        # Core Job Information (Dashboard fields - 22 fields)
        "jobNumber": safe_str(mssql_row.get('Job', mssql_row.get('JobNumber', ''))),
        "status": safe_str(mssql_row.get('Status', 'New')),
        "task": safe_str(mssql_row.get('Task', mssql_row.get('Description', ''))),
        "company": safe_str(mssql_row.get('Customer', mssql_row.get('Company', ''))),
        "partNumber": safe_str(mssql_row.get('Part_Number', mssql_row.get('PartNumber', ''))),
        "moldSize": safe_str(mssql_row.get('Mold_Size', mssql_row.get('MoldSize', ''))),
        "material": safe_str(mssql_row.get('Material', '')),
        "pourWeight": safe_str(mssql_row.get('Pour_Weight', mssql_row.get('PourWeight', ''))),
        "owner": safe_str(mssql_row.get('Owner', mssql_row.get('AssignedTo', ''))),
        "quantityNeeded": safe_int(mssql_row.get('Quantity_Ordered', mssql_row.get('QuantityNeeded', 0))),
        "moldsNeeded": safe_int(mssql_row.get('Molds_Needed', mssql_row.get('MoldsNeeded', 0))),
        "certs": safe_str(mssql_row.get('Certs', '')),
        "customChills": safe_str(mssql_row.get('Custom_Chills', mssql_row.get('CustomChills', ''))),
        "coresOrdered": safe_str(mssql_row.get('Cores_Ordered', mssql_row.get('CoresOrdered', ''))),
        "promisedDate": safe_date(mssql_row.get('Promised_Date', mssql_row.get('PromisedDate'))),
        "heatTreat": safe_str(mssql_row.get('Heat_Treat', mssql_row.get('HeatTreat', ''))),
        "assemblyCode": safe_str(mssql_row.get('Assembly_Code', mssql_row.get('AssemblyCode', ''))),
        "estAssemblyTime": safe_str(mssql_row.get('Est_Assembly_Time', mssql_row.get('EstAssemblyTime', ''))),
        "modelApproved": safe_str(mssql_row.get('Model_Approved', mssql_row.get('ModelApproved', ''))),
        "notes": safe_str(mssql_row.get('Notes', mssql_row.get('Comments', ''))),
        "informMelt": safe_str(mssql_row.get('Inform_Melt', mssql_row.get('InformMelt', ''))),
        "moldsSplitOff": safe_str(mssql_row.get('Molds_Split_Off', mssql_row.get('MoldsSplitOff', ''))),
        
        # Design Information (sub-document)
        "designInfo": {
            "solidification": safe_str(mssql_row.get('Solidification', '')),
            "solidificationQuality": safe_str(mssql_row.get('Solidification_Quality', '')),  # Nova or Magma
            "sprues": safe_int(mssql_row.get('Sprues', 0)),
            "basinSize": safe_str(mssql_row.get('Basin_Size', '')),  # Small, Large, Double
            "gatingSystem": safe_str(mssql_row.get('Gating_System', '')),
            "pourRateDesign": safe_str(mssql_row.get('Pour_Rate_Design', '')),
            "pourRateActual": safe_str(mssql_row.get('Pour_Rate_Actual', '')),
            "powerpointLink": safe_str(mssql_row.get('Powerpoint_Link', '')),
            "cad": safe_str(mssql_row.get('CAD', '')),
            "cam": safe_str(mssql_row.get('CAM', '')),
            "parting": safe_str(mssql_row.get('Parting', '')),
            "moldType": safe_str(mssql_row.get('Mold_Type', '')),
            "castingsPerMold": safe_int(mssql_row.get('Castings_Per_Mold', 1)),
            "orientation": safe_str(mssql_row.get('Orientation', '')),
        },
        
        # Assembly Information (sub-document)
        "assemblyInfo": {
            "moldSize": safe_str(mssql_row.get('Assembly_Mold_Size', '')),
            "paint": safe_str(mssql_row.get('Paint', '')),
            "robotTimeCope": safe_str(mssql_row.get('Robot_Time_Cope', '')),
            "robotTimeDrag": safe_str(mssql_row.get('Robot_Time_Drag', '')),
            "mpiCerted": safe_str(mssql_row.get('MPI_Certed', '')),
            "assemblyNotes": safe_str(mssql_row.get('Assembly_Notes', '')),
            "coreBoxes": safe_str(mssql_row.get('Core_Boxes', '')),
            "specialTooling": safe_str(mssql_row.get('Special_Tooling', '')),
        },
        
        # Cleaning Room Information (sub-document - 11 fields)
        "cleaningInfo": {
            "cleanTime": safe_str(mssql_row.get('Clean_Time', '')),
            "moldRating": safe_str(mssql_row.get('Mold_Rating', '')),
            "pouringPictures": safe_str(mssql_row.get('Pouring_Pictures', '')),
            "castingPictures": safe_str(mssql_row.get('Casting_Pictures', '')),
            "coreAssembly": safe_str(mssql_row.get('Core_Assembly', '')),
            "coreCost": safe_str(mssql_row.get('Core_Cost', '')),
            "moldAssembly": safe_str(mssql_row.get('Mold_Assembly', '')),
            "castingWeightLbs": safe_float(mssql_row.get('Casting_Weight_Lbs', 0)),
            "pourPoint": safe_str(mssql_row.get('Pour_Point', '')),
            "assembly": safe_str(mssql_row.get('Assembly', '')),
            "additionalNotesInitial": safe_str(mssql_row.get('Additional_Notes_Initial', '')),
        },
        
        # Pouring Instructions (sub-document - 16 fields)
        "pouringInstructions": {
            "pourTemp": safe_str(mssql_row.get('Pour_Temp', '')),
            "pourTempMin": safe_str(mssql_row.get('Pour_Temp_Min', '')),
            "pourTempMax": safe_str(mssql_row.get('Pour_Temp_Max', '')),
            "pourTime": safe_str(mssql_row.get('Pour_Time', '')),
            "ladleSize": safe_str(mssql_row.get('Ladle_Size', '')),
            "inoculant": safe_str(mssql_row.get('Inoculant', '')),
            "inoculantAmount": safe_str(mssql_row.get('Inoculant_Amount', '')),
            "nodulizer": safe_str(mssql_row.get('Nodulizer', '')),
            "nodularizerAmount": safe_str(mssql_row.get('Nodulizer_Amount', '')),
            "filterType": safe_str(mssql_row.get('Filter_Type', '')),
            "filterSize": safe_str(mssql_row.get('Filter_Size', '')),
            "skimTime": safe_str(mssql_row.get('Skim_Time', '')),
            "holdTime": safe_str(mssql_row.get('Hold_Time', '')),
            "shakeoutTime": safe_str(mssql_row.get('Shakeout_Time', '')),
            "specialInstructions": safe_str(mssql_row.get('Special_Instructions', '')),
            "notes": safe_str(mssql_row.get('Pouring_Notes', '')),
        },
        
        # ND Test Requirements (sub-document - 11 parameters)
        "ndTestRequirements": {
            "rtRequired": safe_str(mssql_row.get('RT_Required', '')),
            "rtLevel": safe_str(mssql_row.get('RT_Level', '')),
            "utRequired": safe_str(mssql_row.get('UT_Required', '')),
            "utLevel": safe_str(mssql_row.get('UT_Level', '')),
            "mtRequired": safe_str(mssql_row.get('MT_Required', '')),
            "mtLevel": safe_str(mssql_row.get('MT_Level', '')),
            "ptRequired": safe_str(mssql_row.get('PT_Required', '')),
            "ptLevel": safe_str(mssql_row.get('PT_Level', '')),
            "visualRequired": safe_str(mssql_row.get('Visual_Required', '')),
            "visualLevel": safe_str(mssql_row.get('Visual_Level', '')),
            "testNotes": safe_str(mssql_row.get('Test_Notes', '')),
        },
        
        # Lessons Learned (array for multiple entries - 8 fields per entry)
        "lessonsLearned": [],  # Will be populated separately or as empty array
        
        # Metadata
        "importedAt": datetime.utcnow().isoformat(),
        "importSource": "MSSQL",
        "originalId": safe_str(mssql_row.get('ID', mssql_row.get('Job_ID', ''))),
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }
    
    return job_document


def create_lesson_learned_entry(mssql_row: Dict) -> Dict:
    """
    Create a single Lessons Learned entry.
    This is used when importing lessons learned from a separate table.
    
    Lessons Learned has 8 fields per entry.
    """
    def safe_str(value) -> str:
        if value is None:
            return ""
        return str(value).strip()
    
    def safe_date(value) -> Optional[str]:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)
    
    return {
        "id": safe_str(mssql_row.get('ID', '')),
        "category": safe_str(mssql_row.get('Category', '')),
        "issue": safe_str(mssql_row.get('Issue', '')),
        "rootCause": safe_str(mssql_row.get('Root_Cause', '')),
        "solution": safe_str(mssql_row.get('Solution', '')),
        "preventiveMeasure": safe_str(mssql_row.get('Preventive_Measure', '')),
        "recordedBy": safe_str(mssql_row.get('Recorded_By', '')),
        "recordedDate": safe_date(mssql_row.get('Recorded_Date')),
    }


def get_jobs_query() -> str:
    """
    SQL query to fetch job data from MS-SQL.
    CUSTOMIZE THIS QUERY TO MATCH YOUR DATABASE SCHEMA.
    """
    return """
    SELECT 
        j.Job,
        j.Status,
        j.Description AS Task,
        c.Customer_Name AS Customer,
        j.Part_Number,
        j.Mold_Size,
        j.Material,
        j.Pour_Weight,
        j.Owner,
        j.Quantity_Ordered,
        j.Molds_Needed,
        j.Certs,
        j.Custom_Chills,
        j.Cores_Ordered,
        j.Promised_Date,
        j.Heat_Treat,
        j.Assembly_Code,
        j.Est_Assembly_Time,
        j.Model_Approved,
        j.Notes,
        j.Inform_Melt,
        j.Molds_Split_Off
    FROM Job j
    LEFT JOIN Customer c ON j.Customer = c.Customer
    WHERE j.Status NOT IN ('Closed', 'Cancelled')
    ORDER BY j.Job DESC
    """


def run_import(dry_run: bool = False):
    """
    Main import function.
    
    Args:
        dry_run: If True, only simulates the import without writing to MongoDB
    """
    logger.info("Starting MS-SQL to MongoDB import...")
    
    if dry_run:
        logger.info("*** DRY RUN MODE - No data will be written ***")
    
    # Connect to MS-SQL
    mssql = MSSQLConnection()
    if not mssql.connect():
        logger.error("Failed to connect to MS-SQL. Aborting import.")
        return
    
    # Connect to MongoDB (skip in dry run if not needed)
    mongo = None
    if not dry_run:
        mongo = MongoDBConnection()
        if not mongo.connect():
            logger.error("Failed to connect to MongoDB. Aborting import.")
            mssql.close()
            return
    
    try:
        # Fetch jobs from MS-SQL
        logger.info("Fetching jobs from MS-SQL...")
        query = get_jobs_query()
        jobs = mssql.execute_query(query)
        logger.info(f"Found {len(jobs)} jobs to import")
        
        if len(jobs) == 0:
            logger.warning("No jobs found to import")
            return
        
        # Transform records
        logger.info("Transforming records to MongoDB format...")
        documents = []
        for job in jobs:
            try:
                doc = transform_job_record(job)
                documents.append(doc)
            except Exception as e:
                logger.error(f"Error transforming job {job.get('Job', 'unknown')}: {e}")
        
        logger.info(f"Transformed {len(documents)} records")
        
        # Preview first record
        if documents:
            logger.info("Sample transformed document:")
            sample = documents[0]
            for key, value in sample.items():
                if isinstance(value, dict):
                    logger.info(f"  {key}: {{...}}")
                else:
                    logger.info(f"  {key}: {value}")
        
        # Insert into MongoDB
        if not dry_run and mongo:
            logger.info("Upserting records to MongoDB...")
            result = mongo.upsert_by_job_number('jobs', documents)
            logger.info(f"Import complete: {result['inserted']} inserted, {result['updated']} updated")
        else:
            logger.info(f"DRY RUN: Would upsert {len(documents)} records to MongoDB")
        
    except Exception as e:
        logger.error(f"Import failed: {e}")
        raise
    finally:
        mssql.close()
        if mongo:
            mongo.close()


def export_to_json(output_file: str = 'jobs_export.json'):
    """
    Export jobs from MS-SQL to a JSON file (for testing without MongoDB).
    """
    import json
    
    logger.info(f"Exporting jobs to {output_file}...")
    
    mssql = MSSQLConnection()
    if not mssql.connect():
        logger.error("Failed to connect to MS-SQL")
        return
    
    try:
        query = get_jobs_query()
        jobs = mssql.execute_query(query)
        
        documents = []
        for job in jobs:
            try:
                doc = transform_job_record(job)
                documents.append(doc)
            except Exception as e:
                logger.error(f"Error transforming job: {e}")
        
        with open(output_file, 'w') as f:
            json.dump(documents, f, indent=2, default=str)
        
        logger.info(f"Exported {len(documents)} jobs to {output_file}")
        
    finally:
        mssql.close()


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Import jobs from MS-SQL to MongoDB'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simulate import without writing to MongoDB'
    )
    parser.add_argument(
        '--export-json',
        type=str,
        metavar='FILE',
        help='Export to JSON file instead of MongoDB'
    )
    
    args = parser.parse_args()
    
    if args.export_json:
        export_to_json(args.export_json)
    else:
        run_import(dry_run=args.dry_run)
