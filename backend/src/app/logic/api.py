from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import re

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

app = Flask(__name__)

# CORS設定: 具体的なドメインを列挙（最も確実な方法）
CORS(app, 
     origins=[
         "http://localhost:3000",
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
