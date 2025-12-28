"""顧客管理サービス"""
from firebase_admin import firestore
from datetime import datetime


def get_db():
    """Firestoreクライアントを取得"""
    return firestore.client()


def register_customer(data):
    """顧客を登録"""
    db = get_db()
    required = ['name', 'age', 'height', 'weight', 'favorite_food', 'completion_date']
    if not all(k in data for k in required):
        return None, 'Missing required fields'

    # 顧客情報を登録
    doc_ref = db.collection('customer').document()
    customer_id = doc_ref.id
    doc_ref.set({
        'name': data['name'],
        'age': int(data['age']),
        'height': float(data['height']),
        'weight': float(data['weight']),
        'favorite_food': data['favorite_food'],
        'completion_date': data['completion_date']
    })
    
    # 初回の体重履歴を登録
    weight_history_ref = db.collection('weight_history').document()
    weight_history_ref.set({
        'customer_id': customer_id,
        'weight': float(data['weight']),
        'recorded_at': datetime.now().isoformat(),
        'note': '初回登録'
    })

    return customer_id, None


def get_all_customers():
    """全顧客を取得"""
    db = get_db()
    customers = []
    for doc in db.collection('customer').stream():
        c = doc.to_dict()
        c['id'] = doc.id
        customers.append(c)
    return customers


def get_customer_by_id(customer_id):
    """IDで顧客を取得"""
    db = get_db()
    doc_ref = db.collection('customer').document(customer_id)
    doc = doc_ref.get()
    if doc.exists:
        customer = doc.to_dict()
        customer['id'] = doc.id
        return customer, None
    return None, 'Customer not found'


def update_customer(customer_id, data):
    """顧客情報を更新"""
    db = get_db()
    doc_ref = db.collection('customer').document(customer_id)
    doc_ref.update(data)
    
    # 体重が更新された場合は履歴に記録
    if 'weight' in data:
        weight_history_ref = db.collection('weight_history').document()
        weight_history_ref.set({
            'customer_id': customer_id,
            'weight': float(data['weight']),
            'recorded_at': datetime.now().isoformat(),
            'note': '体重更新'
        })
    
    return True
