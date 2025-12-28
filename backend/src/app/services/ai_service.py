"""AI機能サービス（Gemini API）"""
import os
import google.generativeai as genai

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def chat_with_ai(message):
    """Gemini AIとチャット"""
    if not GEMINI_API_KEY:
        return None, 'Gemini API key not configured'
    
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
        return None, str(e)
