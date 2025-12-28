"""体重履歴管理サービス"""
from firebase_admin import firestore
from datetime import datetime


def get_db():
    """Firestoreクライアントを取得"""
    return firestore.client()


def get_weight_history(customer_id, limit=10):
    """顧客IDに基づく体重履歴を取得"""
    db = get_db()
    weight_history = []
    query = db.collection('weight_history')\
              .where('customer_id', '==', customer_id)\
              .order_by('recorded_at', direction=firestore.Query.DESCENDING)\
              .limit(limit)
    
    for doc in query.stream():
        history = doc.to_dict()
        history['id'] = doc.id
        weight_history.append(history)
    
    return weight_history


def add_weight_record(customer_id, weight, recorded_at=None, note=''):
    """体重記録を追加"""
    db = get_db()
    weight_history_ref = db.collection('weight_history').document()
    weight_history_ref.set({
        'customer_id': customer_id,
        'weight': float(weight),
        'recorded_at': recorded_at or datetime.now().isoformat(),
        'note': note
    })
    
    # 顧客の現在の体重も更新
    customer_ref = db.collection('customer').document(customer_id)
    customer_ref.update({'weight': float(weight)})
    
    return weight_history_ref.id
