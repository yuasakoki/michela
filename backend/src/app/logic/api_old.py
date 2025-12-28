from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
import os
import json
import re
import sys
from dotenv import load_dotenv

# 繝代せ繧定ｿｽ蜉縺励※services繝｢繧ｸ繝･繝ｼ繝ｫ繧偵う繝ｳ繝昴・繝亥庄閭ｽ縺ｫ縺吶ｋ
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# 繧ｵ繝ｼ繝薙せ繝｢繧ｸ繝･繝ｼ繝ｫ縺ｮ繧､繝ｳ繝昴・繝・
from app.services import customer_service, weight_service, ai_service, research_service

# .env繝輔ぃ繧､繝ｫ縺九ｉ迺ｰ蠅・､画焚繧定ｪｭ縺ｿ霎ｼ縺ｿ
load_dotenv()

# Firebase隱崎ｨｼ諠・ｱ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ・医Ο繝ｼ繧ｫ繝ｫ/譛ｬ逡ｪ迺ｰ蠅・ｯｾ蠢懶ｼ・
if 'GOOGLE_CREDENTIALS' in os.environ:
    # 譛ｬ逡ｪ迺ｰ蠅・ｼ・ender.com・・ 迺ｰ蠅・､画焚縺九ｉ隱ｭ縺ｿ霎ｼ縺ｿ
    cred_dict = json.loads(os.environ['GOOGLE_CREDENTIALS'])
    cred = credentials.Certificate(cred_dict)
