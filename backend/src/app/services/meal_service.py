"""食事記録サービス"""
from firebase_admin import firestore
from datetime import datetime


def get_db():
    """Firestoreクライアントを取得"""
    return firestore.client()


# 食品プリセット（カロリー・PFC）
FOOD_PRESETS = [
    # タンパク質源
    {"id": "chicken_breast", "name": "鶏むね肉(100g)", "calories": 108, "protein": 22.3, "fat": 1.5, "carbs": 0},
    {"id": "chicken_thigh", "name": "鶏もも肉(100g)", "calories": 200, "protein": 16.2, "fat": 14.0, "carbs": 0},
    {"id": "beef", "name": "牛肉(100g)", "calories": 250, "protein": 17.1, "fat": 19.5, "carbs": 0.5},
    {"id": "pork", "name": "豚肉(100g)", "calories": 263, "protein": 17.1, "fat": 21.1, "carbs": 0.2},
    {"id": "salmon", "name": "サーモン(100g)", "calories": 133, "protein": 20.0, "fat": 5.5, "carbs": 0.1},
    {"id": "tuna", "name": "マグロ(100g)", "calories": 125, "protein": 26.4, "fat": 1.4, "carbs": 0.1},
    {"id": "egg", "name": "卵1個(60g)", "calories": 91, "protein": 7.4, "fat": 6.2, "carbs": 0.2},
    {"id": "tofu", "name": "豆腐(100g)", "calories": 72, "protein": 6.6, "fat": 4.2, "carbs": 1.6},
    {"id": "natto", "name": "納豆1パック(50g)", "calories": 100, "protein": 8.3, "fat": 5.0, "carbs": 6.1},
    
    # 炭水化物源
    {"id": "white_rice", "name": "白米1膳(150g)", "calories": 252, "protein": 3.8, "fat": 0.5, "carbs": 55.7},
    {"id": "brown_rice", "name": "玄米1膳(150g)", "calories": 248, "protein": 4.2, "fat": 1.5, "carbs": 51.3},
    {"id": "oatmeal", "name": "オートミール(50g)", "calories": 190, "protein": 6.9, "fat": 2.8, "carbs": 34.6},
    {"id": "bread", "name": "食パン1枚(60g)", "calories": 158, "protein": 5.6, "fat": 2.6, "carbs": 28.0},
    {"id": "pasta", "name": "パスタ(100g茹で)", "calories": 150, "protein": 5.2, "fat": 0.9, "carbs": 31.3},
    {"id": "sweet_potato", "name": "さつまいも(100g)", "calories": 132, "protein": 1.2, "fat": 0.2, "carbs": 31.5},
    {"id": "banana", "name": "バナナ1本(100g)", "calories": 86, "protein": 1.1, "fat": 0.2, "carbs": 22.5},
    
    # 野菜
    {"id": "broccoli", "name": "ブロッコリー(100g)", "calories": 33, "protein": 4.3, "fat": 0.5, "carbs": 5.2},
    {"id": "spinach", "name": "ほうれん草(100g)", "calories": 20, "protein": 2.2, "fat": 0.4, "carbs": 3.1},
    {"id": "tomato", "name": "トマト1個(150g)", "calories": 29, "protein": 1.1, "fat": 0.2, "carbs": 5.6},
    {"id": "avocado", "name": "アボカド1/2個(60g)", "calories": 112, "protein": 1.5, "fat": 11.2, "carbs": 3.8},
    
    # その他
    {"id": "olive_oil", "name": "オリーブオイル(大さじ1)", "calories": 111, "protein": 0, "fat": 12.6, "carbs": 0},
    {"id": "nuts", "name": "ミックスナッツ(30g)", "calories": 182, "protein": 5.4, "fat": 16.2, "carbs": 5.7},
    {"id": "protein_powder", "name": "プロテイン1杯(30g)", "calories": 116, "protein": 24.0, "fat": 1.2, "carbs": 3.6},
]


def get_food_presets():
    """食品プリセット一覧を取得"""
    return FOOD_PRESETS


