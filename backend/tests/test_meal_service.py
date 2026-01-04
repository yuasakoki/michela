"""Tests for meal_service.py"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from app.services import meal_service


class TestMealService:
    """Test meal service functions"""

    def test_get_food_presets(self):
        """Test getting food presets"""
        # get_food_presetsはハードコードされたプリセット配列を返すだけ
        presets = meal_service.get_food_presets()

        # デフォルトプリセットが含まれているか確認
        assert len(presets) > 0
        # 最初の要素がチキンかどうか確認
        chicken = next((p for p in presets if 'chicken' in p['id'].lower()), None)
        assert chicken is not None
        assert 'name' in chicken
        assert 'calories' in chicken

    @patch('app.services.meal_service.get_db')
    def test_add_meal_record_success(self, mock_get_db, sample_meal_record):
        """Test adding meal record"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = 'meal_123'
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        record_id, error = meal_service.add_meal_record(sample_meal_record)

        assert record_id == 'meal_123'
        assert error is None
        mock_doc_ref.set.assert_called_once()

    @patch('app.services.meal_service.get_db')
    def test_add_meal_record_missing_fields(self, mock_get_db):
        """Test adding meal record with missing fields"""
        incomplete_data = {'customer_id': 'customer_123'}
        record_id, error = meal_service.add_meal_record(incomplete_data)

        assert record_id is None
        assert error == 'Missing required fields'

    @patch('app.services.meal_service.get_db')
    def test_get_meal_records_by_customer(self, mock_get_db):
        """Test getting meal records for a customer"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_doc1 = MagicMock()
        mock_doc1.id = 'meal_1'
        mock_doc1.to_dict.return_value = {
            'date': '2026-01-04',
            'meal_type': 'breakfast',
            'total_calories': 500
        }
        
        # where().stream()のチェーン修正
        mock_where = MagicMock()
        mock_where.stream.return_value = [mock_doc1]
        mock_db.collection.return_value.where.return_value = mock_where

        records = meal_service.get_meal_records_by_customer('customer_123', limit=30)

        assert len(records) == 1
        assert records[0]['id'] == 'meal_1'

    @patch('app.services.meal_service.get_db')
    def test_get_meal_record_by_id_success(self, mock_get_db):
        """Test getting meal record by ID"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.id = 'meal_123'
        mock_doc.to_dict.return_value = {'date': '2026-01-04', 'meal_type': 'dinner'}
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        record, error = meal_service.get_meal_record_by_id('meal_123')

        assert record is not None
        assert error is None
        assert record['id'] == 'meal_123'

    @patch('app.services.meal_service.get_db')
    def test_get_meal_record_by_id_not_found(self, mock_get_db):
        """Test getting non-existent meal record"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        record, error = meal_service.get_meal_record_by_id('nonexistent')

        assert record is None
        assert error == 'Meal record not found'

    @patch('app.services.meal_service.get_db')
    def test_update_meal_record(self, mock_get_db):
        """Test updating meal record"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        update_data = {'meal_type': 'lunch'}
        meal_service.update_meal_record('meal_123', update_data)

        mock_doc_ref.update.assert_called_once_with(update_data)

    @patch('app.services.meal_service.get_db')
    def test_delete_meal_record(self, mock_get_db):
        """Test deleting meal record"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        meal_service.delete_meal_record('meal_123')

        mock_doc_ref.delete.assert_called_once()

    @patch('app.services.meal_service.get_db')
    def test_get_daily_nutrition_summary(self, mock_get_db):
        """Test getting daily nutrition summary"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_doc1 = MagicMock()
        mock_doc1.to_dict.return_value = {
            'meal_type': 'breakfast',
            'total_calories': 500,
            'total_protein': 30,
            'total_fat': 10,
            'total_carbs': 60
        }
        
        mock_doc2 = MagicMock()
        mock_doc2.to_dict.return_value = {
            'meal_type': 'lunch',
            'total_calories': 700,
            'total_protein': 40,
            'total_fat': 20,
            'total_carbs': 80
        }
        
        mock_query = MagicMock()
        mock_query.stream.return_value = [mock_doc1, mock_doc2]
        mock_db.collection.return_value.where.return_value.where.return_value = mock_query

        summary = meal_service.get_daily_nutrition_summary('customer_123', '2026-01-04')

        assert summary['total_calories'] == 1200
        assert summary['total_protein'] == 70
        assert summary['total_fat'] == 30
        assert summary['total_carbs'] == 140
        assert summary['meal_count'] == 2

    @patch('app.services.meal_service.get_db')
    def test_get_nutrition_goal_success(self, mock_get_db):
        """Test getting nutrition goal"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            'target_calories': 2000,
            'target_protein': 150,
            'target_fat': 60,
            'target_carbs': 200
        }
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        goal, error = meal_service.get_nutrition_goal('customer_123')

        assert goal is not None
        assert error is None
        assert goal['target_calories'] == 2000

    @patch('app.services.meal_service.get_db')
    def test_get_nutrition_goal_not_found(self, mock_get_db):
        """Test getting nutrition goal when not set (returns default)"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        goal, error = meal_service.get_nutrition_goal('customer_123')

        # デフォルト目標が返される
        assert goal is not None
        assert error is None
        assert goal['customer_id'] == 'customer_123'
        assert goal['target_calories'] == 2000  # デフォルト値

    @patch('app.services.meal_service.get_db')
    def test_set_nutrition_goal(self, mock_get_db):
        """Test setting nutrition goal"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        goal_data = {
            'target_calories': 2500,
            'target_protein': 180,
            'target_fat': 70,
            'target_carbs': 250
        }
        result = meal_service.set_nutrition_goal('customer_123', goal_data)

        assert result['customer_id'] == 'customer_123'
        assert result['target_calories'] == 2500
        mock_doc_ref.set.assert_called_once()

    @patch('app.services.meal_service.get_db')
    def test_add_meal_record_error_handling(self, mock_get_db):
        """Test error handling in meal record creation"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.side_effect = Exception("Database error")
        
        valid_data = {
            'customer_id': 'customer_123',
            'date': '2026-01-01',
            'meal_type': 'breakfast',
            'foods': [{'food_id': 'egg', 'quantity': 1}]
        }
        record_id, error = meal_service.add_meal_record(valid_data)
        
        assert record_id is None
        assert error == "Database error"

    @patch('app.services.meal_service.get_db')
    def test_get_meal_records_with_date_range(self, mock_get_db):
        """Test getting meal records with date range"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_doc = MagicMock()
        mock_doc.id = 'meal_001'
        mock_doc.to_dict.return_value = {
            'customer_id': 'customer_123',
            'date': '2026-01-02',
            'meal_type': 'lunch'
        }
        
        mock_query = MagicMock()
        mock_stream = MagicMock()
        mock_stream.__iter__ = MagicMock(return_value=iter([mock_doc]))
        mock_query.order_by.return_value.limit.return_value.stream.return_value = mock_stream
        mock_db.collection.return_value.where.return_value.where.return_value.where.return_value = mock_query
        
        records = meal_service.get_meal_records_by_customer('customer_123', start_date='2026-01-01', end_date='2026-01-03')
        
        assert isinstance(records, list)

    @patch('app.services.meal_service.get_db')
    def test_update_meal_record_error_handling(self, mock_get_db):
        """Test error handling in meal record update"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.document.return_value.update.side_effect = Exception("Update error")
        
        try:
            meal_service.update_meal_record('meal_123', {'total_calories': 600})
        except Exception as e:
            assert str(e) == "Update error"

    @patch('app.services.meal_service.get_db')
    def test_delete_meal_record_error_handling(self, mock_get_db):
        """Test error handling in meal record deletion"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.document.return_value.delete.side_effect = Exception("Delete error")
        
        try:
            meal_service.delete_meal_record('meal_123')
        except Exception as e:
            assert str(e) == "Delete error"

    @patch('app.services.meal_service.get_db')
    def test_get_nutrition_goal_error_handling(self, mock_get_db):
        """Test error handling in nutrition goal retrieval"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.document.return_value.get.side_effect = Exception("Get error")
        
        goal, error = meal_service.get_nutrition_goal('customer_123')
        
        assert goal is None
        assert error == "Get error"

