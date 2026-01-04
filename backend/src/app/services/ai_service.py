"""AI機能サービス（Gemini API）"""
import os
import google.generativeai as genai
from datetime import datetime, timedelta
import hashlib

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print(f"Gemini API configured: {GEMINI_API_KEY[:10]}...")
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables")

# キャッシュ（メモリ内）
_cache = {}
CACHE_DURATION_MINUTES = 60  # キャッシュの有効期限（60分）


def _get_cache_key(message):
    """メッセージからキャッシュキーを生成"""
    return hashlib.md5(message.encode()).hexdigest()


def _get_from_cache(cache_key):
    """キャッシュから取得（レスポンスと有効期限を返す）"""
    if cache_key in _cache:
        cached_data = _cache[cache_key]
        if datetime.now() < cached_data['expires_at']:
            print(f"Cache HIT: {cache_key[:10]}...")
            return cached_data['response'], cached_data['expires_at']
        else:
            # 期限切れのキャッシュを削除
            del _cache[cache_key]
            print(f"Cache EXPIRED: {cache_key[:10]}...")
    return None, None


def _save_to_cache(cache_key, response):
    """キャッシュに保存"""
    _cache[cache_key] = {
        'response': response,
        'expires_at': datetime.now() + timedelta(minutes=CACHE_DURATION_MINUTES)
    }
    print(f"Cache SAVED: {cache_key[:10]}...")


def chat_with_ai(message, use_cache=True):
    """Gemini AIとチャット（キャッシュ機能付き）
    
    Returns:
        tuple: (response_text, error, cached_until)
            - response_text: AIの応答テキスト
            - error: エラーメッセージ（エラーがない場合はNone）
            - cached_until: キャッシュ有効期限（datetime、キャッシュヒット時のみ）
    """
    if not GEMINI_API_KEY:
        print("ERROR: Gemini API key not configured")
        return None, 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.', None
    
    # キャッシュチェック
    if use_cache:
        cache_key = _get_cache_key(message)
        cached_response, expires_at = _get_from_cache(cache_key)
        if cached_response:
            return cached_response, None, expires_at
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # システムプロンプトを追加
        prompt = f"""あなたは筋トレ・ダイエット・栄養科学の専門家アシスタントです。
科学的根拠に基づいた最新の情報を提供してください。
可能な限り具体的な研究や論文を参照してください。

ユーザーの質問: {message}"""
        
        print("API REQUEST: Generating content...")
        response = model.generate_content(prompt)
        
        # キャッシュに保存
        if use_cache:
            _save_to_cache(cache_key, response.text)
        
        return response.text, None, None
    except Exception as e:
        print(f"ERROR in chat_with_ai: {str(e)}")
        return None, str(e), None
