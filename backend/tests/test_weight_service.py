"""Tests for weight_service.py"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from app.services import weight_service


class TestWeightService:
    """Test weight service functions"""

    @patch('app.services.weight_service.get_db')
    def test_get_weight_history(self, mock_get_db):
        """Test getting weight history for a customer"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_doc1 = MagicMock()
        mock_doc1.id = 'weight_1'
        mock_doc1.to_dict.return_value = {
            'weight': 70.5,
            'recorded_at': '2026-01-01T10:00:00',
            'note': 'テスト記録1'
        }
        
        mock_doc2 = MagicMock()
        mock_doc2.id = 'weight_2'
        mock_doc2.to_dict.return_value = {
            'weight': 69.8,
            'recorded_at': '2026-01-02T10:00:00',
            'note': 'テスト記録2'
        }
        
        # クエリチェーンの修正: where().stream()
        mock_collection = MagicMock()
        mock_where = MagicMock()
        mock_where.stream.return_value = [mock_doc1, mock_doc2]
        mock_collection.where.return_value = mock_where
        mock_db.collection.return_value = mock_collection

        # Execute
        history = weight_service.get_weight_history('customer_123', limit=10)

        # Assert
        assert len(history) == 2
        assert history[0]['id'] == 'weight_2'  # 新しい順にソート
        assert history[0]['weight'] == 69.8
        assert history[1]['id'] == 'weight_1'
        assert history[1]['weight'] == 70.5

    @patch('app.services.weight_service.get_db')
    def test_add_weight_record_with_timestamp(self, mock_get_db):
        """Test adding weight record with specific timestamp"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = 'weight_new'
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        record_id = weight_service.add_weight_record(
            'customer_123',
            72.5,
            '2026-01-04T09:00:00',
            'テストメモ'
        )

        # Assert
        assert record_id == 'weight_new'
        mock_doc_ref.set.assert_called_once()
        call_data = mock_doc_ref.set.call_args[0][0]
        assert call_data['customer_id'] == 'customer_123'
        assert call_data['weight'] == 72.5
        assert call_data['recorded_at'] == '2026-01-04T09:00:00'
        assert call_data['note'] == 'テストメモ'

    @patch('app.services.weight_service.get_db')
    def test_add_weight_record_without_timestamp(self, mock_get_db):
        """Test adding weight record without timestamp (uses current time)"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = 'weight_new'
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        record_id = weight_service.add_weight_record('customer_123', 71.0)

        # Assert
        assert record_id == 'weight_new'
        mock_doc_ref.set.assert_called_once()
        call_data = mock_doc_ref.set.call_args[0][0]
        assert call_data['customer_id'] == 'customer_123'
        assert call_data['weight'] == 71.0
        assert 'recorded_at' in call_data  # Should have timestamp
        assert call_data['note'] == ''

    @patch('app.services.weight_service.get_db')
    def test_get_weight_history_empty(self, mock_get_db):
        """Test getting weight history with no records"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_query = MagicMock()
        mock_query.stream.return_value = []
        mock_db.collection.return_value.where.return_value.order_by.return_value.limit.return_value = mock_query

        # Execute
        history = weight_service.get_weight_history('customer_no_records', limit=10)

        # Assert
        assert len(history) == 0
        assert history == []

    @patch('app.services.weight_service.get_db')
    def test_add_weight_record_error_handling(self, mock_get_db):
        """Test error handling in weight record addition"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.side_effect = Exception("Database error")
        
        try:
            weight_service.add_weight_record('customer_123', 70.0)
        except Exception as e:
            assert str(e) == "Database error"

    @patch('app.services.weight_service.get_db')
    def test_get_weight_history_error_handling(self, mock_get_db):
        """Test error handling in weight history retrieval"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.where.side_effect = Exception("Query error")
        
        try:
            weight_service.get_weight_history('customer_123')
        except Exception as e:
            assert str(e) == "Query error"

