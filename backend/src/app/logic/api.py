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
from app.services import customer_service, weight_service, ai_service, research_service, training_service, meal_service

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
         "http://localhost:3003",
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
        
        # セッション情報をテキストにまとめる
        training_summary = "【最近のトレーニング記録】\n"
        for session in sessions[:5]:  # 最新5件
            training_summary += f"\n日付: {session.get('date', '')}\n"
            training_summary += f"所要時間: {session.get('duration', 0)}分\n"
            for exercise in session.get('exercises', []):
                training_summary += f"- {exercise.get('name', '')}: "
                sets_info = []
                for set_data in exercise.get('sets', []):
                    sets_info.append(f"{set_data.get('reps', 0)}回×{set_data.get('weight', 0)}kg")
                training_summary += ", ".join(sets_info) + "\n"
        
        # AIにアドバイスを求める
        prompt = f"""{training_summary}

上記のトレーニング記録を分析して、以下の観点から具体的なアドバイスをしてください：
1. トレーニング頻度や種目のバランス
2. 重量やレップ数の進捗状況
3. 次回のトレーニングで改善できるポイント
4. 怪我を防ぐための注意点

アドバイスは簡潔に3-5個のポイントでまとめてください。"""
        
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
        
        # サマリーをテキスト化
        meal_summary = "【最近の食事記録（日別）】\n"
        sorted_dates = sorted(daily_nutrition.keys(), reverse=True)[:7]
        
        total_days = len(sorted_dates)
        avg_calories = sum(daily_nutrition[d]['calories'] for d in sorted_dates) / total_days if total_days > 0 else 0
        avg_protein = sum(daily_nutrition[d]['protein'] for d in sorted_dates) / total_days if total_days > 0 else 0
        avg_fat = sum(daily_nutrition[d]['fat'] for d in sorted_dates) / total_days if total_days > 0 else 0
        avg_carbs = sum(daily_nutrition[d]['carbs'] for d in sorted_dates) / total_days if total_days > 0 else 0
        
        for date in sorted_dates:
            day_data = daily_nutrition[date]
            meal_summary += f"\n{date}: {round(day_data['calories'])}kcal (P:{round(day_data['protein'])}g, F:{round(day_data['fat'])}g, C:{round(day_data['carbs'])}g) - {day_data['count']}食\n"
        
        meal_summary += f"\n【平均（{total_days}日間）】\n"
        meal_summary += f"カロリー: {round(avg_calories)}kcal\n"
        meal_summary += f"タンパク質: {round(avg_protein)}g\n"
        meal_summary += f"脂質: {round(avg_fat)}g\n"
        meal_summary += f"炭水化物: {round(avg_carbs)}g\n"
        
        meal_summary += f"\n【目標】\n"
        meal_summary += f"カロリー: {goal.get('target_calories', 0)}kcal\n"
        meal_summary += f"タンパク質: {goal.get('target_protein', 0)}g\n"
        meal_summary += f"脂質: {goal.get('target_fat', 0)}g\n"
        meal_summary += f"炭水化物: {goal.get('target_carbs', 0)}g\n"
        
        # AIにアドバイスを求める
        prompt = f"""{meal_summary}

上記の食事記録と目標を分析して、以下の観点から具体的なアドバイスをしてください：
1. 目標に対する達成度（カロリー、PFCバランス）
2. 栄養バランスの改善点
3. 次の食事で意識すべきこと
4. おすすめの食品や食事のタイミング

アドバイスは簡潔に3-5個のポイントでまとめてください。"""
        
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
