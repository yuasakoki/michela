from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
import os
import json
import re
import sys
from dotenv import load_dotenv

# パスを追加してservicesモジュールをインポート可能にする
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# サービスモジュールのインポート
from app.services import customer_service, weight_service, ai_service, research_service

# .envファイルから環境変数を読み込み（backendディレクトリの.envを指定）
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

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

app = Flask(__name__)

# CORS設定
CORS(app, 
     origins=[
         "http://localhost:3000",
         "http://localhost:3001",
         "http://localhost:3002",
         "https://michela.vercel.app",
         "https://michela-git-main.vercel.app",
         re.compile(r"^https://michela-.*\.vercel\.app$")
     ],
     supports_credentials=True)


# ==================== 顧客管理エンドポイント ====================

@app.route('/register_customer', methods=['POST'])
def register_customer():
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400
    
    customer_id, error = customer_service.register_customer(data)
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({"message": "ok", "id": customer_id}), 201


@app.route('/get_customers', methods=['GET'])
def get_customers():
    customers = customer_service.get_all_customers()
    return jsonify(customers), 200


@app.route('/get_customer/<id>', methods=['GET'])
def get_customer(id):
    try:
        customer, error = customer_service.get_customer_by_id(id)
        if error:
            return jsonify({'error': error}), 404
        return jsonify(customer), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/update_customer/<id>', methods=['PUT'])
def update_customer(id):
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400
    try:
        customer_service.update_customer(id, data)
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== 体重履歴エンドポイント ====================

@app.route('/get_weight_history/<customer_id>', methods=['GET'])
def get_weight_history(customer_id):
    """顧客IDに基づく体重履歴を取得"""
    try:
        limit = request.args.get('limit', 10, type=int)
        history = weight_service.get_weight_history(customer_id, limit)
        return jsonify(history), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/add_weight_record/<customer_id>', methods=['POST'])
def add_weight_record(customer_id):
    """体重記録を追加"""
    data = request.json
    if not data or 'weight' not in data:
        return jsonify({"error": "Weight is required"}), 400
    
    try:
        record_id = weight_service.add_weight_record(
            customer_id, 
            data['weight'],
            data.get('recorded_at'),
            data.get('note', '')
        )
        return jsonify({"message": "ok", "id": record_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== AI機能エンドポイント ====================

@app.route('/ai_chat', methods=['POST'])
def ai_chat():
    """Gemini AIチャット"""
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "Message is required"}), 400
    
    response_text, error = ai_service.chat_with_ai(data['message'])
    if error:
        return jsonify({"error": error}), 500
    
    return jsonify({
        "response": response_text,
        "status": "success"
    }), 200


# ==================== 研究記事エンドポイント ====================

@app.route('/get_latest_research', methods=['GET'])
def get_latest_research():
    """最新の筋トレ・ダイエット研究記事を取得（キャッシュ利用）"""
    try:
        data, error = research_service.get_cached_research()
        if error:
            return jsonify({'error': error}), 500
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/search_research', methods=['POST'])
def search_research():
    """研究検索（日本語→英語翻訳→PubMed検索）"""
    data = request.json
    if not data or 'query' not in data:
        return jsonify({'error': 'Query is required'}), 400
    
    offset = data.get('offset', 0)
    result, error = research_service.search_research(data['query'], offset)
    
    if error:
        return jsonify({'error': error}), 500
    
    return jsonify(result), 200


@app.route('/research_summary/<pmid>', methods=['GET'])
def research_summary(pmid):
    """論文の要約をAI生成"""
    summary, error = research_service.get_research_summary(pmid)
    
    if error:
        return jsonify({'error': error}), 500
    
    return jsonify(summary), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
