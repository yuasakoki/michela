"""研究記事検索サービス（PubMed API）"""
import os
import requests
import google.generativeai as genai
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# 研究記事のキャッシュ
research_cache = {
    'data': None,
    'timestamp': None
}


def fetch_latest_research():
    """PubMed APIから最新の筋トレ・ダイエット研究を取得"""
    try:
        from googletrans import Translator
        translator = Translator()
        
        # PubMed E-Search APIで論文IDを検索（人間対象のトレーニング研究のみ）
        search_terms = "(((muscle hypertrophy[Title] OR resistance training[Title] OR strength training[Title]) OR (weight loss[Title] OR protein intake[Title])) AND (humans[MeSH Terms] OR human[Title/Abstract] OR adults[Title/Abstract]) AND (training[Title/Abstract] OR exercise[Title/Abstract]) AND (2024[PDAT] OR 2025[PDAT])) NOT (disease[Title] OR cancer[Title] OR diabetes[Title] OR hypertension[Title] OR stroke[Title] OR injury[Title] OR rehabilitation[Title] OR surgery[Title] OR elderly[Title] OR aging[Title] OR children[Title] OR pediatric[Title] OR rat[Title] OR mouse[Title] OR mice[Title] OR animal[Title] OR in vitro[Title] OR cell[Title] OR chemical[Title] OR toxicity[Title] OR hormone disruption[Title] OR molecular[Title] OR pathway[Title] OR gene[Title] OR review[Publication Type])"
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
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
        summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
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
                    try:
                        from dateutil import parser
                        parsed_date = parser.parse(pub_date_raw)
                        pub_date = parsed_date.strftime('%Y-%m-%d')
                    except:
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


def get_cached_research():
    """キャッシュから研究記事を取得（1時間以内ならキャッシュ利用）"""
    try:
        if research_cache['data'] and research_cache['timestamp']:
            cache_time = datetime.fromisoformat(research_cache['timestamp'])
            if datetime.now() - cache_time < timedelta(hours=1):
                return research_cache['data'], None
        
        # PubMed APIから論文取得
        articles = fetch_latest_research()
        
        # 空でもキャッシュに保存（頻繁なAPI呼び出しを防ぐ）
        research_cache['data'] = {
            'articles': articles,
            'cached_at': datetime.now().isoformat()
        }
        research_cache['timestamp'] = datetime.now().isoformat()
        
        return research_cache['data'], None
    
    except Exception as e:
        print(f"get_cached_research error: {str(e)}")
        return None, str(e)


def search_research(query, offset=0):
    """研究検索（日本語→英語翻訳→PubMed検索）"""
    try:
        # 日本語→英語翻訳（タイムアウト対策 + リトライ）
        english_query = query  # デフォルトはそのまま
        
        # googletransを複数回リトライ
        for attempt in range(3):
            try:
                from googletrans import Translator
                translator = Translator()
                translated = translator.translate(query, src='ja', dest='en')
                english_query = translated.text
                break  # 成功したらループを抜ける
            except Exception as translate_error:
                print(f"Translation attempt {attempt + 1} failed: {translate_error}")
                if attempt == 2:  # 最後の試行
                    print(f"Translation failed after 3 attempts, using original query: {query}")
                else:
                    import time
                    time.sleep(1)  # 1秒待ってリトライ
        
        # フィットネス特化の検索クエリを構築（人間対象のトレーニング研究のみ）
        fitness_query = f"({english_query}) AND (humans[MeSH Terms] OR human OR adults) AND (resistance training OR strength training OR exercise OR training OR nutrition OR diet) NOT (disease OR pathology OR clinical trial OR patient OR therapy OR treatment OR cancer OR diabetes OR heart failure OR hypertension OR cardiovascular OR stroke OR injury OR rehabilitation OR surgery OR medical OR hospital OR elderly OR aging OR chronic OR acute OR syndrome OR disorder OR impairment OR disability OR risk OR mortality OR morbidity OR rat OR mouse OR mice OR animal OR in vitro OR in vivo OR cell culture OR chemical OR compound OR toxicity OR contamination OR pollutant OR pesticide OR hormone disruption OR molecular OR mechanism OR pathway OR gene OR protein expression OR enzyme OR receptor OR signaling OR review[Publication Type] OR meta-analysis[Publication Type])"
        
        # PubMed検索
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            'db': 'pubmed',
            'term': fitness_query,
            'retmax': 10,
            'retstart': offset,
            'sort': 'pub_date',
            'retmode': 'json'
        }
        
        search_response = requests.get(search_url, params=search_params, timeout=10)
        search_data = search_response.json()
        
        # 全件数を取得
        total_count = 0
        if 'esearchresult' in search_data and 'count' in search_data['esearchresult']:
            total_count = int(search_data['esearchresult']['count'])
        
        if 'esearchresult' not in search_data or 'idlist' not in search_data['esearchresult']:
            return {
                'results': [],
                'translated_query': english_query,
                'search_query': fitness_query,
                'count': 0,
                'offset': offset,
                'displayed_count': 0
            }, None
        
        pmids = search_data['esearchresult']['idlist']
        
        if not pmids:
            return {
                'results': [],
                'translated_query': english_query,
                'search_query': fitness_query,
                'count': total_count,
                'offset': offset,
                'displayed_count': 0
            }, None
        
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
        
        return {
            'results': results,
            'translated_query': english_query,
            'search_query': fitness_query,
            'count': total_count,
            'offset': offset,
            'displayed_count': len(results)
        }, None
        
    except Exception as e:
        return None, str(e)


def get_research_summary(pmid):
    """論文の要約をAI生成"""
    if not GEMINI_API_KEY:
        return None, 'Gemini API not configured'
    
    try:
        # PubMed Fetch APIでAbstract取得
        fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        fetch_params = {
            'db': 'pubmed',
            'id': pmid,
            'retmode': 'xml'
        }
        
        fetch_response = requests.get(fetch_url, params=fetch_params, timeout=10)
        
        # XMLから要約抽出
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
        
        return {
            'pmid': pmid,
            'title': title,
            'summary': summary,
            'url': f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        }, None
        
    except Exception as e:
        return None, str(e)
