"""AI機能サービス（Gemini API）"""
import os
import google.generativeai as genai

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print(f"Gemini API configured: {GEMINI_API_KEY[:10]}...")
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables")


def chat_with_ai(message):
    """Gemini AIとチャット"""
    if not GEMINI_API_KEY:
        print("ERROR: Gemini API key not configured")
        return None, 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.'
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # システムプロンプトを追加
        prompt = f"""あなたは筋トレ・ダイエット・栄養科学の専門家アシスタントです。
科学的根拠に基づいた最新の情報を提供してください。
可能な限り具体的な研究や論文を参照してください。

ユーザーの質問: {message}"""
        
        response = model.generate_content(prompt)
        
        return response.text, None
    except Exception as e:
        print(f"ERROR in chat_with_ai: {str(e)}")
        return None, str(e)
