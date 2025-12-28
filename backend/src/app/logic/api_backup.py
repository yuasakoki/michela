from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv
import requests
from datetime import datetime, timedelta

# .envファイルから環境変数を読み込み
load_dotenv()

# Firebase認証情報の読み込み（ローカル/本番環境対応）
if 'GOOGLE_CREDENTIALS' in os.environ:
    # 本番環境（Render.com）: 環境変数から読み込み
    cred_dict = json.loads(os.environ['GOOGLE_CREDENTIALS'])
    cred = credentials.Certificate(cred_dict)
else:
    # ローカル環境: JSONファイルから読み込み
    key_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'keys', 'michela-481217-ca8c2322cbd0.json')
    cred = credentials.Certificate(key_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
    print("Firebase initialized")


db = firestore.client()

# Gemini API設定
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = Flask(__name__)

# CORS設定: 具体的なドメインを列挙（最も確実な方法）
CORS(app, 
     origins=[
         "http://localhost:3000",
         "http://localhost:3001",
         "http://localhost:3002",
         "https://michela.vercel.app",
         "https://michela-git-main.vercel.app",
         # すべてのVercelプレビューURLも許可
         re.compile(r"^https://michela-.*\.vercel\.app$")
     ],
     supports_credentials=True)

@app.route('/register_customer', methods=['POST'])
def register_customer():
    data = request.json

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    required = ['name', 'age', 'height', 'weight', 'favorite_food', 'completion_date']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields'}), 400

    # 顧客情報を登録
    doc_ref = db.collection('customer').document()
    customer_id = doc_ref.id
    doc_ref.set({
        'name': data['name'],
        'age': int(data['age']),
        'height': float(data['height']),
        'weight': float(data['weight']),
        'favorite_food': data['favorite_food'],
        'completion_date': data['completion_date']
    })
    
    # 初回の体重履歴を登録
    from datetime import datetime
    weight_history_ref = db.collection('weight_history').document()
    weight_history_ref.set({
        'customer_id': customer_id,
        'weight': float(data['weight']),
        'recorded_at': datetime.now().isoformat(),
        'note': '初回登録'
    })

    return jsonify({"message": "ok", "id": customer_id}), 201


@app.route('/get_customers', methods=['GET'])
def get_customers():
    customers = []
    for doc in db.collection('customer').stream():
        c = doc.to_dict()
        c['id'] = doc.id
        customers.append(c)
    return jsonify(customers), 200
@app.route('/get_customer/<id>', methods=['GET'])
def get_customer(id):
    try:
        doc_ref = db.collection('customer').document(id)
        doc = doc_ref.get()
        if doc.exists:
            customer = doc.to_dict()
            customer['id'] = doc.id
            return jsonify(customer), 200
        else:
            return jsonify({'error': 'Customer not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/update_customer/<id>', methods=['PUT'])
def update_customer(id):
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400
    try:
        doc_ref = db.collection('customer').document(id)
        doc_ref.update(data)
        
        # 体重が更新された場合は履歴に記録
        if 'weight' in data:
            from datetime import datetime
            weight_history_ref = db.collection('weight_history').document()
            weight_history_ref.set({
                'customer_id': id,
                'weight': float(data['weight']),
                'recorded_at': datetime.now().isoformat(),
                'note': '体重更新'
            })
        
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_weight_history/<customer_id>', methods=['GET'])
def get_weight_history(customer_id):
    """顧客IDに基づく体重履歴を取得"""
    try:
        # limitパラメータで取得件数を制限（デフォルト10件）
        limit = request.args.get('limit', 10, type=int)
        
        weight_history = []
        query = db.collection('weight_history')\
                  .where('customer_id', '==', customer_id)\
                  .order_by('recorded_at', direction=firestore.Query.DESCENDING)\
                  .limit(limit)
        
        for doc in query.stream():
            history = doc.to_dict()
            history['id'] = doc.id
            weight_history.append(history)
        
        return jsonify(weight_history), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/add_weight_record/<customer_id>', methods=['POST'])
def add_weight_record(customer_id):
    """体重記録を追加"""
    data = request.json
    if not data or 'weight' not in data:
        return jsonify({"error": "Weight is required"}), 400
    
    try:
        from datetime import datetime
        weight_history_ref = db.collection('weight_history').document()
        weight_history_ref.set({
            'customer_id': customer_id,
            'weight': float(data['weight']),
            'recorded_at': data.get('recorded_at', datetime.now().isoformat()),
            'note': data.get('note', '')
        })
        
        # 顧客の現在の体重も更新
        customer_ref = db.collection('customer').document(customer_id)
        customer_ref.update({'weight': float(data['weight'])})
        
        return jsonify({"message": "ok", "id": weight_history_ref.id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ai_chat', methods=['POST'])
def ai_chat():
    """Gemini AIチャット"""
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "Message is required"}), 400
    
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key not configured"}), 500
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # システムプロンプトを追加
        prompt = f"""あなたは筋トレ・ダイエット・栄養科学の専門家アシスタントです。
科学的根拠に基づいた最新の情報を提供してください。
可能な限り具体的な研究や論文を参照してください。

ユーザーの質問: {data['message']}"""
        
        response = model.generate_content(prompt)
        
        return jsonify({
            "response": response.text,
            "status": "success"
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 研究記事のキャッシュ
research_cache = {
    'data': None,
    'timestamp': None
}

def fetch_pubmed_research():
    """PubMed APIから最新の筋トレ・ダイエット研究を取得"""
    try:
        from googletrans import Translator
        translator = Translator()
        
        # PubMed E-Search APIで論文IDを検索（人間対象のトレーニング研究のみ）
        search_terms = "(((muscle hypertrophy[Title] OR resistance training[Title] OR strength training[Title]) OR (weight loss[Title] OR protein intake[Title])) AND (humans[MeSH Terms] OR human[Title/Abstract] OR adults[Title/Abstract]) AND (training[Title/Abstract] OR exercise[Title/Abstract]) AND (2024[PDAT] OR 2025[PDAT])) NOT (disease[Title] OR cancer[Title] OR diabetes[Title] OR hypertension[Title] OR stroke[Title] OR injury[Title] OR rehabilitation[Title] OR surgery[Title] OR elderly[Title] OR aging[Title] OR children[Title] OR pediatric[Title] OR rat[Title] OR mouse[Title] OR mice[Title] OR animal[Title] OR in vitro[Title] OR cell[Title] OR chemical[Title] OR toxicity[Title] OR hormone disruption[Title] OR molecular[Title] OR pathway[Title] OR gene[Title] OR review[Publication Type])"
        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            'db': 'pubmed',
            'term': search_terms,
            'retmax': 5,
            'sort': 'pub_date',
            'retmode': 'json'
        }
        
        search_response = requests.get(search_url, params=search_params, timeout=10)
        search_data = search_response.json()
        
        if 'esearchresult' not in search_data or 'idlist' not in search_data['esearchresult']:
            return []
        
        pmids = search_data['esearchresult']['idlist']
        
        if not pmids:
            return []
        
        # PubMed E-Summary APIで論文詳細を取得
        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        summary_params = {
            'db': 'pubmed',
            'id': ','.join(pmids),
            'retmode': 'json'
        }
        
        summary_response = requests.get(summary_url, params=summary_params, timeout=10)
        summary_data = summary_response.json()
        
        articles = []
        if 'result' in summary_data:
            for pmid in pmids:
                if pmid in summary_data['result']:
                    article_data = summary_data['result'][pmid]
                    
                    # 英語タイトル取得
                    english_title = article_data.get('title', 'No title')
                    if english_title.endswith('.'):
                        english_title = english_title[:-1]
                    
                    # googletransで高速翻訳
                    try:
                        translated = translator.translate(english_title, src='en', dest='ja')
                        japanese_title = translated.text
                    except:
                        japanese_title = english_title  # 翻訳失敗時は英語のまま
                    
                    # 著者取得
                    authors = []
                    if 'authors' in article_data and article_data['authors']:
                        authors = [author.get('name', '') for author in article_data['authors'][:3]]
                    author_text = ', '.join(authors) if authors else 'Unknown authors'
                    
                    # 日付取得と整形
                    pub_date_raw = article_data.get('pubdate', '2024')
                    # PubMed日付形式: "2024 Dec 15" or "2024" or "2024 Dec"
                    try:
                        from dateutil import parser
                        parsed_date = parser.parse(pub_date_raw)
                        pub_date = parsed_date.strftime('%Y-%m-%d')
                    except:
                        # パース失敗時は年のみ抽出
                        import re
                        year_match = re.search(r'20\d{2}', pub_date_raw)
                        pub_date = f"{year_match.group()}-01-01" if year_match else "2024-01-01"
                    
                    # 要約作成
                    summary = f"{author_text}らによる研究"
                    
                    # PubMed URL
                    url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                    
                    articles.append({
                        'title': japanese_title,
                        'summary': summary,
                        'source': 'PubMed',
                        'date': pub_date,
                        'url': url
                    })
        
        return articles
    
    except Exception as e:
        print(f"PubMed API Error: {str(e)}")
        return []

@app.route('/get_latest_research', methods=['GET'])
def get_latest_research():
    """最新の筋トレ・ダイエット研究記事を取得（PubMed API使用）"""
    try:
        # キャッシュチェック（1時間以内なら再利用）
        if research_cache['data'] and research_cache['timestamp']:
            cache_time = datetime.fromisoformat(research_cache['timestamp'])
            if datetime.now() - cache_time < timedelta(hours=1):
                return jsonify(research_cache['data']), 200
        
        # PubMed APIから論文取得
        articles = fetch_pubmed_research()
        
        if not articles:
            return jsonify({'error': 'Failed to fetch research articles'}), 500
        
        # キャッシュに保存
        research_cache['data'] = {
            'articles': articles,
            'cached_at': datetime.now().isoformat()
        }
        research_cache['timestamp'] = datetime.now().isoformat()
        
        return jsonify(research_cache['data']), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search_research', methods=['POST'])
def search_research():
    """研究検索（日本語→英語翻訳→PubMed検索）"""
    data = request.json
    if not data or 'query' not in data:
        return jsonify({'error': 'Query is required'}), 400
    
    try:
        # offsetパラメータ取得（デフォルト0）
        offset = data.get('offset', 0)
        
        # 日本語→英語翻訳（タイムアウト対策 + リトライ）
        japanese_query = data['query']
        english_query = japanese_query  # デフォルトはそのまま
        
        # googletransを複数回リトライ
        for attempt in range(3):
            try:
                from googletrans import Translator
                translator = Translator()
                translated = translator.translate(japanese_query, src='ja', dest='en')
                english_query = translated.text
                break  # 成功したらループを抜ける
            except Exception as translate_error:
                print(f"Translation attempt {attempt + 1} failed: {translate_error}")
                if attempt == 2:  # 最後の試行
                    print(f"Translation failed after 3 attempts, using original query: {japanese_query}")
                else:
                    import time
                    time.sleep(1)  # 1秒待ってリトライ
        
        # フィットネス特化の検索クエリを構築（人間対象のトレーニング研究のみ）
        # 翻訳されたキーワード + 人間対象 + トレーニング関連 + 動物実験/化学物質/疾患研究を徹底除外
        fitness_query = f"({english_query}) AND (humans[MeSH Terms] OR human OR adults) AND (resistance training OR strength training OR exercise OR training OR nutrition OR diet) NOT (disease OR pathology OR clinical trial OR patient OR therapy OR treatment OR cancer OR diabetes OR heart failure OR hypertension OR cardiovascular OR stroke OR injury OR rehabilitation OR surgery OR medical OR hospital OR elderly OR aging OR chronic OR acute OR syndrome OR disorder OR impairment OR disability OR risk OR mortality OR morbidity OR rat OR mouse OR mice OR animal OR in vitro OR in vivo OR cell culture OR chemical OR compound OR toxicity OR contamination OR pollutant OR pesticide OR hormone disruption OR molecular OR mechanism OR pathway OR gene OR protein expression OR enzyme OR receptor OR signaling OR review[Publication Type] OR meta-analysis[Publication Type])"
        
        # PubMed検索
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            'db': 'pubmed',
            'term': fitness_query,
            'retmax': 10,
            'retstart': offset,  # ページネーション用オフセット
            'sort': 'pub_date',  # 最新順に変更
            'retmode': 'json'
        }
        
        search_response = requests.get(search_url, params=search_params, timeout=10)
        search_data = search_response.json()
        
        # 全件数を取得
        total_count = 0
        if 'esearchresult' in search_data and 'count' in search_data['esearchresult']:
            total_count = int(search_data['esearchresult']['count'])
        
        if 'esearchresult' not in search_data or 'idlist' not in search_data['esearchresult']:
            return jsonify({'results': [], 'translated_query': english_query}), 200
        
        pmids = search_data['esearchresult']['idlist']
        
        if not pmids:
            return jsonify({'results': [], 'translated_query': english_query}), 200
        
        # 論文詳細取得
        summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        summary_params = {
            'db': 'pubmed',
            'id': ','.join(pmids),
            'retmode': 'json'
        }
        
        summary_response = requests.get(summary_url, params=summary_params, timeout=10)
        summary_data = summary_response.json()
        
        results = []
        if 'result' in summary_data:
            for pmid in pmids:
                if pmid in summary_data['result']:
                    article_data = summary_data['result'][pmid]
                    
                    # 英語タイトル取得
                    english_title = article_data.get('title', 'No title')
                    if english_title.endswith('.'):
                        english_title = english_title[:-1]
                    
                    # googletransで日本語翻訳（エラー時は英語のまま）
                    japanese_title = english_title
                    try:
                        from googletrans import Translator
                        title_translator = Translator()
                        translated_title = title_translator.translate(english_title, src='en', dest='ja')
                        japanese_title = translated_title.text
                    except Exception as translate_error:
                        print(f"Title translation error for {pmid}: {translate_error}")
                        # 翻訳失敗時は英語のまま
                    
                    # 著者取得
                    authors = []
                    if 'authors' in article_data and article_data['authors']:
                        authors = [author.get('name', '') for author in article_data['authors'][:3]]
                    author_text = ', '.join(authors) if authors else 'Unknown'
                    
                    # 日付取得
                    pub_date = article_data.get('pubdate', 'Unknown')
                    
                    results.append({
                        'pmid': pmid,
                        'title': japanese_title,
                        'authors': author_text,
                        'date': pub_date,
                        'url': f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                    })
        
        return jsonify({
            'results': results,
            'translated_query': english_query,
            'search_query': fitness_query,
            'count': total_count,
            'offset': offset,
            'displayed_count': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/research_summary/<pmid>', methods=['GET'])
def research_summary(pmid):
    """論文の要約をAI生成"""
    if not GEMINI_API_KEY:
        return jsonify({'error': 'Gemini API not configured'}), 500
    
    try:
        # PubMed Fetch APIでAbstract取得
        fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        fetch_params = {
            'db': 'pubmed',
            'id': pmid,
            'retmode': 'xml'
        }
        
        fetch_response = requests.get(fetch_url, params=fetch_params, timeout=10)
        
        # XMLから要約抽出（簡易）
        import xml.etree.ElementTree as ET
        root = ET.fromstring(fetch_response.content)
        
        # タイトル取得
        title_elem = root.find('.//ArticleTitle')
        title = title_elem.text if title_elem is not None else 'No title'
        
        # Abstract取得
        abstract_elem = root.find('.//Abstract/AbstractText')
        abstract = abstract_elem.text if abstract_elem is not None else 'No abstract available'
        
        # Gemini AIで実践的なアドバイス生成
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""以下の論文から、トレーニーやダイエット実践者が使える具体的なアドバイスを抽出してください（200文字程度）：

タイトル: {title}

Abstract: {abstract}

【重要】以下の形式で回答してください：
- 具体的な数値（タンパク質量、重量、回数、頻度、期間など）
- すぐに実践できる推奨事項
- 「研究によると〜」ではなく「〜がおすすめです」「〜が効果的です」という断定形で
- 学術的な説明ではなく、実践的なアドバイスとして

例：「筋肥大には1日あたり体重1kgあたり1.6gのタンパク質摂取が効果的です」
「10RM（10回で限界になる重量）でのトレーニングが筋肥大に最も効果的です」"""
        
        response = model.generate_content(prompt)
        summary = response.text.strip()
        
        return jsonify({
            'pmid': pmid,
            'title': title,
            'summary': summary,
            'url': f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
