"""食事記録エンドポイント"""
from flask import Blueprint, request, jsonify

from app.services import meal_service

meal_bp = Blueprint('meal', __name__)


@meal_bp.route('/get_food_presets', methods=['GET'])
def get_food_presets():
    """食品プリセット一覧を取得"""
    presets = meal_service.get_food_presets()
    return jsonify(presets), 200


@meal_bp.route('/add_meal_record', methods=['POST'])
def add_meal_record():
    """食事記録を登録"""
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400

    record_id, error = meal_service.add_meal_record(data)
    if error:
        return jsonify({'error': error}), 400

    return jsonify({"message": "ok", "id": record_id}), 201


@meal_bp.route('/get_meal_records/<customer_id>', methods=['GET'])
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


@meal_bp.route('/get_meal_record/<record_id>', methods=['GET'])
def get_meal_record(record_id):
    """食事記録詳細を取得"""
    try:
        record, error = meal_service.get_meal_record_by_id(record_id)
        if error:
            return jsonify({'error': error}), 404
        return jsonify(record), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@meal_bp.route('/update_meal_record/<record_id>', methods=['PUT'])
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


@meal_bp.route('/delete_meal_record/<record_id>', methods=['DELETE'])
def delete_meal_record(record_id):
    """食事記録を削除"""
    try:
        meal_service.delete_meal_record(record_id)
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@meal_bp.route('/get_daily_nutrition/<customer_id>/<date>', methods=['GET'])
def get_daily_nutrition(customer_id, date):
    """1日の栄養素サマリーを取得"""
    try:
        summary = meal_service.get_daily_nutrition_summary(customer_id, date)
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@meal_bp.route('/get_nutrition_goal/<customer_id>', methods=['GET'])
def get_nutrition_goal(customer_id):
    """栄養目標を取得"""
    try:
        goal, error = meal_service.get_nutrition_goal(customer_id)
        if error:
            return jsonify({'error': error}), 404
        return jsonify(goal), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@meal_bp.route('/set_nutrition_goal/<customer_id>', methods=['POST'])
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