else:
    # 繝ｭ繝ｼ繧ｫ繝ｫ迺ｰ蠅・ JSON繝輔ぃ繧､繝ｫ縺九ｉ隱ｭ縺ｿ霎ｼ縺ｿ
    key_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'keys', 'michela-481217-ca8c2322cbd0.json')
    cred = credentials.Certificate(key_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
    print("Firebase initialized")

app = Flask(__name__)

# CORS險ｭ螳・
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


# ==================== 鬘ｧ螳｢邂｡逅・お繝ｳ繝峨・繧､繝ｳ繝・====================

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


# ==================== 菴馴㍾螻･豁ｴ繧ｨ繝ｳ繝峨・繧､繝ｳ繝・====================

@app.route('/get_weight_history/<customer_id>', methods=['GET'])
def get_weight_history(customer_id):
    """鬘ｧ螳｢ID縺ｫ蝓ｺ縺･縺丈ｽ馴㍾螻･豁ｴ繧貞叙蠕・""
    try:
        limit = request.args.get('limit', 10, type=int)
        history = weight_service.get_weight_history(customer_id, limit)
        return jsonify(history), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/add_weight_record/<customer_id>', methods=['POST'])
def add_weight_record(customer_id):
    """菴馴㍾險倬鹸繧定ｿｽ蜉"""
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


# ==================== AI讖溯・繧ｨ繝ｳ繝峨・繧､繝ｳ繝・====================

@app.route('/ai_chat', methods=['POST'])
def ai_chat():
    """Gemini AI繝√Ε繝・ヨ"""
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


# ==================== 遐皮ｩｶ險倅ｺ九お繝ｳ繝峨・繧､繝ｳ繝・====================

@app.route('/get_latest_research', methods=['GET'])
def get_latest_research():
    """譛譁ｰ縺ｮ遲九ヨ繝ｬ繝ｻ繝繧､繧ｨ繝・ヨ遐皮ｩｶ險倅ｺ九ｒ蜿門ｾ暦ｼ医く繝｣繝・す繝･蛻ｩ逕ｨ・・""
    try:
        data, error = research_service.get_cached_research()
        if error:
            return jsonify({'error': error}), 500
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/search_research', methods=['POST'])
def search_research():
    """遐皮ｩｶ讀懃ｴ｢・域律譛ｬ隱樞・闍ｱ隱樒ｿｻ險ｳ竊単ubMed讀懃ｴ｢・・""
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
    """隲匁枚縺ｮ隕∫ｴ・ｒAI逕滓・"""
    summary, error = research_service.get_research_summary(pmid)
    
    if error:
        return jsonify({'error': error}), 500
    
    return jsonify(summary), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
        })
        
        # 鬘ｧ螳｢縺ｮ迴ｾ蝨ｨ縺ｮ菴馴㍾繧よ峩譁ｰ
        customer_ref = db.collection('customer').document(customer_id)
        customer_ref.update({'weight': float(data['weight'])})
        
        return jsonify({"message": "ok", "id": weight_history_ref.id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/init_weight_history', methods=['POST'])
def init_weight_history():
    """譌｢蟄倬｡ｧ螳｢縺ｮ菴馴㍾螻･豁ｴ繧貞・譛溷喧"""
    try:
        from datetime import datetime
        
        # 縺吶∋縺ｦ縺ｮ鬘ｧ螳｢繧貞叙蠕・
        customers = db.collection('customer').stream()
        initialized_count = 0
        
        for customer_doc in customers:
            customer_id = customer_doc.id
            customer_data = customer_doc.to_dict()
            
            # 縺薙・鬘ｧ螳｢縺ｮ菴馴㍾螻･豁ｴ縺悟ｭ伜惠縺吶ｋ縺狗｢ｺ隱・
            existing_history = db.collection('weight_history')\
                                 .where('customer_id', '==', customer_id)\
                                 .limit(1)\
                                 .stream()
            
            has_history = False
            for _ in existing_history:
                has_history = True
                break
            
            # 螻･豁ｴ縺後↑縺・ｴ蜷医・蛻晄悄繝・・繧ｿ繧剃ｽ懈・
            if not has_history and 'weight' in customer_data:
                weight_history_ref = db.collection('weight_history').document()
                weight_history_ref.set({
                    'customer_id': customer_id,
                    'weight': float(customer_data['weight']),
                    'recorded_at': datetime.now().isoformat(),
                    'note': '蛻晏屓逋ｻ骭ｲ・井ｸ諡ｬ蛻晄悄蛹厄ｼ・
                })
                initialized_count += 1
        
        return jsonify({
            "message": "Weight history initialized",
            "initialized_count": initialized_count
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_standard_bmi/<int:age>', methods=['GET'])
def get_standard_bmi(age):
    """蟷ｴ鮨｢縺ｫ蝓ｺ縺･縺乗ｨ呎ｺ烹MI蛟､繧定ｿ斐☆
    
    蜴夂函蜉ｴ蜒咲怐縺ｮ譌･譛ｬ莠ｺ縺ｮ讓呎ｺ紋ｽ馴㍾縺ｫ蝓ｺ縺･縺州MI讓呎ｺ門､:
    - 18-49豁ｳ: 22.0
    - 50-69豁ｳ: 22.5
    - 70豁ｳ莉･荳・ 23.0
    
    蜿り・ 縲梧律譛ｬ莠ｺ縺ｮ鬟滉ｺ区曹蜿門渕貅厄ｼ・020蟷ｴ迚茨ｼ峨・
    """
    try:
        if age < 18:
            return jsonify({'error': 'Age must be 18 or older'}), 400
        
        if age < 50:
            standard_bmi = 22.0
            age_range = "18-49豁ｳ"
        elif age < 70:
            standard_bmi = 22.5
            age_range = "50-69豁ｳ"
        else:
            standard_bmi = 23.0
            age_range = "70豁ｳ莉･荳・
        
        return jsonify({
            'age': age,
            'standard_bmi': standard_bmi,
            'age_range': age_range,
            'source': '蜴夂函蜉ｴ蜒咲怐縲梧律譛ｬ莠ｺ縺ｮ鬟滉ｺ区曹蜿門渕貅厄ｼ・020蟷ｴ迚茨ｼ峨・
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/init_bmi_master', methods=['POST'])
def init_bmi_master():
    """BMI讓呎ｺ門､繝槭せ繧ｿ繝・・繧ｿ繧貞・譛溷喧"""
    try:
        bmi_master_data = [
            {'age_min': 18, 'age_max': 49, 'standard_bmi': 22.0, 'category': '謌蝉ｺｺ・・8-49豁ｳ・・},
            {'age_min': 50, 'age_max': 69, 'standard_bmi': 22.5, 'category': '荳ｭ鬮伜ｹｴ・・0-69豁ｳ・・},
            {'age_min': 70, 'age_max': 120, 'standard_bmi': 23.0, 'category': '鬮倬ｽ｢閠・ｼ・0豁ｳ莉･荳奇ｼ・},
        ]
        
        for data in bmi_master_data:
            doc_ref = db.collection('bmi_master').document()
            doc_ref.set(data)
        
        return jsonify({"message": "BMI master data initialized", "count": len(bmi_master_data)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