def add_meal_record(data):
    """食事記録を登録"""
    db = get_db()
    required = ['customer_id', 'date', 'meal_type', 'foods']
    if not all(k in data for k in required):
        return None, 'Missing required fields'
    
    # 合計カロリー・PFCを計算
    total_calories = sum(food.get('calories', 0) * food.get('quantity', 1) for food in data['foods'])
    total_protein = sum(food.get('protein', 0) * food.get('quantity', 1) for food in data['foods'])
    total_fat = sum(food.get('fat', 0) * food.get('quantity', 1) for food in data['foods'])
    total_carbs = sum(food.get('carbs', 0) * food.get('quantity', 1) for food in data['foods'])
    
    doc_ref = db.collection('meal_records').document()
    record_id = doc_ref.id
    
    doc_ref.set({
        'customer_id': data['customer_id'],
        'date': data['date'],
        'meal_type': data['meal_type'],  # breakfast, lunch, dinner, snack
        'foods': data['foods'],  # [{ food_id, name, calories, protein, fat, carbs, quantity }]
        'total_calories': total_calories,
        'total_protein': total_protein,
        'total_fat': total_fat,
        'total_carbs': total_carbs,
        'notes': data.get('notes', ''),
        'photo_url': data.get('photo_url', ''),
        'created_at': datetime.now().isoformat()
    })
    
    return record_id, None


def get_meal_records_by_customer(customer_id, start_date=None, end_date=None, limit=30):
    """顧客の食事記録一覧を取得"""
    db = get_db()
    query = db.collection('meal_records').where('customer_id', '==', customer_id)
    
    records = []
    for doc in query.stream():
        record = doc.to_dict()
        record['id'] = doc.id
        
        # 日付フィルタリング（Pythonで実施）
        if start_date and record.get('date', '') < start_date:
            continue
        if end_date and record.get('date', '') > end_date:
            continue
        
        records.append(record)
    
    # 日付でソート（新しい順）
    records.sort(key=lambda x: (x.get('date', ''), x.get('created_at', '')), reverse=True)
    return records[:limit]


def get_meal_record_by_id(record_id):
    """食事記録詳細を取得"""
    db = get_db()
    doc_ref = db.collection('meal_records').document(record_id)
    doc = doc_ref.get()
    
    if doc.exists:
        record = doc.to_dict()
        record['id'] = doc.id
        return record, None
    return None, 'Meal record not found'


def update_meal_record(record_id, data):
    """食事記録を更新"""
    db = get_db()
    
    # foodsが更新される場合は合計値を再計算
    if 'foods' in data:
        data['total_calories'] = sum(food.get('calories', 0) * food.get('quantity', 1) for food in data['foods'])
        data['total_protein'] = sum(food.get('protein', 0) * food.get('quantity', 1) for food in data['foods'])
        data['total_fat'] = sum(food.get('fat', 0) * food.get('quantity', 1) for food in data['foods'])
        data['total_carbs'] = sum(food.get('carbs', 0) * food.get('quantity', 1) for food in data['foods'])
    
    doc_ref = db.collection('meal_records').document(record_id)
    doc_ref.update(data)


def delete_meal_record(record_id):
    """食事記録を削除"""
    db = get_db()
    db.collection('meal_records').document(record_id).delete()


def get_daily_nutrition_summary(customer_id, date):
    """1日の栄養素サマリーを取得"""
    db = get_db()
    query = db.collection('meal_records').where('customer_id', '==', customer_id).where('date', '==', date)
    
    total_calories = 0
    total_protein = 0
    total_fat = 0
    total_carbs = 0
    meal_count = 0
    
    for doc in query.stream():
        record = doc.to_dict()
        total_calories += record.get('total_calories', 0)
        total_protein += record.get('total_protein', 0)
        total_fat += record.get('total_fat', 0)
        total_carbs += record.get('total_carbs', 0)
        meal_count += 1
    
    return {
        'date': date,
        'total_calories': round(total_calories, 1),
        'total_protein': round(total_protein, 1),
        'total_fat': round(total_fat, 1),
        'total_carbs': round(total_carbs, 1),
        'meal_count': meal_count
    }


def get_nutrition_goal(customer_id):
    """顧客の栄養目標を取得"""
    db = get_db()
    doc_ref = db.collection('nutrition_goals').document(customer_id)
    doc = doc_ref.get()
    
    if doc.exists:
        return doc.to_dict(), None
    
    # デフォルト目標（設定がない場合）
    return {
        'customer_id': customer_id,
        'target_calories': 2000,
        'target_protein': 150,
        'target_fat': 60,
        'target_carbs': 200
    }, None


def set_nutrition_goal(customer_id, data):
    """栄養目標を設定"""
    db = get_db()
    doc_ref = db.collection('nutrition_goals').document(customer_id)
    
    goal_data = {
        'customer_id': customer_id,
        'target_calories': data.get('target_calories', 2000),
        'target_protein': data.get('target_protein', 150),
        'target_fat': data.get('target_fat', 60),
        'target_carbs': data.get('target_carbs', 200),
        'updated_at': datetime.now().isoformat()
    }
    
    doc_ref.set(goal_data)
    return goal_data
