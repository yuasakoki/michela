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
CORS(app, origins=[
    "http://localhost:3000",
    re.compile(r"^https://.*\.vercel\.app$")
])

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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
