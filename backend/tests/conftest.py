"""Pytest configuration and fixtures"""
import pytest
from unittest.mock import Mock, MagicMock
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))


@pytest.fixture
def mock_firestore_client():
    """Mock Firestore client"""
    mock_client = MagicMock()
    return mock_client


@pytest.fixture
def mock_collection():
    """Mock Firestore collection"""
    mock_coll = MagicMock()
    return mock_coll


@pytest.fixture
def mock_document():
    """Mock Firestore document"""
    mock_doc = MagicMock()
    mock_doc.id = 'test_doc_id_123'
    return mock_doc


@pytest.fixture
def sample_customer_data():
    """Sample customer data for testing"""
    return {
        'name': 'テスト太郎',
        'age': 30,
        'height': 170.5,
        'weight': 70.0,
        'favorite_food': 'チキン',
        'completion_date': '2026-06-01'
    }


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        'username': 'testuser',
        'password': 'testpass123',
        'role': 0,
        'email': 'test@example.com'
    }


@pytest.fixture
def sample_training_session():
    """Sample training session data"""
    return {
        'customer_id': 'customer_123',
        'date': '2026-01-04',
        'exercises': [
            {
                'exercise_id': 'ex_001',
                'exercise_name': 'ベンチプレス',
                'sets': [
                    {'reps': 10, 'weight': 60.0},
                    {'reps': 8, 'weight': 70.0}
                ]
            }
        ]
    }


@pytest.fixture
def sample_meal_record():
    """Sample meal record data"""
    return {
        'customer_id': 'customer_123',
        'date': '2026-01-04',
        'meal_type': 'breakfast',
        'foods': [
            {
                'food_id': 'food_001',
                'food_name': '鶏むね肉',
                'quantity': 100.0,
                'calories': 105.0,
                'protein': 23.0,
                'fat': 1.5,
                'carbs': 0.0
            }
        ],
        'total_calories': 105.0,
        'total_protein': 23.0,
        'total_fat': 1.5,
        'total_carbs': 0.0
    }
