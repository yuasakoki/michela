"""トレーニング記録サービス"""
from firebase_admin import firestore
from datetime import datetime


def get_db():
    """Firestoreクライアントを取得"""
    return firestore.client()


# トレーニング種目のプリセット
EXERCISE_PRESETS = [
    {"id": "bench_press", "name": "ベンチプレス", "category": "chest", "unit": "kg"},
    {"id": "squat", "name": "スクワット", "category": "legs", "unit": "kg"},
    {"id": "deadlift", "name": "デッドリフト", "category": "back", "unit": "kg"},
    {"id": "shoulder_press", "name": "ショルダープレス", "category": "shoulders", "unit": "kg"},
    {"id": "barbell_row", "name": "バーベルロウ", "category": "back", "unit": "kg"},
    {"id": "pull_up", "name": "懸垂", "category": "back", "unit": "回"},
    {"id": "dip", "name": "ディップス", "category": "chest", "unit": "回"},
    {"id": "lat_pulldown", "name": "ラットプルダウン", "category": "back", "unit": "kg"},
    {"id": "leg_press", "name": "レッグプレス", "category": "legs", "unit": "kg"},
    {"id": "leg_extension", "name": "レッグエクステンション", "category": "legs", "unit": "kg"},
    {"id": "leg_curl", "name": "レッグカール", "category": "legs", "unit": "kg"},
    {"id": "bicep_curl", "name": "バイセプスカール", "category": "arms", "unit": "kg"},
    {"id": "tricep_extension", "name": "トライセプスエクステンション", "category": "arms", "unit": "kg"},
    {"id": "cable_fly", "name": "ケーブルフライ", "category": "chest", "unit": "kg"},
    {"id": "side_raise", "name": "サイドレイズ", "category": "shoulders", "unit": "kg"},
]


def get_exercise_presets():
    """トレーニング種目プリセット一覧を取得"""
    return EXERCISE_PRESETS


def add_training_session(data):
    """トレーニングセッションを登録"""
    db = get_db()
    required = ['customer_id', 'date', 'exercises']
    if not all(k in data for k in required):
        return None, 'Missing required fields'
    
    doc_ref = db.collection('training_sessions').document()
    session_id = doc_ref.id
    
    doc_ref.set({
        'customer_id': data['customer_id'],
        'date': data['date'],
        'exercises': data['exercises'],  # [{ exercise_id, sets: [{ reps, weight }] }]
        'notes': data.get('notes', ''),
        'duration_minutes': data.get('duration_minutes', 0),
        'created_at': datetime.now().isoformat()
    })
    
    return session_id, None


def get_training_sessions_by_customer(customer_id, limit=20):
    """顧客のトレーニングセッション一覧を取得"""
    db = get_db()
    query = db.collection('training_sessions').where('customer_id', '==', customer_id)
    
    sessions = []
    for doc in query.stream():
        session = doc.to_dict()
        session['id'] = doc.id
        sessions.append(session)
    
    # 日付でソート（新しい順）
    sessions.sort(key=lambda x: x.get('date', ''), reverse=True)
    return sessions[:limit]


def get_training_session_by_id(session_id):
    """トレーニングセッション詳細を取得"""
    db = get_db()
    doc_ref = db.collection('training_sessions').document(session_id)
    doc = doc_ref.get()
    
    if doc.exists:
        session = doc.to_dict()
        session['id'] = doc.id
        return session, None
    return None, 'Training session not found'


def update_training_session(session_id, data):
    """トレーニングセッションを更新"""
    db = get_db()
    doc_ref = db.collection('training_sessions').document(session_id)
    doc_ref.update(data)


def delete_training_session(session_id):
    """トレーニングセッションを削除"""
    db = get_db()
    db.collection('training_sessions').document(session_id).delete()


def get_exercise_history(customer_id, exercise_id, limit=10):
    """特定種目の履歴を取得（進捗確認用）"""
    db = get_db()
    query = db.collection('training_sessions').where('customer_id', '==', customer_id)
    
    sessions = []
    for doc in query.stream():
        session = doc.to_dict()
        session['id'] = doc.id
        
        # 該当種目のみ抽出
        for exercise in session.get('exercises', []):
            if exercise.get('exercise_id') == exercise_id:
                sessions.append({
                    'date': session.get('date'),
                    'exercise': exercise,
                    'session_id': session['id']
                })
                break
    
    # 日付でソート
    sessions.sort(key=lambda x: x.get('date', ''), reverse=True)
    return sessions[:limit]


def calculate_1rm(weight, reps):
    """1RM（最大挙上重量）を計算（Epley公式）"""
    if reps == 1:
        return weight
    return weight * (1 + reps / 30)
