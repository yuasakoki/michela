"""AI機能エンドポイント"""
from flask import Blueprint, request, jsonify

from app.services import ai_service, training_service, meal_service

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/ai_chat', methods=['POST'])
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


@ai_bp.route('/get_training_advice/<customer_id>', methods=['GET'])
def get_training_advice(customer_id):
    """トレーニング記録に基づくAIアドバイス"""
    try:
        sessions = training_service.get_training_sessions_by_customer(customer_id, limit=10)

        if not sessions:
            return jsonify({"advice": "まだトレーニング記録がありません。まずはトレーニングを記録してみましょう！"}), 200

        advice_text, error, cached_until = ai_service.get_training_advice_with_rag(customer_id, sessions)
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


@ai_bp.route('/get_meal_advice/<customer_id>', methods=['GET'])
def get_meal_advice(customer_id):
    """食事記録に基づくAIアドバイス"""
    try:
        summary, error = meal_service.calculate_nutrition_summary_for_advice(customer_id)
        if error or summary is None:
            return jsonify({'error': error or 'Failed to calculate nutrition summary'}), 500

        if not summary.get('has_records'):
            return jsonify({"advice": "まだ食事記録がありません。まずは食事を記録してみましょう！"}), 200

        prompt = f"""{summary.get('recent_summary', '')}{summary.get('avg_summary', '')}{summary.get('goal_summary', '')}
前提：目標値設定済。
直近3日と平均を踏まえ、目標達成度とPFCバランスの総評3点。"""

        advice_text, ai_error, cached_until = ai_service.chat_with_ai(prompt)
        if ai_error:
            return jsonify({"error": ai_error}), 500

        response = {"advice": advice_text}
        if cached_until:
            response["cached_until"] = cached_until.isoformat()
            response["is_cached"] = True
        else:
            response["is_cached"] = False

        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
