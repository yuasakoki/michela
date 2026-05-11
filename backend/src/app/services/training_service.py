"""トレーニング記録サービス"""
import math
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
    """トレーニング種目プリセット一覧を取得（Firestore優先）"""
    db = get_db()
    
    # Firestoreからカスタム種目を取得
    custom_exercises = []
    docs = db.collection('exercise_presets').stream()
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        custom_exercises.append(data)
    
    # デフォルトプリセットとマージ（カスタムを優先）
    all_exercises = custom_exercises + EXERCISE_PRESETS
    
    # 重複を除外（idでユニーク化）
    seen_ids = set()
    unique_exercises = []
    for ex in all_exercises:
        if ex['id'] not in seen_ids:
            seen_ids.add(ex['id'])
            unique_exercises.append(ex)
    
    return unique_exercises


def add_exercise_preset(name, category='custom'):
    """カスタム種目を追加"""
    try:
        db = get_db()
        
        if not name or not name.strip():
            return None, '種目名が必要です'
        
        if not category or not category.strip():
            return None, '部位が必要です'
        
        # 同じ名前がすでに存在するかチェック
        existing = db.collection('exercise_presets').where('name', '==', name.strip()).limit(1).get()
        if len(list(existing)) > 0:
            return None, '同じ名前の種目がすでに存在します'
        
        doc_ref = db.collection('exercise_presets').document()
        doc_ref.set({
            'name': name.strip(),
            'category': category.strip(),
            'unit': 'kg',
            'created_at': datetime.now().isoformat()
        })
        
        return doc_ref.id, None
    except Exception as e:
        return None, str(e)


def delete_exercise_preset(exercise_id):
    """カスタム種目を削除（デフォルトプリセットは削除不可）"""
    try:
        db = get_db()
        
        # デフォルトプリセットかチェック
        default_ids = [ex['id'] for ex in EXERCISE_PRESETS]
        if exercise_id in default_ids:
            return 'デフォルト種目は削除できません'
        
        # Firestoreから削除
        db.collection('exercise_presets').document(exercise_id).delete()
        return None
    except Exception as e:
        return str(e)


def _is_working_cleared(sets: list) -> bool:
    """ワーキングセットを全クリアしたか判定"""
    working = [s for s in sets if s.get('set_type') == 'working']
    if not working:
        return False
    return all(
        s.get('reps_actual', 0) >= s.get('reps_planned', 1)
        for s in working
    )


def _update_personal_record(db, customer_id: str, exercise_id: str, max_weight_kg: float, cleared: bool):
    """personal_records を取得し、初回作成またはクリア時に更新する"""
    docs = (
        db.collection('personal_records')
        .where('customer_id', '==', customer_id)
        .where('exercise_id', '==', exercise_id)
        .limit(1)
        .get()
    )
    doc_list = list(docs)
    now = datetime.now().isoformat()

    if not doc_list:
        # 初回：max_weight_kg の 75% を 2.5kg 単位で切り捨てて初期値とする
        initial_weight = float(_round_down_2_5(max_weight_kg * 0.75)) if max_weight_kg else 0.0
        db.collection('personal_records').document().set({
            'customer_id': customer_id,
            'exercise_id': exercise_id,
            'working_weight_kg': initial_weight,
            'updated_at': now,
        })
        return

    if cleared:
        doc = doc_list[0]
        current = float(doc.to_dict().get('working_weight_kg', 0))
        doc.reference.update({
            'working_weight_kg': current + 2.5,
            'updated_at': now,
        })


def add_training_session(data):
    """トレーニングセッションを登録し、personal_records を更新する"""
    try:
        db = get_db()
        required = ['customer_id', 'date', 'exercises']
        if not all(k in data for k in required):
            return None, 'Missing required fields'

        # ① training_sessions へ保存
        doc_ref = db.collection('training_sessions').document()
        session_id = doc_ref.id
        doc_ref.set({
            'customer_id': data['customer_id'],
            'date': data['date'],
            'exercises': data['exercises'],
            'notes': data.get('notes', ''),
            'duration_minutes': data.get('duration_minutes', 0),
            'created_at': datetime.now().isoformat()
        })

        # ②〜⑥ 種目ごとに personal_records を更新
        customer_id = data['customer_id']
        for exercise in data.get('exercises', []):
            exercise_id = exercise.get('exercise_id')
            sets = exercise.get('sets', [])
            max_weight_kg = float(exercise.get('max_weight_kg') or 0)
            if not exercise_id:
                continue
            try:
                cleared = _is_working_cleared(sets)
                _update_personal_record(db, customer_id, exercise_id, max_weight_kg, cleared)
            except Exception as e:
                print(f'[personal_records update error] exercise_id={exercise_id}: {e}')

        return session_id, None
    except Exception as e:
        return None, str(e)


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
    try:
        db = get_db()
        doc_ref = db.collection('training_sessions').document(session_id)
        doc = doc_ref.get()
        
        if doc.exists:
            session = doc.to_dict()
            session['id'] = doc.id
            return session, None
        return None, 'Training session not found'
    except Exception as e:
        return None, str(e)


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


