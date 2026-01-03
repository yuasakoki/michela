from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
import os
import json
import re
import sys
from dotenv import load_dotenv

# .envファイルから環境変数を読み込み（サービスインポート前に実行）
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

# パスを追加してservicesモジュールをインポート可能にする
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# サービスモジュールのインポート（.env読み込み後）
from app.services import customer_service, weight_service, ai_service, research_service, training_service, meal_service, user_service

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
    # デフォルトユーザーを初期化（初回のみ）
    user_service.initialize_default_users()

app = Flask(__name__)

# CORS設定
CORS(app, 
     origins=[
         "http://localhost:3000",
         "http://localhost:3001",
         "http://localhost:3002",
         "http://localhost:3003",
         "https://michela.vercel.app",
         "https://michela-git-main.vercel.app",
         re.compile(r"^https://michela-.*\.vercel\.app$")
     ],
     supports_credentials=True)


# ==================== 認証・ユーザー管理エンドポイント ====================

@app.route('/login', methods=['POST'])
def login():
    """ユーザーログイン"""
    data = request.json
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Username and password are required"}), 400
    
    user_data, error = user_service.authenticate_user(data['username'], data['password'])
    if error:
        return jsonify({'error': error}), 401
    
    return jsonify({
        "message": "Login successful",
        "user": user_data
    }), 200


@app.route('/get_users', methods=['GET'])
def get_users():
    """全ユーザーを取得（管理者用）"""
    users = user_service.get_all_users()
    return jsonify(users), 200


@app.route('/create_user', methods=['POST'])
def create_user_endpoint():
    """新しいユーザーを作成（管理者用）"""
    data = request.json
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Username and password are required"}), 400
    
    user_id, error = user_service.create_user(
        username=data['username'],
        password=data['password'],
        role=data.get('role', 0),
        email=data.get('email')
    )
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({"message": "User created", "id": user_id}), 201


@app.route('/update_user/<user_id>', methods=['PUT'])
def update_user_endpoint(user_id):
    """ユーザー情報を更新（管理者用）"""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    error = user_service.update_user(user_id, data)
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({"message": "User updated"}), 200


@app.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_user_endpoint(user_id):
    """ユーザーを削除（管理者用）"""
    error = user_service.delete_user(user_id)
    if error:
        return jsonify({'error': error}), 500
    
    return jsonify({"message": "User deleted"}), 200


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


@app.route('/delete_customer/<id>', methods=['DELETE'])
def delete_customer(id):
    try:
        customer_service.delete_customer(id)
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


@app.route('/get_training_advice/<customer_id>', methods=['GET'])
def get_training_advice(customer_id):
    """トレーニング記録に基づくAIアドバイス"""
    try:
        # 最新のトレーニングセッションを取得（最大10件）
        sessions = training_service.get_training_sessions_by_customer(customer_id, limit=10)
        
        if not sessions:
            return jsonify({"advice": "まだトレーニング記録がありません。まずはトレーニングを記録してみましょう！"}), 200
        
        # 最新1件（今回）と過去3件をまとめる
        latest_session = sessions[0] if sessions else None
        past_sessions = sessions[1:4] if len(sessions) > 1 else []
        
        # 今回のトレーニング
        current_summary = "Today:\n"
        if latest_session:
            current_summary += f"{latest_session.get('date', '')}\n"
            for ex in latest_session.get('exercises', []):
                sets = ", ".join([f"{s.get('reps')}×{s.get('weight')}kg" for s in ex.get('sets', [])])
                current_summary += f"- {ex.get('exercise_name')}: {sets}\n"
        
        # 過去3回の簡潔な記録（進捗比較用）
        past_summary = "Past 3 sessions:\n"
        for session in past_sessions:
            date = session.get('date', '')
            for ex in session.get('exercises', []):
                # 最大重量を取得
                max_weight = max([s.get('weight', 0) for s in ex.get('sets', [])]) if ex.get('sets') else 0
                sets_count = len(ex.get('sets', []))
                past_summary += f"{date}: {ex.get('exercise_name')} {sets_count}sets, max {max_weight}kg\n"
        
        # AIにアドバイスを求める（英語プロンプト、日本語回答）
        prompt = f"""{current_summary}
{past_summary}

Context: Warmed up, trainer support, intermediate level, 0kg=bodyweight.
Compare with past 3 sessions, evaluate progress in 3 points, and advise for next session.
Please respond in Japanese."""
        
        advice_text, error, cached_until = ai_service.chat_with_ai(prompt)
        if error:
            return jsonify({"error": error}), 500
        
        response = {"advice": advice_text}
        if cached_until:
            response["cached_until"] = cached_until.isoformat()
            response["is_cached"] = True
        else:
            response["is_cached"] = False
        
        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/get_meal_advice/<customer_id>', methods=['GET'])
