"""体重履歴エンドポイント"""
from flask import Blueprint, request, jsonify

from app.services import weight_service

weight_bp = Blueprint('weight', __name__)


@weight_bp.route('/get_weight_history/<customer_id>', methods=['GET'])
def get_weight_history(customer_id):
    """顧客IDに基づく体重履歴を取得"""
    try:
        limit = request.args.get('limit', 10, type=int)
        history = weight_service.get_weight_history(customer_id, limit)
        return jsonify(history), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@weight_bp.route('/add_weight_record/<customer_id>', methods=['POST'])
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
