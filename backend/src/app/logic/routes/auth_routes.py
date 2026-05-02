"""認証・ユーザー管理エンドポイント"""
import jwt
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, make_response, g

from app.services import user_service

auth_bp = Blueprint('auth', __name__)

JWT_SECRET = "CHANGE_ME_SUPER_SECRET"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 1

# 本番環境判定
import os
IS_PRODUCTION = 'GOOGLE_CREDENTIALS' in os.environ


def get_token_from_request():
    """リクエストからJWTトークンを取得"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header[7:]
    return request.cookies.get('michela_auth_token')


def jwt_required(f):
    """JWT認証が必要なエンドポイント用デコレータ"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_request()

        if not token:
            return jsonify({"error": "Authentication required", "expired": False}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            g.current_user = {
                "user_id": payload.get("user_id"),
                "role": payload.get("role")
            }
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired", "expired": True}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token", "expired": False}), 401

    return decorated_function


@auth_bp.route('/login', methods=['POST'])
def login():
    """ユーザーログイン"""
    print("========== LOGIN START ==========")
    print(f"IS_PRODUCTION: {IS_PRODUCTION}")
    print(f"Request Origin: {request.headers.get('Origin')}")

    data = request.json
    print(f"Request data: username={data.get('username') if data else 'None'}")

    if not data or 'username' not in data or 'password' not in data:
        print("ERROR: Username and password are required")
        return jsonify({"error": "Username and password are required"}), 400

    user_data, error = user_service.authenticate_user(
        data['username'],
        data['password']
    )
    if error:
        print(f"AUTH ERROR: {error}")
        return jsonify({'error': error}), 401

    print(f"AUTH SUCCESS: user_id={user_data['id']}")

    payload = {
        "user_id": user_data["id"],
        "role": user_data.get("role"),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=JWT_EXPIRE_DAYS)
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    print(f"JWT created: {token[:50]}...")

    response_data = {
        "message": "Login successful",
        "user": user_data,
        "token": token
    }
    response = make_response(jsonify(response_data), 200)

    if not IS_PRODUCTION:
        response.set_cookie(
            'michela_auth_token',
            token,
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=JWT_EXPIRE_DAYS * 24 * 60 * 60,
            path='/'
        )
        print("Cookie set for local development")

    print("========== LOGIN END (SUCCESS) ==========")
    return response


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """ユーザーログアウト"""
    response = make_response(jsonify({
        "message": "Logout successful"
    }), 200)

    response.set_cookie(
        'michela_auth_token',
        '',
        httponly=True,
        secure=IS_PRODUCTION,
        samesite='None' if IS_PRODUCTION else 'Lax',
        max_age=0,
        path='/'
    )

    return response


@auth_bp.route('/verify_token', methods=['GET'])
def verify_token():
    """トークン検証エンドポイント"""
    token = get_token_from_request()

    if not token:
        return jsonify({"error": "No token provided", "valid": False}), 401

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return jsonify({
            "valid": True,
            "user_id": payload.get("user_id"),
            "role": payload.get("role"),
            "exp": payload.get("exp")
        }), 200
    except jwt.ExpiredSignatureError:
        return jsonify({
            "error": "Token expired",
            "valid": False,
            "expired": True
        }), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token", "valid": False}), 401


@auth_bp.route('/get_users', methods=['GET'])
def get_users():
    """全ユーザーを取得（管理者用）"""
    users = user_service.get_all_users()
    return jsonify(users), 200


@auth_bp.route('/create_user', methods=['POST'])
def create_user_endpoint():
    """新しいユーザーを作成（管理者用）"""
    data = request.json
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Username and password are required"}), 400

    user_id, error = user_service.create_user(
        username=data['username'],
        password=data['password'],
        role=data.get('role', 0),
        email=data.get('email')
    )

    if error:
        return jsonify({'error': error}), 400

    return jsonify({"message": "User created", "id": user_id}), 201


@auth_bp.route('/update_user/<user_id>', methods=['PUT'])
def update_user_endpoint(user_id):
    """ユーザー情報を更新（管理者用）"""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    error = user_service.update_user(user_id, data)
    if error:
        return jsonify({'error': error}), 400

    return jsonify({"message": "User updated"}), 200


@auth_bp.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_user_endpoint(user_id):
    """ユーザーを削除（管理者用）"""
    error = user_service.delete_user(user_id)
    if error:
        return jsonify({'error': error}), 500

    return jsonify({"message": "User deleted"}), 200
