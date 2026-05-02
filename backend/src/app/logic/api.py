"""Flask APIエントリーポイント"""
import re
import os
import sys
import json
from flask import Flask
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv

# .envファイルから環境変数を読み込み（サービスインポート前に実行）
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

# パスを追加してservicesモジュールをインポート可能にする
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# サービスモジュールのインポート（.env読み込み後）
from app.services import user_service

# Firebase認証情報の読み込み（ローカル/本番環境対応）
if 'GOOGLE_CREDENTIALS' in os.environ:
    # 本番環境（Render.com）: 環境変数から読み込み
    cred_dict = json.loads(os.environ['GOOGLE_CREDENTIALS'])
    cred = credentials.Certificate(cred_dict)
else:
    # ローカル環境: JSONファイルから読み込み
    key_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'keys', 'michela-481217-ca8c2322cbd0.json')
    cred = credentials.Certificate(key_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
    print("Firebase initialized")
    # デフォルトユーザーを初期化（初回のみ）
    user_service.initialize_default_users()

# Flaskアプリケーション作成
app = Flask(__name__)

# CORS設定
CORS(app,
     origins=[
         "http://localhost:3000",
         "http://localhost:3001",
         "http://localhost:3002",
         "http://localhost:3003",
         "https://michela.vercel.app",
         "https://michela-git-main.vercel.app",
         re.compile(r"^https://michela-.*\.vercel\.app$")
     ],
     supports_credentials=True)

# Blueprintルートの登録
from app.logic.routes import (
    auth_bp,
    customer_bp,
    weight_bp,
    ai_bp,
    research_bp,
    training_bp,
    meal_bp,
    backup_bp,
)

app.register_blueprint(auth_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(weight_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(research_bp)
app.register_blueprint(training_bp)
app.register_blueprint(meal_bp)
app.register_blueprint(backup_bp)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
