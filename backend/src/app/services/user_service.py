"""ユーザー管理サービス"""
from firebase_admin import firestore
import hashlib
from datetime import datetime

def _get_db():
    """Firestoreクライアントを取得"""
    return firestore.client()

def hash_password(password: str) -> str:
    """パスワードをSHA-256でハッシュ化"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(username: str, password: str, role: int = 0, email: str = None):
    """
    新しいユーザーを作成
    
    Args:
        username: ユーザー名（ログイン時に使用）
        password: パスワード（ハッシュ化される）
        role: 0=使用者, 1=開発者
        email: メールアドレス（オプション）
    
    Returns:
        (user_id, error)
    """
    try:
        db = _get_db()
        # ユーザー名の重複チェック
        existing_users = db.collection('users').where('username', '==', username).limit(1).stream()
        if any(existing_users):
            return None, 'Username already exists'
        
        user_data = {
            'username': username,
            'password_hash': hash_password(password),
            'role': role,  # 0: 使用者, 1: 開発者
            'email': email,
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        doc_ref = db.collection('users').document()
        doc_ref.set(user_data)
        
        return doc_ref.id, None
    except Exception as e:
        return None, str(e)

def authenticate_user(username: str, password: str):
    """
    ユーザー認証
    
    Returns:
        (user_data, error)
    """
    try:
        db = _get_db()
        users = db.collection('users').where('username', '==', username).where('is_active', '==', True).limit(1).stream()
        
        for user_doc in users:
            user_data = user_doc.to_dict()
            user_data['id'] = user_doc.id
            
            # パスワード検証
            if user_data['password_hash'] == hash_password(password):
                # パスワードハッシュを除外して返す
                return {
                    'id': user_data['id'],
                    'username': user_data['username'],
                    'role': user_data['role'],
                    'email': user_data.get('email')
                }, None
        
        return None, 'Invalid username or password'
    except Exception as e:
        return None, str(e)

def get_all_users():
    """全ユーザーを取得（管理者用）"""
    try:
        db = _get_db()
        users = db.collection('users').stream()
        result = []
        for user in users:
            user_data = user.to_dict()
            user_data['id'] = user.id
            # パスワードハッシュを除外
            user_data.pop('password_hash', None)
            result.append(user_data)
        return result
    except Exception as e:
        print(f"Error getting users: {e}")
        return []

def update_user(user_id: str, data: dict):
    """ユーザー情報を更新"""
    try:
        db = _get_db()
        update_data = {}
        
        if 'username' in data:
            # ユーザー名の重複チェック（自分以外）
            existing_users = db.collection('users').where('username', '==', data['username']).limit(1).stream()
            for existing_user in existing_users:
                if existing_user.id != user_id:
                    return 'Username already exists'
            update_data['username'] = data['username']
        
        if 'password' in data and data['password']:
            update_data['password_hash'] = hash_password(data['password'])
        
        if 'role' in data:
            update_data['role'] = data['role']
        
        if 'email' in data:
            update_data['email'] = data['email']
        
        if 'is_active' in data:
            update_data['is_active'] = data['is_active']
        
        update_data['updated_at'] = datetime.now().isoformat()
        
        db.collection('users').document(user_id).update(update_data)
        return None
    except Exception as e:
        return str(e)

def delete_user(user_id: str):
    """ユーザーを削除（論理削除）"""
    try:
        db = _get_db()
        db.collection('users').document(user_id).update({
            'is_active': False,
            'updated_at': datetime.now().isoformat()
        })
        return None
    except Exception as e:
        return str(e)

def initialize_default_users():
    """デフォルトユーザーを初期化（初回セットアップ用）"""
    try:
        db = _get_db()
        # 開発者アカウント（admin）
        admin_exists = db.collection('users').where('username', '==', 'admin').limit(1).stream()
        if not any(admin_exists):
            create_user('admin', '1234', role=1, email='admin@michela.local')
            print("✅ Default admin user created: admin/1234")
        
        # 使用者アカウント（user）
        user_exists = db.collection('users').where('username', '==', 'user').limit(1).stream()
        if not any(user_exists):
            create_user('user', 'user123', role=0, email='user@michela.local')
            print("✅ Default user created: user/user123")
    except Exception as e:
        print(f"Error initializing users: {e}")
