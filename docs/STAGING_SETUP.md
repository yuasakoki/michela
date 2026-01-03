# ステージング環境セットアップガイド

## 概要

このドキュメントでは、MICHELA のステージング環境のセットアップ方法について説明します。

## 📋 目次

1. [環境の種類](#環境の種類)
2. [ローカル開発環境でのステージング](#ローカル開発環境でのステージング)
3. [Docker Composeを使用したステージング](#docker-composeを使用したステージング)
4. [Render.comでのステージング環境](#rendercomでのステージング環境)
5. [Vercelでのステージング環境](#vercelでのステージング環境)
6. [トラブルシューティング](#トラブルシューティング)

## 環境の種類

MICHELAは以下の環境をサポートしています：

| 環境 | 用途 | データベース |
|------|------|--------------|
| **Production** | 本番環境 | Firebase Firestore (Production) |
| **Staging** | ステージング・テスト環境 | Firebase Firestore (Staging) |
| **Development** | ローカル開発環境 | Firebase Firestore (Development) |

## ローカル開発環境でのステージング

### 1. 環境変数ファイルの作成

#### フロントエンド

```bash
# プロジェクトルートで
cp .env.staging.example .env.staging
```

`.env.staging` を編集して、ステージング環境の設定を入力：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_staging_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-staging-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-staging-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-staging-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_staging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_staging_app_id
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ENVIRONMENT=staging
```

#### バックエンド

```bash
# backend/ ディレクトリで
cp .env.staging.example .env.staging
```

`backend/.env.staging` を編集：

```env
GEMINI_API_KEY=your_staging_gemini_api_key
FLASK_ENV=staging
FLASK_DEBUG=False
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
ENVIRONMENT=staging
```

### 2. Firebase Staging プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 新しいプロジェクトを作成（例：`michela-staging`）
3. Firestore データベースを有効化
4. サービスアカウントキーを生成してダウンロード
5. `backend/keys/michela-staging-*.json` として保存

### 3. ステージング環境でアプリケーションを起動

```bash
# バックエンド
cd backend
export GOOGLE_CREDENTIALS=$(cat keys/michela-staging-*.json)
python src/app/logic/api.py

# 別のターミナルでフロントエンド
cd frontend
npm run dev -- --env-file ../.env.staging
```

## Docker Composeを使用したステージング

Docker Composeを使用すると、本番環境に近い環境でテストできます。

### 1. 環境変数の準備

上記の「ローカル開発環境でのステージング」の手順1-2を実行

### 2. Dockerイメージのビルドと起動

```bash
# プロジェクトルートで
docker-compose up --build
```

これにより以下が起動します：
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:5000

### 3. 停止

```bash
docker-compose down
```

### トラブルシューティング

**ポートが既に使用されている場合:**

```bash
# docker-compose.yml のポート設定を変更
ports:
  - "3001:3000"  # フロントエンド
  - "5001:5000"  # バックエンド
```

## Render.comでのステージング環境

### 1. Render.com ダッシュボードでの設定

1. [Render.com](https://render.com/) にログイン
2. "New +" → "Web Service" を選択
3. GitHubリポジトリを接続
4. 設定：
   - **Name**: `michela-backend-staging`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python src/app/logic/api.py`
   - **Branch**: `staging` または `main`

### 2. 環境変数の設定

Render.com ダッシュボードの "Environment" タブで以下を設定：

```
GOOGLE_CREDENTIALS={"type":"service_account", ...}  # JSON全体
GEMINI_API_KEY=your_staging_gemini_api_key
ENVIRONMENT=staging
FLASK_ENV=staging
FLASK_DEBUG=False
```

### 3. デプロイ

"Manual Deploy" → "Deploy latest commit" でデプロイを実行

ステージングAPIのURL: `https://michela-backend-staging.onrender.com`

## Vercelでのステージング環境

### 1. Vercel ダッシュボードでの設定

1. [Vercel](https://vercel.com/) にログイン
2. プロジェクトを選択
3. "Settings" → "Environment Variables"

### 2. ステージング環境変数の追加

"Preview" スコープで以下を設定：

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_staging_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-staging-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-staging-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-staging-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_staging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_staging_app_id
NEXT_PUBLIC_API_URL=https://michela-backend-staging.onrender.com
NEXT_PUBLIC_ENVIRONMENT=staging
```

### 3. ブランチからデプロイ

```bash
git checkout -b staging
git push origin staging
```

Vercelが自動的にデプロイを実行し、プレビューURLを生成します。

### 4. 固定URLの設定（オプション）

Vercel ダッシュボードで "Domains" タブから：
- カスタムドメインを追加（例：`staging.michela.app`）
- または Vercel のサブドメインを使用（例：`michela-staging.vercel.app`）

## 環境間のデータ移行

### 本番データをステージングにコピー

```bash
# 1. 本番環境のバックアップを作成
cd backend
python scripts/backup_firestore.py --environment production

# 2. ステージング環境にリストア
python scripts/restore_firestore.py \
  --environment staging \
  --backup-dir scripts/backups/production_YYYY-MM-DD_HH-MM-SS
```

詳細は [BACKUP_GUIDE.md](./BACKUP_GUIDE.md) を参照してください。

## 環境の確認

### 現在の環境を確認する方法

**フロントエンド:**
- ブラウザのコンソールで `window.location.hostname` を確認
- 環境識別子は `process.env.NEXT_PUBLIC_ENVIRONMENT`

**バックエンド:**
- APIエンドポイント `/health` または `/api/environment` で確認

```bash
curl http://localhost:5000/health
```

## トラブルシューティング

### 問題: CORSエラーが発生する

**解決策:** バックエンドの `api.py` でステージングURLをCORS設定に追加

```python
CORS(app, 
     origins=[
         "http://localhost:3000",
         "https://michela-staging.vercel.app",
         # ... 他のURL
     ])
```

### 問題: Firebase接続エラー

**解決策:** 
1. 環境変数が正しく設定されているか確認
2. Firebase プロジェクトIDが正しいか確認
3. サービスアカウントキーの権限を確認

### 問題: Docker Composeが起動しない

**解決策:**
```bash
# ログを確認
docker-compose logs backend
docker-compose logs frontend

# コンテナを削除して再ビルド
docker-compose down -v
docker-compose up --build
```

## セキュリティのベストプラクティス

1. **環境変数を分離**: 本番とステージングで異なる認証情報を使用
2. **アクセス制限**: ステージング環境へのアクセスを制限（IP制限、Basic認証など）
3. **定期的なクリーンアップ**: ステージング環境のデータを定期的にクリーンアップ
4. **本番データの取扱い注意**: 本番データをステージングにコピーする際は個人情報を匿名化

## 次のステップ

- [バックアップ・リストアガイド](./BACKUP_GUIDE.md)
- [デプロイメントワークフロー](./DEPLOYMENT.md)
- [セキュリティガイド](./SECURITY.md)

## 参考リンク

- [Firebase プロジェクトの管理](https://firebase.google.com/docs/projects/learn-more)
- [Render.com ドキュメント](https://render.com/docs)
- [Vercel ドキュメント](https://vercel.com/docs)
- [Docker Compose ドキュメント](https://docs.docker.com/compose/)
