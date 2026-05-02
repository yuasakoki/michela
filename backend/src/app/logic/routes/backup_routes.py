"""バックアップ・復元エンドポイント"""
from flask import Blueprint, request, jsonify

from app.services import backup_service

backup_bp = Blueprint('backup', __name__)


@backup_bp.route('/backup_all', methods=['GET'])
def backup_all():
    """全データをJSON形式でバックアップ"""
    backup_data, error = backup_service.create_backup()
    if error:
        return jsonify({'error': error}), 500
    return jsonify(backup_data), 200


@backup_bp.route('/restore_backup', methods=['POST'])
def restore_backup():
    """バックアップデータを復元"""
    data = request.json
    restored_counts, error = backup_service.restore_backup(data)
    if error:
        return jsonify({'error': error}), 400
    return jsonify({
        "message": "Backup restored successfully",
        "restored_counts": restored_counts
    }), 200
