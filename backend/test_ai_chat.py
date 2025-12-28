import google.generativeai as genai

genai.configure(api_key='AIzaSyDrouM4zNZD9zqlUw6Af5Zlp_T4T61cggw')

try:
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = """あなたは筋トレ・ダイエット・栄養科学の専門家アシスタントです。
科学的根拠に基づいた最新の情報を提供してください。
可能な限り具体的な研究や論文を参照してください。

ユーザーの質問: 筋肥大に最適なタンパク質摂取量は？"""
    
    response = model.generate_content(prompt)
    print("Success!")
    print("Response:", response.text[:200])
    
except Exception as e:
    print("Error:", str(e))
    import traceback
    traceback.print_exc()
