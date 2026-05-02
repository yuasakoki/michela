"""バックアップ・復元サービス"""
from firebase_admin import firestore
from datetime import datetime
from . import customer_service, weight_service, training_service, meal_service


def get_db():
    """Firestoreクライアントを取得"""
    return firestore.client()


def create_backup() -> tuple[dict | None, str | None]:
    """全データをJSON形式でバックアップ

    Returns:
        tuple: (backup_data, None) on success, (None, error_message) on failure
    """
    try:
        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'version': '1.0',
            'collections': {
                'customers': customer_service.get_all_customers(),
                'weight_history': [],
                'training_sessions': [],
                'meal_records': [],
                'nutrition_goals': []
            }
        }

        customers = customer_service.get_all_customers()
        for customer in customers:
            customer_id = customer['id']

            # 体重履歴
            weight_history = weight_service.get_weight_history(customer_id, limit=1000)
            for record in weight_history:
                record['customer_id'] = customer_id
            backup_data['collections']['weight_history'].extend(weight_history)

            # トレーニングセッション
            training_sessions = training_service.get_training_sessions_by_customer(customer_id, limit=1000)
            backup_data['collections']['training_sessions'].extend(training_sessions)

            # 食事記録
            meal_records = meal_service.get_meal_records_by_customer(customer_id, limit=1000)
            backup_data['collections']['meal_records'].extend(meal_records)

            # 栄養目標
            goal, _ = meal_service.get_nutrition_goal(customer_id)
            if goal:
                backup_data['collections']['nutrition_goals'].append(goal)

        return backup_data, None
    except Exception as e:
        return None, str(e)


def restore_backup(data: dict) -> tuple[dict | None, str | None]:
    """バックアップデータを復元

    Args:
        data: バックアップデータ（collections キーを含む辞書）

    Returns:
        tuple: (restored_counts, None) on success, (None, error_message) on failure
    """
    try:
        if not data or 'collections' not in data:
            return None, 'Invalid backup data'

        db = get_db()
        collections = data['collections']
        restored_counts = {
            'customers': 0,
            'weight_history': 0,
            'training_sessions': 0,
            'meal_records': 0,
            'nutrition_goals': 0
        }

        # 顧客データを復元
        if 'customers' in collections:
            for customer_data in collections['customers']:
                customer_id = customer_data.get('id')
                if customer_id:
                    update_data = {k: v for k, v in customer_data.items() if k != 'id'}
                    db.collection('customer').document(customer_id).set(update_data)
                    restored_counts['customers'] += 1

        # 体重履歴を復元
        if 'weight_history' in collections:
            for record in collections['weight_history']:
                record_id = record.get('id')
                if record_id:
                    update_data = {k: v for k, v in record.items() if k != 'id'}
                    db.collection('weight_history').document(record_id).set(update_data)
                    restored_counts['weight_history'] += 1

        # トレーニングセッションを復元
        if 'training_sessions' in collections:
            for session in collections['training_sessions']:
                session_id = session.get('id')
                if session_id:
                    update_data = {k: v for k, v in session.items() if k != 'id'}
                    db.collection('training_sessions').document(session_id).set(update_data)
                    restored_counts['training_sessions'] += 1

        # 食事記録を復元
        if 'meal_records' in collections:
            for record in collections['meal_records']:
                record_id = record.get('id')
                if record_id:
                    update_data = {k: v for k, v in record.items() if k != 'id'}
                    db.collection('meal_records').document(record_id).set(update_data)
                    restored_counts['meal_records'] += 1

        # 栄養目標を復元
        if 'nutrition_goals' in collections:
            for goal in collections['nutrition_goals']:
                customer_id = goal.get('customer_id')
                if customer_id:
                    update_data = {k: v for k, v in goal.items() if k != 'customer_id'}
                    db.collection('nutrition_goals').document(customer_id).set(update_data)
                    restored_counts['nutrition_goals'] += 1

        return restored_counts, None
    except Exception as e:
        return None, str(e)
