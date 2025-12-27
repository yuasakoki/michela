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

    doc_ref = db.collection('customer').document()
    doc_ref.set({
        'name': data['name'],
        'age': int(data['age']),
        'height': float(data['height']),
        'weight': float(data['weight']),
        'favorite_food': data['favorite_food'],
        'completion_date': data['completion_date']
    })

    return jsonify({"message": "ok", "id": doc_ref.id}), 201


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
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_standard_bmi/<int:age>', methods=['GET'])
def get_standard_bmi(age):
    """年齢に基づく標準BMI値を返す
    
    厚生労働省の日本人の標準体重に基づくBMI標準値:
    - 18-49歳: 22.0
    - 50-69歳: 22.5
    - 70歳以上: 23.0
    
    参考: 「日本人の食事摂取基準（2020年版）」
    """
    try:
        if age < 18:
            return jsonify({'error': 'Age must be 18 or older'}), 400
        
        if age < 50:
            standard_bmi = 22.0
            age_range = "18-49歳"
        elif age < 70:
            standard_bmi = 22.5
            age_range = "50-69歳"
        else:
            standard_bmi = 23.0
            age_range = "70歳以上"
        
        return jsonify({
            'age': age,
            'standard_bmi': standard_bmi,
            'age_range': age_range,
            'source': '厚生労働省「日本人の食事摂取基準（2020年版）」'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/init_bmi_master', methods=['POST'])
def init_bmi_master():
    """BMI標準値マスタデータを初期化"""
    try:
        bmi_master_data = [
            {'age_min': 18, 'age_max': 49, 'standard_bmi': 22.0, 'category': '成人（18-49歳）'},
            {'age_min': 50, 'age_max': 69, 'standard_bmi': 22.5, 'category': '中高年（50-69歳）'},
            {'age_min': 70, 'age_max': 120, 'standard_bmi': 23.0, 'category': '高齢者（70歳以上）'},
        ]
        
        for data in bmi_master_data:
            doc_ref = db.collection('bmi_master').document()
            doc_ref.set(data)
        
        return jsonify({"message": "BMI master data initialized", "count": len(bmi_master_data)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
