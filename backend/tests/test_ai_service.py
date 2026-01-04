"""Tests for ai_service.py"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime, timedelta
import hashlib
from app.services import ai_service


class TestAIService:
    """Test AI service functions"""

    def test_get_cache_key(self):
        """Test cache key generation"""
        message = "Test message"
        key1 = ai_service._get_cache_key(message)
        key2 = ai_service._get_cache_key(message)
        key3 = ai_service._get_cache_key("Different message")
        
        assert key1 == key2
        assert key1 != key3
        assert len(key1) == 32

    def test_save_and_get_cache(self):
        """Test saving and retrieving from cache"""
        ai_service._cache.clear()
        message = "Test message"
        response = "Test response"
        cache_key = ai_service._get_cache_key(message)
        
        ai_service._save_to_cache(cache_key, response)
        retrieved, expires_at = ai_service._get_from_cache(cache_key)
        
        assert retrieved == response
        assert expires_at > datetime.now()

    def test_cache_expiration(self):
        """Test cache expiration"""
        ai_service._cache.clear()
        cache_key = "test_key"
        
        ai_service._cache[cache_key] = {
            'response': 'old_response',
            'expires_at': datetime.now() - timedelta(minutes=1)
        }
        
        retrieved, expires_at = ai_service._get_from_cache(cache_key)
        assert retrieved is None
        assert expires_at is None

    @patch('app.services.ai_service.GEMINI_API_KEY', 'test_key_12345')
    @patch('app.services.ai_service.genai.GenerativeModel')
    def test_chat_with_ai_success(self, mock_model_class):
        """Test successful AI chat"""
        ai_service._cache.clear()
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = 'AI response text'
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        text, error, cached_until = ai_service.chat_with_ai("Test prompt", use_cache=False)
        
        assert text == 'AI response text'
        assert error is None
        assert cached_until is None

    @patch('app.services.ai_service.GEMINI_API_KEY', '')
    def test_chat_with_ai_no_api_key(self):
        """Test AI chat without API key"""
        text, error, cached_until = ai_service.chat_with_ai("Test")
        
        assert text is None
        assert 'not configured' in error
        assert cached_until is None

    @patch('app.services.ai_service.GEMINI_API_KEY', 'test_key_12345')
    @patch('app.services.ai_service.genai.GenerativeModel')
    def test_chat_with_ai_error_handling(self, mock_model_class):
        """Test AI chat with exception"""
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_model_class.return_value = mock_model
        
        text, error, cached_until = ai_service.chat_with_ai("Test prompt", use_cache=False)
        
        assert text is None
        assert error == "API Error"
        assert cached_until is None

    @patch('app.services.ai_service.GEMINI_API_KEY', 'test_key_12345')
    @patch('app.services.ai_service.genai.GenerativeModel')
    def test_chat_with_ai_with_cache_hit(self, mock_model_class):
        """Test AI chat with cache hit"""
        ai_service._cache.clear()
        
        # First call - cache miss
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = 'Cached response'
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        text1, error1, cached1 = ai_service.chat_with_ai("Test prompt", use_cache=True)
        assert text1 == 'Cached response'
        assert cached1 is None  # First call doesn't return cache time
        
        # Second call - cache hit
        text2, error2, cached2 = ai_service.chat_with_ai("Test prompt", use_cache=True)
        assert text2 == 'Cached response'
        assert cached2 is not None
        assert error2 is None

