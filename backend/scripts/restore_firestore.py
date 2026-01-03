#!/usr/bin/env python3
"""
Firestore Restore Script for MICHELA

This script restores collections from JSON backup files to Firestore.
Supports both production and staging environments.

Usage:
    python restore_firestore.py [--environment prod|staging] --backup-dir path [--dry-run]
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv


def initialize_firebase(environment='production'):
    """Initialize Firebase Admin SDK"""
    if firebase_admin._apps:
        return firestore.client()
    
    # Load environment variables
    env_file = f'.env.{environment}' if environment != 'production' else '.env'
    env_path = os.path.join(os.path.dirname(__file__), '..', env_file)
    load_dotenv(dotenv_path=env_path)
    
    # Load credentials
    if 'GOOGLE_CREDENTIALS' in os.environ:
        # From environment variable (production/staging)
        cred_dict = json.loads(os.environ['GOOGLE_CREDENTIALS'])
        cred = credentials.Certificate(cred_dict)
    else:
        # From file (local development)
        # Look for service account key file with pattern michela-*.json
        keys_dir = os.path.join(os.path.dirname(__file__), '..', 'keys')
        if os.path.exists(keys_dir):
            key_files = [f for f in os.listdir(keys_dir) if f.startswith('michela-') and f.endswith('.json')]
            if key_files:
                key_path = os.path.join(keys_dir, key_files[0])
            else:
                raise FileNotFoundError(
                    f"No Firebase credentials found in {keys_dir}. "
                    "Please provide a michela-*.json key file or set GOOGLE_CREDENTIALS environment variable."
                )
        else:
            raise FileNotFoundError(
                f"Keys directory not found at {keys_dir}. "
                "Please create the directory and add your Firebase credentials or set GOOGLE_CREDENTIALS environment variable."
            )
        cred = credentials.Certificate(key_path)
    
    firebase_admin.initialize_app(cred)
    return firestore.client()


def restore_collection(db, collection_name, backup_file, dry_run=False):
    """Restore a single collection from JSON file"""
    print(f"Restoring collection: {collection_name}")
    
    # Read backup file
    with open(backup_file, 'r', encoding='utf-8') as f:
        backup_data = json.load(f)
    
    if not backup_data:
        print(f"  ! No data found in {backup_file}")
        return 0
    
    collection_ref = db.collection(collection_name)
    doc_count = 0
    
    for doc_data in backup_data:
        # Extract document ID
        doc_id = doc_data.pop('_id', None)
        if not doc_id:
            print(f"  ! Warning: Document without ID, skipping")
            continue
        
        if dry_run:
            print(f"  [DRY RUN] Would restore document: {doc_id}")
        else:
            # Restore document
            doc_ref = collection_ref.document(doc_id)
            doc_ref.set(doc_data)
        
        doc_count += 1
    
    if dry_run:
        print(f"  [DRY RUN] Would restore {doc_count} documents")
    else:
        print(f"  ✓ Restored {doc_count} documents")
    
    return doc_count


def load_backup_metadata(backup_dir):
    """Load backup metadata if available"""
    metadata_file = backup_dir / 'backup_metadata.json'
    if metadata_file.exists():
        try:
            with open(metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            print(f"  ! Warning: Could not parse metadata file: {e}")
            return None
        except IOError as e:
            print(f"  ! Warning: Could not read metadata file: {e}")
            return None
    return None


def main():
    parser = argparse.ArgumentParser(
        description='Restore Firestore data for MICHELA'
    )
    parser.add_argument(
        '--environment',
        choices=['production', 'staging', 'prod', 'stg'],
        default='staging',
        help='Environment to restore to (default: staging for safety)'
    )
    parser.add_argument(
        '--backup-dir',
        type=str,
        required=True,
        help='Directory containing backup files'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Perform a dry run without actually restoring data'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force restore to production (requires explicit flag)'
    )
    
    args = parser.parse_args()
    
    # Normalize environment name
    environment = 'production' if args.environment in ['production', 'prod'] else 'staging'
    
    # Safety check for production restore
    if environment == 'production' and not args.force:
        print("\n⚠️  WARNING: You are attempting to restore to PRODUCTION!")
        print("This operation will overwrite existing data.")
        print("To proceed, add the --force flag.\n")
        sys.exit(1)
    
    backup_dir = Path(args.backup_dir)
    if not backup_dir.exists():
        print(f"✗ Error: Backup directory not found: {backup_dir}")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"MICHELA Firestore Restore")
    if args.dry_run:
        print(f"[DRY RUN MODE - No data will be modified]")
    print(f"{'='*60}")
    print(f"Environment: {environment}")
    print(f"Backup directory: {backup_dir}")
    print(f"{'='*60}\n")
    
    # Load metadata
    metadata = load_backup_metadata(backup_dir)
    if metadata:
        print(f"Backup metadata:")
        print(f"  Date: {metadata.get('backup_date', 'Unknown')}")
        print(f"  Source environment: {metadata.get('environment', 'Unknown')}")
        print(f"  Collections: {len(metadata.get('collections', []))}")
        print(f"  Total documents: {metadata.get('total_documents', 'Unknown')}")
        print()
    
    # Confirmation prompt
    if not args.dry_run:
        if environment == 'production':
            response = input("⚠️  Type 'RESTORE TO PRODUCTION' to continue: ")
            if response != 'RESTORE TO PRODUCTION':
                print("Restore cancelled.")
                sys.exit(0)
        else:
            response = input("Type 'yes' to continue: ")
            if response.lower() != 'yes':
                print("Restore cancelled.")
                sys.exit(0)
    
    try:
        # Initialize Firebase
        db = initialize_firebase(environment)
        
        # Find all backup files
        backup_files = list(backup_dir.glob('*.json'))
        backup_files = [f for f in backup_files if f.name != 'backup_metadata.json']
        
        if not backup_files:
            print(f"✗ Error: No backup files found in {backup_dir}")
            sys.exit(1)
        
        print(f"Found {len(backup_files)} collection(s) to restore\n")
        
        # Restore each collection
        total_docs = 0
        for backup_file in backup_files:
            collection_name = backup_file.stem  # filename without extension
            doc_count = restore_collection(db, collection_name, backup_file, args.dry_run)
            total_docs += doc_count
        
        print(f"\n{'='*60}")
        if args.dry_run:
            print(f"✓ Dry run completed successfully!")
        else:
            print(f"✓ Restore completed successfully!")
        print(f"  Total collections: {len(backup_files)}")
        print(f"  Total documents: {total_docs}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n✗ Error during restore: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