def _round_down_2_5(weight):
    """重量を2.5kg単位で切り捨て"""
    return math.floor(weight / 2.5) * 2.5



def _estimate_1rm_from_history(history):
    """履歴から推定1RMを算出（Epley公式）"""
    max_1rm = 0.0
    for record in history:
        for s in record.get('exercise', {}).get('sets', []):
            w = s.get('weight_kg') or s.get('weight', 0)
            r = s.get('reps_actual') if s.get('reps_actual') is not None else s.get('reps', 1)
            if w > 0 and r > 0:
                est = calculate_1rm(w, r)
                if est > max_1rm:
                    max_1rm = est
    return max_1rm if max_1rm > 0 else None


def _count_completed_v2_sessions(history):
    """set_type付きV2フォーマットで全セット完了したセッション数を返す"""
    count = 0
    for record in reversed(history):  # 古い順に処理
        sets = record.get('exercise', {}).get('sets', [])
        working = [s for s in sets if s.get('set_type') == 'working']
        if not working:
            continue  # 旧フォーマットはスキップ
        all_done = all(
            (s.get('reps_actual') if s.get('reps_actual') is not None else 0)
            >= (s.get('reps_planned') or 8)
            for s in working
        )
        if all_done:
            count += 1
    return count


def generate_recommended_sets(customer_id, exercise_id):
    """推奨セットを生成する

    推定1RMの65%をベースに、V2完了セッション数×2.5kgで積み上げる。
    これにより最初は最高重量より明確に低い重量から開始できる。

    Returns:
        tuple: (result_dict, None) on success, (None, error_message) on failure
    """
    try:
        history = get_exercise_history(customer_id, exercise_id, limit=100)
        if not history:
            return None, '過去の記録がありません'

        estimated_1rm = _estimate_1rm_from_history(history)
        if estimated_1rm is None:
            return None, '過去の記録がありません'

        actual_max_kg, err = get_max_weight(customer_id, exercise_id)
        if err:
            return None, err

        # 完了済みV2セッション数に応じてプログレッシブに重量を積み上げる
        completed_count = _count_completed_v2_sessions(history)
        working_weight = _round_down_2_5(estimated_1rm * 0.65 + completed_count * 2.5)

        warmup1 = _round_down_2_5(working_weight * 0.5)
        warmup2 = _round_down_2_5(working_weight * 0.7)

        recommended_sets = [
            {'set_number': 1, 'set_type': 'warmup',  'weight_kg': warmup1,        'reps_planned': 5, 'reps_actual': 5, 'rir_target': None},
            {'set_number': 2, 'set_type': 'warmup',  'weight_kg': warmup2,        'reps_planned': 3, 'reps_actual': 3, 'rir_target': None},
            {'set_number': 3, 'set_type': 'working', 'weight_kg': working_weight, 'reps_planned': 8, 'reps_actual': 8, 'rir_target': 3},
            {'set_number': 4, 'set_type': 'working', 'weight_kg': working_weight, 'reps_planned': 8, 'reps_actual': 8, 'rir_target': 3},
            {'set_number': 5, 'set_type': 'working', 'weight_kg': working_weight, 'reps_planned': 8, 'reps_actual': 8, 'rir_target': 1},
        ]

        return {
            'recommended_sets': recommended_sets,
            'actual_max_kg': actual_max_kg,
            'estimated_1rm': round(estimated_1rm, 1),
            'is_first_session': completed_count == 0,
            'previous_working_weight_kg': working_weight,
            'weight_changed': completed_count > 0,
        }, None

    except Exception as e:
        return None, str(e)


def get_max_weight(customer_id, exercise_id):
    """特定種目の過去最高重量を取得"""
    try:
        history = get_exercise_history(customer_id, exercise_id, limit=100)
        max_weight = 0.0
        for record in history:
            for s in record.get('exercise', {}).get('sets', []):
                w = s.get('weight_kg') or s.get('weight', 0)
                if w > max_weight:
                    max_weight = w
        return max_weight if max_weight > 0 else None, None
    except Exception as e:
        return None, str(e)


def calculate_1rm(weight, reps):
    """1RM（最大挙上重量）を計算（Epley公式）"""
    if reps == 1:
        return weight
    return weight * (1 + reps / 30)
