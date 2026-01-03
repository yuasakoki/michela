#!/usr/bin/env python3
"""
Firestore Backup Script for MICHELA

This script backs up all collections from Firestore to JSON files.
Supports both production and staging environments.

Usage:
    python backup_firestore.py [--environment prod|staging] [--output-dir path]
"""

import os
import sys
import json
import argparse
from datetime import datetime
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
        try:
            cred_dict = json.loads(os.environ['GOOGLE_CREDENTIALS'])
            cred = credentials.Certificate(cred_dict)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"Invalid JSON in GOOGLE_CREDENTIALS environment variable: {e}"
            )
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


def backup_collection(db, collection_name, output_dir):
    """Backup a single collection to JSON file"""
    print(f"Backing up collection: {collection_name}")
    
    collection_ref = db.collection(collection_name)
    docs = collection_ref.stream()
    
    backup_data = []
    doc_count = 0
    
    for doc in docs:
        doc_dict = doc.to_dict()
        doc_dict['_id'] = doc.id  # Preserve document ID
        backup_data.append(doc_dict)
        doc_count += 1
    
    # Save to JSON file
    output_file = output_dir / f"{collection_name}.json"
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
    except IOError as e:
        print(f"  ✗ Error writing backup file: {e}")
        raise
    
    print(f"  ✓ Backed up {doc_count} documents to {output_file}")
    return doc_count


def get_all_collections(db):
    """Get all collection names from Firestore"""
    # Known collections in MICHELA
    collections = [
        'customers',      # User data
        'weights',        # Weight records
        'trainings',      # Training records
        'meals',          # Meal records
        'research_logs',  # Research logs
    ]
    
    # Filter only existing collections
    existing_collections = []
    for collection_name in collections:
        collection_ref = db.collection(collection_name)
        # Check if collection exists by trying to get first document
        try:
            # Create a new iterator for each check
            docs_iterator = collection_ref.limit(1).stream()
            first_doc = next(docs_iterator, None)
            if first_doc is not None:
                existing_collections.append(collection_name)
        except Exception as e:
            print(f"  ! Warning: Could not access collection '{collection_name}': {e}")
    
    return existing_collections


def create_backup_metadata(output_dir, environment, collections_backed_up, total_docs):
    """Create metadata file for the backup"""
    metadata = {
        'backup_date': datetime.now().isoformat(),
        'environment': environment,
        'collections': collections_backed_up,
        'total_documents': total_docs,
        'backup_version': '1.0'
    }
    
    metadata_file = output_dir / 'backup_metadata.json'
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Backup metadata saved to {metadata_file}")


def main():
    parser = argparse.ArgumentParser(
        description='Backup Firestore data for MICHELA'
    )
    parser.add_argument(
        '--environment',
        choices=['production', 'staging', 'prod', 'stg'],
        default='production',
        help='Environment to backup (default: production)'
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default=None,
        help='Output directory for backup files (default: backups/YYYY-MM-DD_HH-MM-SS)'
    )
    
    args = parser.parse_args()
    
    # Normalize environment name
    environment = 'production' if args.environment in ['production', 'prod'] else 'staging'
    
    # Create output directory
    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        output_dir = Path(__file__).parent / 'backups' / f"{environment}_{timestamp}"
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*60}")
    print(f"MICHELA Firestore Backup")
    print(f"{'='*60}")
    print(f"Environment: {environment}")
    print(f"Output directory: {output_dir}")
    print(f"{'='*60}\n")
    
    try:
        # Initialize Firebase
        db = initialize_firebase(environment)
        
        # Get all collections
        collections = get_all_collections(db)
        print(f"Found {len(collections)} collections to backup\n")
        
        # Backup each collection
        total_docs = 0
        for collection_name in collections:
            doc_count = backup_collection(db, collection_name, output_dir)
            total_docs += doc_count
        
        # Create metadata
        create_backup_metadata(output_dir, environment, collections, total_docs)
        
        print(f"\n{'='*60}")
        print(f"✓ Backup completed successfully!")
        print(f"  Total collections: {len(collections)}")
        print(f"  Total documents: {total_docs}")
        print(f"  Output directory: {output_dir}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n✗ Error during backup: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
