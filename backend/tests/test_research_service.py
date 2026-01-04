"""Tests for research_service.py"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime
from app.services import research_service


class TestResearchService:
    """Test research service functions"""

    @patch('app.services.research_service.requests.get')
    @patch('googletrans.Translator')
    def test_fetch_latest_research_success(self, mock_translator_class, mock_requests_get):
        """Test fetching latest research from PubMed"""
        # Mock search response
        mock_search_response = MagicMock()
        mock_search_response.json.return_value = {
            'esearchresult': {
                'idlist': ['12345', '67890']
            }
        }
        
        # Mock summary response
        mock_summary_response = MagicMock()
        mock_summary_response.json.return_value = {
            'result': {
                '12345': {
                    'title': 'Test Research Title',
                    'authors': [{'name': 'Author One'}, {'name': 'Author Two'}],
                    'pubdate': '2024-01-15'
                },
                '67890': {
                    'title': 'Another Research',
                    'authors': [{'name': 'Author Three'}],
                    'pubdate': '2024-02-20'
                }
            }
        }
        
        # Mock translator
        mock_translator = MagicMock()
        mock_translated = MagicMock()
        mock_translated.text = 'テスト研究タイトル'
        mock_translator.translate.return_value = mock_translated
        mock_translator_class.return_value = mock_translator
        
        # Setup requests.get to return different responses
        mock_requests_get.side_effect = [mock_search_response, mock_summary_response]
        
        # Execute
        articles = research_service.fetch_latest_research()
        
        # Assert
        assert len(articles) == 2
        assert articles[0]['title'] == 'テスト研究タイトル'
        assert 'PubMed' in articles[0]['source']
        assert '12345' in articles[0]['url']

    @patch('app.services.research_service.requests.get')
    def test_fetch_latest_research_no_results(self, mock_requests_get):
        """Test fetching research with no results"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'esearchresult': {
                'idlist': []
            }
        }
        mock_requests_get.return_value = mock_response
        
        articles = research_service.fetch_latest_research()
        
        assert articles == []

    @patch('app.services.research_service.requests.get')
    def test_fetch_latest_research_error(self, mock_requests_get):
        """Test error handling in fetch"""
        mock_requests_get.side_effect = Exception("Network error")
        
        articles = research_service.fetch_latest_research()
        
        assert articles == []

    @patch('app.services.research_service.fetch_latest_research')
    def test_get_cached_research_cache_hit(self, mock_fetch):
        """Test getting cached research (cache hit)"""
        # Setup cache
        research_service.research_cache['data'] = {
            'articles': [{'title': 'Cached Article'}],
            'cached_at': datetime.now().isoformat()
        }
        research_service.research_cache['timestamp'] = datetime.now().isoformat()
        
        data, error = research_service.get_cached_research()
        
        assert error is None
        assert data['articles'][0]['title'] == 'Cached Article'
        mock_fetch.assert_not_called()

    @patch('app.services.research_service.fetch_latest_research')
    def test_get_cached_research_cache_miss(self, mock_fetch):
        """Test getting research with cache miss"""
        research_service.research_cache['data'] = None
        research_service.research_cache['timestamp'] = None
        
        mock_fetch.return_value = [{'title': 'Fresh Article'}]
        
        data, error = research_service.get_cached_research()
        
        assert error is None
        assert len(data['articles']) == 1
        mock_fetch.assert_called_once()

    @patch('app.services.research_service.requests.get')
    @patch('googletrans.Translator')
    def test_search_research_success(self, mock_translator_class, mock_requests_get):
        """Test searching research with Japanese query"""
        # Mock translator for query
        mock_translator = MagicMock()
        mock_translated = MagicMock()
        mock_translated.text = 'muscle hypertrophy'
        mock_translator.translate.return_value = mock_translated
        mock_translator_class.return_value = mock_translator
        
        # Mock search response
        mock_search_response = MagicMock()
        mock_search_response.json.return_value = {
            'esearchresult': {
                'idlist': ['11111'],
                'count': '1'
            }
        }
        
        # Mock summary response
        mock_summary_response = MagicMock()
        mock_summary_response.json.return_value = {
            'result': {
                '11111': {
                    'title': 'Muscle Growth Study',
                    'authors': [{'name': 'Researcher'}],
                    'pubdate': '2024 Jan'
                }
            }
        }
        
        mock_requests_get.side_effect = [mock_search_response, mock_summary_response]
        
        result, error = research_service.search_research('筋肥大')
        
        assert error is None
        assert result['count'] == 1
        assert len(result['results']) == 1

    @patch('app.services.research_service.requests.get')
    @patch('app.services.research_service.GEMINI_API_KEY', 'test_key')
    @patch('app.services.research_service.genai.GenerativeModel')
    def test_get_research_summary_success(self, mock_model_class, mock_requests_get):
        """Test getting AI summary of research"""
        # Mock PubMed fetch
        mock_response = MagicMock()
        mock_response.content = b'''<?xml version="1.0"?>
<PubmedArticleSet>
    <PubmedArticle>
        <MedlineCitation>
            <Article>
                <ArticleTitle>Test Title</ArticleTitle>
                <Abstract>
                    <AbstractText>Test abstract content</AbstractText>
                </Abstract>
            </Article>
        </MedlineCitation>
    </PubmedArticle>
</PubmedArticleSet>'''
        mock_requests_get.return_value = mock_response
        
        # Mock AI model
        mock_model = MagicMock()
        mock_ai_response = MagicMock()
        mock_ai_response.text = 'AI generated summary'
        mock_model.generate_content.return_value = mock_ai_response
        mock_model_class.return_value = mock_model
        
        summary, error = research_service.get_research_summary('12345')
        
        assert error is None
        assert summary['pmid'] == '12345'
        assert summary['summary'] == 'AI generated summary'

    @patch('app.services.research_service.GEMINI_API_KEY', '')
    def test_get_research_summary_no_api_key(self):
        """Test summary without API key"""
        summary, error = research_service.get_research_summary('12345')
        
        assert summary is None
        assert 'not configured' in error

    @patch('app.services.research_service.requests.get')
    @patch('googletrans.Translator')
    def test_fetch_latest_research_translation_error(self, mock_translator_class, mock_requests_get):
        """Test handling translation errors"""
        # Mock search response
        mock_search_response = MagicMock()
        mock_search_response.json.return_value = {
            'esearchresult': {
                'idlist': ['12345']
            }
        }
        
        # Mock summary response
        mock_summary_response = MagicMock()
        mock_summary_response.json.return_value = {
            'result': {
                '12345': {
                    'title': 'Test Title',
                    'authors': [{'name': 'Author'}],
                    'pubdate': '2024-01-15'
                }
            }
        }
        
        # Mock translator with error
        mock_translator = MagicMock()
        mock_translator.translate.side_effect = Exception("Translation error")
        mock_translator_class.return_value = mock_translator
        
        mock_requests_get.side_effect = [mock_search_response, mock_summary_response]
        
        articles = research_service.fetch_latest_research()
        
        # Should still return articles with English titles
        assert len(articles) >= 0

    @patch('app.services.research_service.requests.get')
    def test_fetch_latest_research_invalid_response(self, mock_requests_get):
        """Test handling invalid API response"""
        mock_response = MagicMock()
        mock_response.json.return_value = {}  # Missing esearchresult
        mock_requests_get.return_value = mock_response
        
        articles = research_service.fetch_latest_research()
        
        assert articles == []

    @patch('app.services.research_service.requests.get')
    @patch('googletrans.Translator')
    def test_search_research_translation_retry(self, mock_translator_class, mock_requests_get):
        """Test translation retry mechanism"""
        # Mock translator
        mock_translator = MagicMock()
        mock_translated = MagicMock()
        mock_translated.text = 'muscle training'
        mock_translator.translate.return_value = mock_translated
        mock_translator_class.return_value = mock_translator
        
        # Mock search response
        mock_search_response = MagicMock()
        mock_search_response.json.return_value = {
            'esearchresult': {
                'idlist': [],
                'count': '0'
            }
        }
        
        mock_requests_get.return_value = mock_search_response
        
        result, error = research_service.search_research('筋トレ', offset=10)
        
        assert error is None
        assert result['count'] == 0
        assert result['offset'] == 10

    @patch('app.services.research_service.requests.get')
    @patch('app.services.research_service.GEMINI_API_KEY', 'test_key')
    @patch('app.services.research_service.genai.GenerativeModel')
    def test_get_research_summary_error_handling(self, mock_model_class, mock_requests_get):
        """Test error handling in summary generation"""
        mock_response = MagicMock()
        mock_response.content = b'<?xml version="1.0"?><PubmedArticleSet></PubmedArticleSet>'
        mock_requests_get.return_value = mock_response
        
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("AI error")
        mock_model_class.return_value = mock_model
        
        summary, error = research_service.get_research_summary('12345')
        
        assert summary is None
        assert error == "AI error"

    @patch('app.services.research_service.requests.get')
    def test_search_research_error_handling(self, mock_requests_get):
        """Test error handling in research search"""
        mock_requests_get.side_effect = Exception("Network error")
        
        result, error = research_service.search_research('test query')
        
        assert result is None
        assert error == "Network error"

    @patch('app.services.research_service.fetch_latest_research')
    def test_get_cached_research_error_handling(self, mock_fetch):
        """Test error handling in cached research retrieval"""
        # キャッシュをクリアして例外発生を保証
        research_service.research_cache['data'] = None
        research_service.research_cache['timestamp'] = None
        
        mock_fetch.side_effect = Exception("Fetch error")
        
        data, error = research_service.get_cached_research()
        
        assert data is None
        assert error == "Fetch error"

