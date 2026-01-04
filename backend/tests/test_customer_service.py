"""Tests for customer_service.py"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from app.services import customer_service


class TestCustomerService:
    """Test customer service functions"""

    @patch('app.services.customer_service.get_db')
    def test_register_customer_success(self, mock_get_db, sample_customer_data):
        """Test successful customer registration"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = 'customer_123'
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        customer_id, error = customer_service.register_customer(sample_customer_data)

        # Assert
        assert customer_id == 'customer_123'
        assert error is None
        assert mock_db.collection.call_count == 2  # customer + weight_history
        mock_doc_ref.set.assert_called()

    @patch('app.services.customer_service.get_db')
    def test_register_customer_missing_fields(self, mock_get_db):
        """Test customer registration with missing required fields"""
        # Setup
        incomplete_data = {'name': 'テスト太郎'}
        
        # Execute
        customer_id, error = customer_service.register_customer(incomplete_data)

        # Assert
        assert customer_id is None
        assert error == 'Missing required fields'

    @patch('app.services.customer_service.get_db')
    def test_get_all_customers(self, mock_get_db):
        """Test getting all customers"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_doc1 = MagicMock()
        mock_doc1.id = 'customer_1'
        mock_doc1.to_dict.return_value = {'name': '顧客1', 'age': 25}
        
        mock_doc2 = MagicMock()
        mock_doc2.id = 'customer_2'
        mock_doc2.to_dict.return_value = {'name': '顧客2', 'age': 30}
        
        mock_db.collection.return_value.stream.return_value = [mock_doc1, mock_doc2]

        # Execute
        customers = customer_service.get_all_customers()

        # Assert
        assert len(customers) == 2
        assert customers[0]['id'] == 'customer_1'
        assert customers[0]['name'] == '顧客1'
        assert customers[1]['id'] == 'customer_2'

    @patch('app.services.customer_service.get_db')
    def test_get_customer_by_id_success(self, mock_get_db):
        """Test getting customer by ID successfully"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.id = 'customer_123'
        mock_doc.to_dict.return_value = {'name': 'テスト太郎', 'age': 30}
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        # Execute
        customer, error = customer_service.get_customer_by_id('customer_123')

        # Assert
        assert customer is not None
        assert error is None
        assert customer['id'] == 'customer_123'
        assert customer['name'] == 'テスト太郎'

    @patch('app.services.customer_service.get_db')
    def test_get_customer_by_id_not_found(self, mock_get_db):
        """Test getting non-existent customer"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        # Execute
        customer, error = customer_service.get_customer_by_id('nonexistent')

        # Assert
        assert customer is None
        assert error == 'Customer not found'

    @patch('app.services.customer_service.get_db')
    def test_update_customer_without_weight(self, mock_get_db):
        """Test updating customer without weight change"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        update_data = {'name': '更新太郎', 'age': 31}
        customer_service.update_customer('customer_123', update_data)

        # Assert
        mock_doc_ref.update.assert_called_once_with(update_data)

    @patch('app.services.customer_service.get_db')
    def test_update_customer_with_weight(self, mock_get_db):
        """Test updating customer with weight change (creates history)"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        update_data = {'weight': 75.5}
        customer_service.update_customer('customer_123', update_data)

        # Assert
        mock_doc_ref.update.assert_called_once()
        assert mock_db.collection.call_count == 2  # customer + weight_history

    @patch('app.services.customer_service.get_db')
    def test_delete_customer(self, mock_get_db):
        """Test deleting customer and related weight history"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        # Mock weight history documents
        mock_weight_doc1 = MagicMock()
        mock_weight_doc2 = MagicMock()
        mock_db.collection.return_value.where.return_value.stream.return_value = [
            mock_weight_doc1, mock_weight_doc2
        ]
        
        mock_customer_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_customer_ref

        # Execute
        result = customer_service.delete_customer('customer_123')

        # Assert
        assert result is True
        mock_weight_doc1.reference.delete.assert_called_once()
        mock_weight_doc2.reference.delete.assert_called_once()
        mock_customer_ref.delete.assert_called_once()

    @patch('app.services.customer_service.get_db')
    def test_register_customer_error_handling(self, mock_get_db):
        """Test error handling in customer registration"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.side_effect = Exception("Database error")
        
        valid_data = {
            'name': 'Test User',
            'age': 25,
            'height': 170.0,
            'weight': 70.0,
            'favorite_food': 'Chicken',
            'completion_date': '2026-06-01'
        }
        customer_id, error = customer_service.register_customer(valid_data)
        
        assert customer_id is None
        assert error == "Database error"

    @patch('app.services.customer_service.get_db')
    def test_get_customer_by_id_error_handling(self, mock_get_db):
        """Test error handling in customer retrieval"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.document.return_value.get.side_effect = Exception("Get error")
        
        customer, error = customer_service.get_customer_by_id('customer_123')
        
        assert customer is None
        assert error == "Get error"

    @patch('app.services.customer_service.get_db')
    def test_update_customer_error_handling(self, mock_get_db):
        """Test error handling in customer update"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.document.return_value.update.side_effect = Exception("Update error")
        
        try:
            customer_service.update_customer('customer_123', {'name': 'Updated Name'})
        except Exception as e:
            assert str(e) == "Update error"

    @patch('app.services.customer_service.get_db')
    def test_delete_customer_error_handling(self, mock_get_db):
        """Test error handling in customer deletion"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.where.side_effect = Exception("Delete error")
        
        try:
            customer_service.delete_customer('customer_123')
        except Exception as e:
            assert str(e) == "Delete error"

