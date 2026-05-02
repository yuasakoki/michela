"""顧客管理エンドポイント"""
from flask import Blueprint, request, jsonify

from app.services import customer_service

customer_bp = Blueprint('customer', __name__)


@customer_bp.route('/register_customer', methods=['POST'])
def register_customer():
    """顧客を登録"""
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400

    customer_id, error = customer_service.register_customer(data)
    if error:
        return jsonify({'error': error}), 400

    return jsonify({"message": "ok", "id": customer_id}), 201


@customer_bp.route('/get_customers', methods=['GET'])
def get_customers():
    """全顧客を取得"""
    customers = customer_service.get_all_customers()
    return jsonify(customers), 200


@customer_bp.route('/get_customer/<id>', methods=['GET'])
def get_customer(id):
    """顧客詳細を取得"""
    try:
        customer, error = customer_service.get_customer_by_id(id)
        if error:
            return jsonify({'error': error}), 404
        return jsonify(customer), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@customer_bp.route('/update_customer/<id>', methods=['PUT'])
def update_customer(id):
    """顧客情報を更新"""
    data = request.json
    if not data:
        return jsonify({"error": "No JSON received"}), 400
    try:
        customer_service.update_customer(id, data)
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@customer_bp.route('/delete_customer/<id>', methods=['DELETE'])
def delete_customer(id):
    """顧客を削除"""
    try:
        customer_service.delete_customer(id)
        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
