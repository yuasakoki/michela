"""Tests for user_service.py"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from app.services import user_service


class TestUserService:
    """Test user service functions"""

    def test_hash_password(self):
        """Test password hashing"""
        password = 'testpassword123'
        hashed = user_service.hash_password(password)
        
        # Assert hash is consistent
        assert hashed == user_service.hash_password(password)
        # Assert hash is different from original
        assert hashed != password
        # Assert hash is SHA-256 length (64 hex chars)
        assert len(hashed) == 64

    @patch('app.services.user_service._get_db')
    def test_create_user_success(self, mock_get_db, sample_user_data):
        """Test successful user creation"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = []
        
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = 'user_123'
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        user_id, error = user_service.create_user(
            sample_user_data['username'],
            sample_user_data['password'],
            sample_user_data['role'],
            sample_user_data['email']
        )

        # Assert
        assert user_id == 'user_123'
        assert error is None
        mock_doc_ref.set.assert_called_once()

    @patch('app.services.user_service._get_db')
    def test_create_user_duplicate_username(self, mock_get_db):
        """Test creating user with duplicate username"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        # Mock existing user
        mock_existing_user = MagicMock()
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = [
            mock_existing_user
        ]

        # Execute
        user_id, error = user_service.create_user('existinguser', 'password123')

        # Assert
        assert user_id is None
        assert error == 'Username already exists'

    @patch('app.services.user_service._get_db')
    def test_authenticate_user_success(self, mock_get_db):
        """Test successful user authentication"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_user_doc = MagicMock()
        mock_user_doc.id = 'user_123'
        mock_user_doc.to_dict.return_value = {
            'username': 'testuser',
            'password_hash': user_service.hash_password('correctpassword'),
            'role': 0,
            'email': 'test@example.com'
        }
        
        mock_db.collection.return_value.where.return_value.where.return_value.limit.return_value.stream.return_value = [
            mock_user_doc
        ]

        # Execute
        user_data, error = user_service.authenticate_user('testuser', 'correctpassword')

        # Assert
        assert user_data is not None
        assert error is None
        assert user_data['id'] == 'user_123'
        assert user_data['username'] == 'testuser'
        assert 'password_hash' not in user_data  # Should be removed

    @patch('app.services.user_service._get_db')
    def test_authenticate_user_wrong_password(self, mock_get_db):
        """Test authentication with wrong password"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_user_doc = MagicMock()
        mock_user_doc.id = 'user_123'
        mock_user_doc.to_dict.return_value = {
            'username': 'testuser',
            'password_hash': user_service.hash_password('correctpassword'),
            'role': 0
        }
        
        mock_db.collection.return_value.where.return_value.where.return_value.limit.return_value.stream.return_value = [
            mock_user_doc
        ]

        # Execute
        user_data, error = user_service.authenticate_user('testuser', 'wrongpassword')

        # Assert
        assert user_data is None
        assert error == 'Invalid username or password'

    @patch('app.services.user_service._get_db')
    def test_authenticate_user_not_found(self, mock_get_db):
        """Test authentication with non-existent user"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.where.return_value.where.return_value.limit.return_value.stream.return_value = []

        # Execute
        user_data, error = user_service.authenticate_user('nonexistent', 'password')

        # Assert
        assert user_data is None
        assert error == 'Invalid username or password'

    @patch('app.services.user_service._get_db')
    def test_get_all_users(self, mock_get_db):
        """Test getting all users"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_user1 = MagicMock()
        mock_user1.id = 'user_1'
        mock_user1.to_dict.return_value = {
            'username': 'user1',
            'password_hash': 'hash1',
            'role': 0
        }
        
        mock_user2 = MagicMock()
        mock_user2.id = 'user_2'
        mock_user2.to_dict.return_value = {
            'username': 'user2',
            'password_hash': 'hash2',
            'role': 1
        }
        
        mock_db.collection.return_value.stream.return_value = [mock_user1, mock_user2]

        # Execute
        users = user_service.get_all_users()

        # Assert
        assert len(users) == 2
        assert users[0]['id'] == 'user_1'
        assert 'password_hash' not in users[0]  # Should be removed
        assert users[1]['role'] == 1

    @patch('app.services.user_service._get_db')
    def test_update_user_success(self, mock_get_db):
        """Test updating user"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = []
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        update_data = {'username': 'newusername', 'password': 'newpass', 'role': 1}
        error = user_service.update_user('user_123', update_data)

        # Assert
        assert error is None
        mock_doc_ref.update.assert_called_once()

    @patch('app.services.user_service._get_db')
    def test_update_user_duplicate_username(self, mock_get_db):
        """Test updating to duplicate username"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        # Mock existing user with same username
        mock_existing = MagicMock()
        mock_existing.id = 'other_user_id'
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = [
            mock_existing
        ]

        # Execute
        error = user_service.update_user('user_123', {'username': 'existingname'})

        # Assert
        assert error == 'Username already exists'

    @patch('app.services.user_service._get_db')
    def test_delete_user(self, mock_get_db):
        """Test deleting user (logical delete)"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        error = user_service.delete_user('user_123')

        # Assert
        assert error is None
        mock_doc_ref.update.assert_called_once()
        # Check that is_active was set to False
        call_args = mock_doc_ref.update.call_args[0][0]
        assert call_args['is_active'] is False

    @patch('app.services.user_service._get_db')
    def test_initialize_default_users(self, mock_get_db):
        """Test initializing default users"""
        # Setup mocks
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        # Mock no existing users
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = []
        
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = 'default_user_id'
        mock_db.collection.return_value.document.return_value = mock_doc_ref

        # Execute
        user_service.initialize_default_users()

        # Assert - should create 2 users (admin + user)
        assert mock_doc_ref.set.call_count == 2

    @patch('app.services.user_service._get_db')
    def test_update_user_with_password_change(self, mock_get_db):
        """Test updating user with password change"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = []
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref
        
        update_data = {'password': 'new_password_123'}
        error = user_service.update_user('user_123', update_data)
        
        assert error is None
        mock_doc_ref.update.assert_called_once()

    @patch('app.services.user_service._get_db')
    def test_update_user_with_role_and_email(self, mock_get_db):
        """Test updating user role and email"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = []
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref
        
        update_data = {'role': 1, 'email': 'updated@example.com', 'is_active': True}
        error = user_service.update_user('user_123', update_data)
        
        assert error is None
        mock_doc_ref.update.assert_called_once()

    @patch('app.services.user_service._get_db')
    def test_create_user_error_handling(self, mock_get_db):
        """Test error handling in user creation"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.where.side_effect = Exception("Database error")
        
        user_id, error = user_service.create_user('test', 'pass')
        
        assert user_id is None
        assert error == "Database error"

    @patch('app.services.user_service._get_db')
    def test_authenticate_user_error_handling(self, mock_get_db):
        """Test error handling in authentication"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.where.side_effect = Exception("Auth error")
        
        user_data, error = user_service.authenticate_user('user', 'pass')
        
        assert user_data is None
        assert error == "Auth error"

    @patch('app.services.user_service._get_db')
    def test_update_user_error_handling(self, mock_get_db):
        """Test error handling in user update"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.where.side_effect = Exception("Update error")
        
        error = user_service.update_user('user_123', {'username': 'new'})
        
        assert error == "Update error"

    @patch('app.services.user_service._get_db')
    def test_delete_user_error_handling(self, mock_get_db):
        """Test error handling in user deletion"""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.collection.return_value.document.return_value.update.side_effect = Exception("Delete error")
        
        error = user_service.delete_user('user_123')
        
        assert error == "Delete error"

