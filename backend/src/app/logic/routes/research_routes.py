"""研究記事エンドポイント"""
from flask import Blueprint, request, jsonify

from app.services import research_service

research_bp = Blueprint('research', __name__)


@research_bp.route('/get_latest_research', methods=['GET'])
def get_latest_research():
    """最新の筋トレ・ダイエット研究記事を取得（キャッシュ利用）"""
    try:
        data, error = research_service.get_cached_research()
        if error:
            return jsonify({'error': error}), 500
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@research_bp.route('/search_research', methods=['POST'])
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


@research_bp.route('/research_summary/<pmid>', methods=['GET'])
def research_summary(pmid):
    """論文の要約をAI生成"""
    summary, error = research_service.get_research_summary(pmid)

    if error:
        return jsonify({'error': error}), 500

    return jsonify(summary), 200