def get_meal_advice(customer_id):
    """食事記録に基づくAIアドバイス"""
    try:
        # 最新の食事記録を取得（最大30件、約1週間分）
        records = meal_service.get_meal_records_by_customer(customer_id, limit=30)
        
        if not records:
            return jsonify({"advice": "まだ食事記録がありません。まずは食事を記録してみましょう！"}), 200
        
        # 栄養目標を取得
        goal, _ = meal_service.get_nutrition_goal(customer_id)
        
        # 直近7日間の平均を計算
        from collections import defaultdict
        daily_nutrition = defaultdict(lambda: {'calories': 0, 'protein': 0, 'fat': 0, 'carbs': 0, 'count': 0})
        
        for record in records:
            date = record.get('date', '')
            daily_nutrition[date]['calories'] += record.get('total_calories', 0)
            daily_nutrition[date]['protein'] += record.get('total_protein', 0)
            daily_nutrition[date]['fat'] += record.get('total_fat', 0)
            daily_nutrition[date]['carbs'] += record.get('total_carbs', 0)
            daily_nutrition[date]['count'] += 1
        
        # 直近3日分と平均
        sorted_dates = sorted(daily_nutrition.keys(), reverse=True)[:7]
        total_days = len(sorted_dates)
        
        # 最新3日分の記録
        recent_summary = "【直近3日】\n"
        for date in sorted_dates[:3]:
            day_data = daily_nutrition[date]
            recent_summary += f"{date}: {round(day_data['calories'])}kcal (P{round(day_data['protein'])}g/F{round(day_data['fat'])}g/C{round(day_data['carbs'])}g)\n"
        
        # 7日間平均
        avg_calories = sum(daily_nutrition[d]['calories'] for d in sorted_dates) / total_days if total_days > 0 else 0
        avg_protein = sum(daily_nutrition[d]['protein'] for d in sorted_dates) / total_days if total_days > 0 else 0
        avg_fat = sum(daily_nutrition[d]['fat'] for d in sorted_dates) / total_days if total_days > 0 else 0
        avg_carbs = sum(daily_nutrition[d]['carbs'] for d in sorted_dates) / total_days if total_days > 0 else 0
        
        avg_summary = f"\n【7日平均】\n{round(avg_calories)}kcal (P{round(avg_protein)}g/F{round(avg_fat)}g/C{round(avg_carbs)}g)\n"
        
        # 目標との比較
        goal_summary = f"\n【目標】\n{goal.get('target_calories', 0)}kcal (P{goal.get('target_protein', 0)}g/F{goal.get('target_fat', 0)}g/C{goal.get('target_carbs', 0)}g)\n"
        
        # AIにアドバイスを求める（簡潔なプロンプト）
        prompt = f"""{recent_summary}{avg_summary}{goal_summary}
前提：目標値設定済。
直近3日と平均を踏まえ、目標達成度とPFCバランスの総評3点。"""
        
        advice_text, error, cached_until = ai_service.chat_with_ai(prompt)
        if error:
            return jsonify({"error": error}), 500
        
        response = {"advice": advice_text}
        if cached_until:
            response["cached_until"] = cached_until.isoformat()
            response["is_cached"] = True
        else:
            response["is_cached"] = False
        
        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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


# ==================== トレーニング記録エンドポイント ====================

@app.route('/get_exercise_presets', methods=['GET'])
def get_exercise_presets():
    """トレーニング種目プリセット一覧を取得"""
    presets = training_service.get_exercise_presets()
    return jsonify(presets), 200


