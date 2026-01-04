"""Tests for training_service.py"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from app.services import training_service


class TestTrainingService:
    """Test training service functions"""

    @patch('app.services.training_service.get_db')
    def test_get_exercise_presets(self, mock_get_db):
        """Test getting exercise presets"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_doc1 = MagicMock()
        mock_doc1.id = 'custom_ex_001'
        mock_doc1.to_dict.return_value = {'id': 'custom_ex_001', 'name': 'カスタムベンチ', 'category': '胸'}
        
        mock_db.collection.return_value.stream.return_value = [mock_doc1]

        # Execute
        presets = training_service.get_exercise_presets()

        # Assert - デフォルトプリセット + カスタム1件
        assert len(presets) >= 1  # カスタム1件は最低含まれる
        # カスタム種目が含まれているか確認
        custom_found = any(p['id'] == 'custom_ex_001' for p in presets)
        assert custom_found

    @patch('app.services.training_service.get_db')
    def test_add_exercise_preset(self, mock_get_db):
        """Test adding custom exercise preset"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = 'ex_new'
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        exercise_id, error = training_service.add_exercise_preset('カスタム種目', '背中')

        # Assert
        assert exercise_id == 'ex_new'
        assert error is None
        mock_doc_ref.set.assert_called_once()

    @patch('app.services.training_service.get_db')
    def test_add_training_session_success(self, mock_get_db, sample_training_session):
        """Test adding training session"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = 'session_123'
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        session_id, error = training_service.add_training_session(sample_training_session)

        # Assert
        assert session_id == 'session_123'
        assert error is None
        mock_doc_ref.set.assert_called_once()

    @patch('app.services.training_service.get_db')
    def test_add_training_session_missing_fields(self, mock_get_db):
        """Test adding training session with missing fields"""
        # Execute with incomplete data
        incomplete_data = {'customer_id': 'customer_123'}
        session_id, error = training_service.add_training_session(incomplete_data)

        # Assert
        assert session_id is None
        assert error == 'Missing required fields'

    @patch('app.services.training_service.get_db')
    def test_get_training_sessions_by_customer(self, mock_get_db):
        """Test getting training sessions for a customer"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_doc1 = MagicMock()
        mock_doc1.id = 'session_1'
        mock_doc1.to_dict.return_value = {
            'date': '2026-01-01',
            'exercises': [{'exercise_name': 'ベンチプレス'}]
        }
        
        # where().stream()のチェーン修正
        mock_where = MagicMock()
        mock_where.stream.return_value = [mock_doc1]
        mock_db.collection.return_value.where.return_value = mock_where

        # Execute
        sessions = training_service.get_training_sessions_by_customer('customer_123', limit=10)

        # Assert
        assert len(sessions) == 1
        assert sessions[0]['id'] == 'session_1'

    @patch('app.services.training_service.get_db')
    def test_get_training_session_by_id_success(self, mock_get_db):
        """Test getting training session by ID"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.id = 'session_123'
        mock_doc.to_dict.return_value = {'date': '2026-01-04', 'exercises': []}
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        # Execute
        session, error = training_service.get_training_session_by_id('session_123')

        # Assert
        assert session is not None
        assert error is None
        assert session['id'] == 'session_123'

    @patch('app.services.training_service.get_db')
    def test_get_training_session_by_id_not_found(self, mock_get_db):
        """Test getting non-existent training session"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

        # Execute
        session, error = training_service.get_training_session_by_id('nonexistent')

        # Assert
        assert session is None
        assert error == 'Training session not found'

    @patch('app.services.training_service.get_db')
    def test_update_training_session(self, mock_get_db):
        """Test updating training session"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        update_data = {'date': '2026-01-05'}
        training_service.update_training_session('session_123', update_data)

        # Assert
        mock_doc_ref.update.assert_called_once_with(update_data)

    @patch('app.services.training_service.get_db')
    def test_delete_training_session(self, mock_get_db):
        """Test deleting training session"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        training_service.delete_training_session('session_123')

        # Assert
        mock_doc_ref.delete.assert_called_once()

    @patch('app.services.training_service.get_db')
    def test_delete_exercise_preset(self, mock_get_db):
        """Test deleting exercise preset"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        error = training_service.delete_exercise_preset('ex_001')

        # Assert
        assert error is None
        mock_doc_ref.delete.assert_called_once()

    @patch('app.services.training_service.get_db')
    def test_get_exercise_history(self, mock_get_db):
        """Test getting exercise history"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_session = MagicMock()
        mock_session.id = 'session_1'
        mock_session.to_dict.return_value = {
            'date': '2026-01-01',
            'exercises': [
                {
                    'exercise_id': 'ex_001',
                    'exercise_name': 'ベンチプレス',
                    'sets': [{'reps': 10, 'weight': 60}]
                },
                {
                    'exercise_id': 'ex_002',
                    'exercise_name': 'スクワット',
                    'sets': [{'reps': 8, 'weight': 100}]
                }
            ]
        }
        
        # where().stream()のチェーン修正
        mock_where = MagicMock()
        mock_where.stream.return_value = [mock_session]
        mock_db.collection.return_value.where.return_value = mock_where

        # Execute
        history = training_service.get_exercise_history('customer_123', 'ex_001', limit=10)

        # Assert
        assert len(history) == 1
        assert history[0]['date'] == '2026-01-01'
        assert history[0]['exercise']['exercise_name'] == 'ベンチプレス'

    @patch('app.services.training_service.get_db')
    def test_add_training_session_error_handling(self, mock_get_db):
        """Test error handling in training session creation"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.side_effect = Exception("Database error")
        
        valid_data = {
            'customer_id': 'customer_123',
            'date': '2026-01-01',
            'exercises': [{'exercise_id': 'bench_press', 'sets': [{'reps': 10, 'weight': 60}]}]
        }
        session_id, error = training_service.add_training_session(valid_data)
        
        assert session_id is None
        assert error == "Database error"

    @patch('app.services.training_service.get_db')
    def test_update_training_session_error_handling(self, mock_get_db):
        """Test error handling in training session update"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.document.return_value.update.side_effect = Exception("Update error")
        
        try:
            training_service.update_training_session('session_123', {'date': '2026-01-02'})
        except Exception as e:
            assert str(e) == "Update error"

    @patch('app.services.training_service.get_db')
    def test_delete_training_session_error_handling(self, mock_get_db):
        """Test error handling in training session deletion"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.document.return_value.delete.side_effect = Exception("Delete error")
        
        try:
            training_service.delete_training_session('session_123')
        except Exception as e:
            assert str(e) == "Delete error"

    @patch('app.services.training_service.get_db')
    def test_add_exercise_preset_error_handling(self, mock_get_db):
        """Test error handling in exercise preset creation"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.side_effect = Exception("Preset error")
        
        exercise_id, error = training_service.add_exercise_preset('New Exercise', 'chest')
        
        assert exercise_id is None
        assert error == "Preset error"

    @patch('app.services.training_service.get_db')
    def test_delete_exercise_preset_error_handling(self, mock_get_db):
        """Test error handling in exercise preset deletion"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.document.return_value.delete.side_effect = Exception("Delete preset error")
        
        error = training_service.delete_exercise_preset('ex_001')
        
        assert error == "Delete preset error"

    @patch('app.services.training_service.get_db')
    def test_get_training_session_by_id_error_handling(self, mock_get_db):
        """Test error handling in session retrieval"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.document.return_value.get.side_effect = Exception("Get error")
        
        session, error = training_service.get_training_session_by_id('session_123')
        
        assert session is None
        assert error == "Get error"

