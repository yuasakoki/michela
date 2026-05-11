"""トレーニング記録エンドポイント"""
from flask import Blueprint, request, jsonify

from app.services import training_service

training_bp = Blueprint('training', __name__)


@training_bp.route('/get_exercise_presets', methods=['GET'])
def get_exercise_presets():
    """トレーニング種目プリセット一覧を取得"""
    presets = training_service.get_exercise_presets()
    return jsonify(presets), 200


@training_bp.route('/add_exercise_preset', methods=['POST'])
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


@training_bp.route('/delete_exercise_preset/<exercise_id>', methods=['DELETE'])
def delete_exercise_preset(exercise_id):
    """カスタム種目を削除"""
    error = training_service.delete_exercise_preset(exercise_id)
    if error:
        return jsonify({'error': error}), 400

    return jsonify({"message": "ok"}), 200


@training_bp.route('/add_training_session', methods=['POST'])
def add_training_session():
    """トレーニングセッションを登録"""
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400

    session_id, error = training_service.add_training_session(data)
    if error:
        return jsonify({'error': error}), 400

    return jsonify({"message": "ok", "id": session_id}), 201


@training_bp.route('/get_training_sessions/<customer_id>', methods=['GET'])
def get_training_sessions(customer_id):
    """顧客のトレーニングセッション一覧を取得"""
    try:
        limit = request.args.get('limit', 20, type=int)
        sessions = training_service.get_training_sessions_by_customer(customer_id, limit)
        return jsonify(sessions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@training_bp.route('/get_training_session/<session_id>', methods=['GET'])
def get_training_session(session_id):
    """トレーニングセッション詳細を取得"""
    try:
        session, error = training_service.get_training_session_by_id(session_id)
        if error:
            return jsonify({'error': error}), 404
        return jsonify(session), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@training_bp.route('/update_training_session/<session_id>', methods=['PUT'])
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


@training_bp.route('/delete_training_session/<session_id>', methods=['DELETE'])
def delete_training_session(session_id):
    """トレーニングセッションを削除"""
    try:
        training_service.delete_training_session(session_id)
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@training_bp.route('/get_exercise_history/<customer_id>/<exercise_id>', methods=['GET'])
def get_exercise_history(customer_id, exercise_id):
    """特定種目の履歴を取得"""
    try:
        limit = request.args.get('limit', 10, type=int)
        history = training_service.get_exercise_history(customer_id, exercise_id, limit)
        return jsonify(history), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@training_bp.route('/api/training/recommend-sets', methods=['POST'])
def recommend_sets():
    """推奨セットを生成"""
    data = request.json
    if not data or 'customer_id' not in data or 'exercise_id' not in data:
        return jsonify({'error': 'customer_id and exercise_id are required'}), 400

    result, error = training_service.generate_recommended_sets(data['customer_id'], data['exercise_id'])
    if error:
        return jsonify({'error': error}), 500
    return jsonify(result), 200


@training_bp.route('/get_max_weight/<customer_id>/<exercise_id>', methods=['GET'])
def get_max_weight(customer_id, exercise_id):
    """特定種目の過去最高重量を取得"""
    max_weight, error = training_service.get_max_weight(customer_id, exercise_id)
    if error:
        return jsonify({'error': error}), 500
    return jsonify({'max_weight': max_weight}), 200