@app.route('/add_exercise_preset', methods=['POST'])
def add_exercise_preset():
    """カスタム種目を追加"""
    data = request.json
    if not data or 'name' not in data:
        return jsonify({"error": "Name is required"}), 400
    
    if 'category' not in data:
        return jsonify({"error": "Category is required"}), 400
    
    exercise_id, error = training_service.add_exercise_preset(
        data['name'],
        data['category']
    )
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({"message": "ok", "id": exercise_id}), 201


@app.route('/delete_exercise_preset/<exercise_id>', methods=['DELETE'])
def delete_exercise_preset(exercise_id):
    """カスタム種目を削除"""
    error = training_service.delete_exercise_preset(exercise_id)
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({"message": "ok"}), 200


@app.route('/add_training_session', methods=['POST'])
def add_training_session():
    """トレーニングセッションを登録"""
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400
    
    session_id, error = training_service.add_training_session(data)
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({"message": "ok", "id": session_id}), 201


@app.route('/get_training_sessions/<customer_id>', methods=['GET'])
def get_training_sessions(customer_id):
    """顧客のトレーニングセッション一覧を取得"""
    try:
        limit = request.args.get('limit', 20, type=int)
        sessions = training_service.get_training_sessions_by_customer(customer_id, limit)
        return jsonify(sessions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/get_training_session/<session_id>', methods=['GET'])
def get_training_session(session_id):
    """トレーニングセッション詳細を取得"""
    try:
        session, error = training_service.get_training_session_by_id(session_id)
        if error:
            return jsonify({'error': error}), 404
        return jsonify(session), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/update_training_session/<session_id>', methods=['PUT'])
def update_training_session(session_id):
    """トレーニングセッションを更新"""
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400
    try:
        training_service.update_training_session(session_id, data)
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/delete_training_session/<session_id>', methods=['DELETE'])
def delete_training_session(session_id):
    """トレーニングセッションを削除"""
    try:
        training_service.delete_training_session(session_id)
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/get_exercise_history/<customer_id>/<exercise_id>', methods=['GET'])
def get_exercise_history(customer_id, exercise_id):
    """特定種目の履歴を取得"""
    try:
        limit = request.args.get('limit', 10, type=int)
        history = training_service.get_exercise_history(customer_id, exercise_id, limit)
        return jsonify(history), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== 食事記録エンドポイント ====================

@app.route('/get_food_presets', methods=['GET'])
def get_food_presets():
    """食品プリセット一覧を取得"""
    presets = meal_service.get_food_presets()
    return jsonify(presets), 200


@app.route('/add_meal_record', methods=['POST'])
def add_meal_record():
    """食事記録を登録"""
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400
    
    record_id, error = meal_service.add_meal_record(data)
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({"message": "ok", "id": record_id}), 201


@app.route('/get_meal_records/<customer_id>', methods=['GET'])
def get_meal_records(customer_id):
    """顧客の食事記録一覧を取得"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', 30, type=int)
        records = meal_service.get_meal_records_by_customer(customer_id, start_date, end_date, limit)
        return jsonify(records), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/get_meal_record/<record_id>', methods=['GET'])
def get_meal_record(record_id):
    """食事記録詳細を取得"""
    try:
        record, error = meal_service.get_meal_record_by_id(record_id)
        if error:
            return jsonify({'error': error}), 404
        return jsonify(record), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/update_meal_record/<record_id>', methods=['PUT'])
def update_meal_record(record_id):
    """食事記録を更新"""
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400
    try:
        meal_service.update_meal_record(record_id, data)
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/delete_meal_record/<record_id>', methods=['DELETE'])
def delete_meal_record(record_id):
    """食事記録を削除"""
    try:
        meal_service.delete_meal_record(record_id)
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/get_daily_nutrition/<customer_id>/<date>', methods=['GET'])
def get_daily_nutrition(customer_id, date):
    """1日の栄養素サマリーを取得"""
    try:
        summary = meal_service.get_daily_nutrition_summary(customer_id, date)
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/get_nutrition_goal/<customer_id>', methods=['GET'])
def get_nutrition_goal(customer_id):
    """栄養目標を取得"""
    try:
        goal, error = meal_service.get_nutrition_goal(customer_id)
        if error:
            return jsonify({'error': error}), 404
        return jsonify(goal), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/set_nutrition_goal/<customer_id>', methods=['POST'])
def set_nutrition_goal(customer_id):
    """栄養目標を設定"""
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400
    try:
        goal = meal_service.set_nutrition_goal(customer_id, data)
        return jsonify(goal), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== バックアップ・復元エンドポイント ====================

@app.route('/backup_all', methods=['GET'])
def backup_all():
    """全データをJSON形式でバックアップ"""
    try:
        from datetime import datetime
        
        # 全コレクションからデータを取得
        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'version': '1.0',
            'collections': {
                'customers': customer_service.get_all_customers(),
                'weight_history': [],
                'training_sessions': [],
                'meal_records': [],
                'nutrition_goals': []
            }
        }
        
        # 全顧客の関連データを取得
        customers = customer_service.get_all_customers()
        for customer in customers:
            customer_id = customer['id']
            
            # 体重履歴
            weight_history = weight_service.get_weight_history(customer_id, limit=1000)
            for record in weight_history:
                record['customer_id'] = customer_id
            backup_data['collections']['weight_history'].extend(weight_history)
            
            # トレーニングセッション
            training_sessions = training_service.get_training_sessions_by_customer(customer_id, limit=1000)
            backup_data['collections']['training_sessions'].extend(training_sessions)
            
            # 食事記録
            meal_records = meal_service.get_meal_records_by_customer(customer_id, limit=1000)
            backup_data['collections']['meal_records'].extend(meal_records)
            
            # 栄養目標
            goal, _ = meal_service.get_nutrition_goal(customer_id)
            if goal:
                backup_data['collections']['nutrition_goals'].append(goal)
        
        return jsonify(backup_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/restore_backup', methods=['POST'])
def restore_backup():
    """バックアップデータを復元"""
    try:
        data = request.json
        if not data or 'collections' not in data:
            return jsonify({"error": "Invalid backup data"}), 400
        
        collections = data['collections']
        restored_counts = {
            'customers': 0,
            'weight_history': 0,
            'training_sessions': 0,
            'meal_records': 0,
            'nutrition_goals': 0
        }
        
        # 顧客データを復元
        if 'customers' in collections:
            for customer_data in collections['customers']:
                customer_id = customer_data.get('id')
                if customer_id:
                    # IDを除外してデータを更新
                    update_data = {k: v for k, v in customer_data.items() if k != 'id'}
                    db.collection('customer').document(customer_id).set(update_data)
                    restored_counts['customers'] += 1
        
        # 体重履歴を復元
        if 'weight_history' in collections:
            for record in collections['weight_history']:
                record_id = record.get('id')
                if record_id:
                    update_data = {k: v for k, v in record.items() if k != 'id'}
                    db.collection('weight_history').document(record_id).set(update_data)
                    restored_counts['weight_history'] += 1
        
        # トレーニングセッションを復元
        if 'training_sessions' in collections:
            for session in collections['training_sessions']:
                session_id = session.get('id')
                if session_id:
                    update_data = {k: v for k, v in session.items() if k != 'id'}
                    db.collection('training_sessions').document(session_id).set(update_data)
                    restored_counts['training_sessions'] += 1
        
        # 食事記録を復元
        if 'meal_records' in collections:
            for record in collections['meal_records']:
                record_id = record.get('id')
                if record_id:
                    update_data = {k: v for k, v in record.items() if k != 'id'}
                    db.collection('meal_records').document(record_id).set(update_data)
                    restored_counts['meal_records'] += 1
        
        # 栄養目標を復元
        if 'nutrition_goals' in collections:
            for goal in collections['nutrition_goals']:
                customer_id = goal.get('customer_id')
                if customer_id:
                    update_data = {k: v for k, v in goal.items() if k != 'customer_id'}
                    db.collection('nutrition_goals').document(customer_id).set(update_data)
                    restored_counts['nutrition_goals'] += 1
        
        return jsonify({
            "message": "Backup restored successfully",
            "restored_counts": restored_counts
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
