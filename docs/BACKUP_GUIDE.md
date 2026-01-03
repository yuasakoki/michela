# バックアップ・リストアガイド

## 概要

このドキュメントでは、MICHELA の Firestore データベースのバックアップとリストアの方法について説明します。

## 📋 目次

1. [バックアップの重要性](#バックアップの重要性)
2. [手動バックアップ](#手動バックアップ)
3. [自動バックアップ](#自動バックアップ)
4. [データのリストア](#データのリストア)
5. [バックアップの管理](#バックアップの管理)
6. [トラブルシューティング](#トラブルシューティング)

## バックアップの重要性

### なぜバックアップが必要か？

- **データ損失の防止**: 誤操作や不具合からデータを保護
- **災害復旧**: 重大な障害が発生した場合の復旧手段
- **テスト環境の構築**: 本番データをステージング環境にコピー
- **監査とコンプライアンス**: データの履歴管理

### バックアップ戦略

MICHELAでは以下のバックアップ戦略を推奨します：

- **日次バックアップ**: 毎日自動的にバックアップを作成
- **週次バックアップ**: 毎週日曜日に長期保存用バックアップを作成
- **変更前バックアップ**: 大きな変更やデプロイの前に手動バックアップを作成

## 手動バックアップ

### 前提条件

- Python 3.11以上
- 必要なパッケージがインストール済み
- Firebase認証情報が設定済み

### 基本的な使い方

#### 本番環境のバックアップ

```bash
cd backend
python scripts/backup_firestore.py --environment production
```

実行結果：
```
============================================================
MICHELA Firestore Backup
============================================================
Environment: production
Output directory: backend/scripts/backups/production_2024-01-03_14-30-45
============================================================

Found 5 collections to backup

Backing up collection: customers
  ✓ Backed up 150 documents to .../customers.json
Backing up collection: weights
  ✓ Backed up 1250 documents to .../weights.json
Backing up collection: trainings
  ✓ Backed up 3400 documents to .../trainings.json
...

✓ Backup completed successfully!
  Total collections: 5
  Total documents: 5234
  Output directory: backend/scripts/backups/production_2024-01-03_14-30-45
============================================================
```

#### ステージング環境のバックアップ

```bash
python scripts/backup_firestore.py --environment staging
```

#### カスタム出力ディレクトリの指定

```bash
python scripts/backup_firestore.py \
  --environment production \
  --output-dir /path/to/backup/directory
```

### バックアップファイルの構造

バックアップは以下の構造で保存されます：

```
backend/scripts/backups/
└── production_2024-01-03_14-30-45/
    ├── backup_metadata.json    # バックアップのメタデータ
    ├── customers.json          # ユーザーデータ
    ├── weights.json            # 体重記録
    ├── trainings.json          # トレーニング記録
    ├── meals.json              # 食事記録
    └── research_logs.json      # 研究ログ
```

#### backup_metadata.json の例

```json
{
  "backup_date": "2024-01-03T14:30:45.123456",
  "environment": "production",
  "collections": [
    "customers",
    "weights",
    "trainings",
    "meals",
    "research_logs"
  ],
  "total_documents": 5234,
  "backup_version": "1.0"
}
```

## 自動バックアップ

### GitHub Actions を使用した自動バックアップ

#### セットアップ

1. GitHub リポジトリの Settings → Secrets and variables → Actions
2. 以下のシークレットを追加：
   - `GOOGLE_CREDENTIALS_PRODUCTION`: 本番環境のFirebase認証情報（JSON）
   - `GOOGLE_CREDENTIALS_STAGING`: ステージング環境のFirebase認証情報（JSON）
   - `GEMINI_API_KEY`: Gemini APIキー

#### 自動実行

GitHub Actions ワークフローは以下のスケジュールで自動実行されます：

- **毎日 2:00 AM UTC**: 本番環境の自動バックアップ

#### 手動実行

GitHub リポジトリで：
1. "Actions" タブをクリック
2. "Firestore Backup" ワークフローを選択
3. "Run workflow" をクリック
4. 環境（production/staging）を選択して実行

### Cron ジョブを使用した自動バックアップ

#### Linux/macOS でのセットアップ

```bash
# crontab を編集
crontab -e

# 毎日 2:00 AM に本番環境をバックアップ
0 2 * * * cd /path/to/michela/backend && /usr/bin/python3 scripts/backup_firestore.py --environment production

# 毎週日曜日 3:00 AM にステージング環境をバックアップ
0 3 * * 0 cd /path/to/michela/backend && /usr/bin/python3 scripts/backup_firestore.py --environment staging
```

詳細は `backend/scripts/backup_cron.conf` を参照してください。

### Render.com でのスケジュール実行

`backend/render.yaml` に以下を追加：

```yaml
- type: cron
  name: firestore-backup-daily
  env: python
  schedule: "0 2 * * *"  # 毎日 2:00 AM UTC
  buildCommand: pip install -r requirements.txt
  startCommand: python scripts/backup_firestore.py --environment production
  envVars:
    - key: GOOGLE_CREDENTIALS
      sync: false  # Render ダッシュボードで設定
```

## データのリストア

### ⚠️ 重要な注意事項

- リストアは既存データを上書きします
- 本番環境へのリストアは慎重に行ってください
- テストはステージング環境で実施してください

### ステージング環境へのリストア

```bash
cd backend

# バックアップディレクトリを指定してリストア
python scripts/restore_firestore.py \
  --environment staging \
  --backup-dir scripts/backups/production_2024-01-03_14-30-45
```

実行時の確認プロンプト：
```
Type 'yes' to continue: yes
```

### 本番環境へのリストア（要注意）

本番環境へのリストアには `--force` フラグが必要です：

```bash
python scripts/restore_firestore.py \
  --environment production \
  --backup-dir scripts/backups/production_2024-01-03_14-30-45 \
  --force
```

実行時の確認プロンプト：
```
⚠️  Type 'RESTORE TO PRODUCTION' to continue: RESTORE TO PRODUCTION
```

### ドライラン（テスト実行）

実際にデータを変更せずに動作を確認：

```bash
python scripts/restore_firestore.py \
  --environment staging \
  --backup-dir scripts/backups/production_2024-01-03_14-30-45 \
  --dry-run
```

出力例：
```
[DRY RUN MODE - No data will be modified]
...
Restoring collection: customers
  [DRY RUN] Would restore document: user001
  [DRY RUN] Would restore document: user002
  [DRY RUN] Would restore 150 documents
```

## バックアップの管理

### バックアップの保存場所

**ローカル環境:**
- `backend/scripts/backups/`

**GitHub Actions:**
- GitHub Actions のアーティファクト（30日間保存）
- Actions タブから "Firestore Backup" ワークフローを選択してダウンロード

**推奨される外部保存先:**
- Google Cloud Storage
- AWS S3
- Azure Blob Storage
- Dropbox / Google Drive（小規模プロジェクトの場合）

### バックアップの保持期間

推奨される保持ポリシー：

| バックアップタイプ | 保持期間 | 保存頻度 |
|-------------------|---------|---------|
| 日次バックアップ | 7日間 | 毎日 |
| 週次バックアップ | 4週間 | 毎週日曜日 |
| 月次バックアップ | 12ヶ月 | 毎月1日 |
| リリース前バックアップ | 無期限 | 手動 |

### 古いバックアップの削除

#### 手動削除

```bash
# 7日以上前のバックアップを削除
find backend/scripts/backups -name "production_*" -type d -mtime +7 -exec rm -rf {} \;
```

#### 自動削除（Cronジョブ）

```bash
# crontab に追加
0 4 * * * find /path/to/michela/backend/scripts/backups -name "production_*" -type d -mtime +7 -exec rm -rf {} \;
```

### バックアップのバリデーション

バックアップが正常に作成されたか確認：

```bash
# メタデータファイルの確認
cat backend/scripts/backups/production_2024-01-03_14-30-45/backup_metadata.json

# JSONファイルの検証
python -m json.tool backend/scripts/backups/production_2024-01-03_14-30-45/customers.json > /dev/null && echo "Valid JSON"
```

## 一般的なシナリオ

### シナリオ1: 本番データをステージングにコピー

```bash
# 1. 本番環境のバックアップ
python scripts/backup_firestore.py --environment production

# 2. バックアップディレクトリを確認
ls -la scripts/backups/

# 3. ステージング環境にリストア
python scripts/restore_firestore.py \
  --environment staging \
  --backup-dir scripts/backups/production_2024-01-03_14-30-45
```

### シナリオ2: デプロイ前のバックアップ

```bash
# デプロイ前に本番環境をバックアップ
python scripts/backup_firestore.py \
  --environment production \
  --output-dir scripts/backups/pre-deploy-$(date +%Y%m%d)
```

### シナリオ3: 災害復旧

```bash
# 1. 最新のバックアップを確認
ls -lt scripts/backups/ | head

# 2. ドライランで確認
python scripts/restore_firestore.py \
  --environment production \
  --backup-dir scripts/backups/production_2024-01-03_14-30-45 \
  --dry-run

# 3. 本番環境にリストア
python scripts/restore_firestore.py \
  --environment production \
  --backup-dir scripts/backups/production_2024-01-03_14-30-45 \
  --force
```

## トラブルシューティング

### 問題: Firebase認証エラー

**エラーメッセージ:**
```
FileNotFoundError: Firebase credentials not found
```

**解決策:**
1. 環境変数 `GOOGLE_CREDENTIALS` が設定されているか確認
2. または `backend/keys/` にサービスアカウントキーファイルがあるか確認

```bash
# 環境変数を設定
export GOOGLE_CREDENTIALS=$(cat backend/keys/michela-*.json)
```

### 問題: 権限エラー

**エラーメッセージ:**
```
PermissionError: Permission denied to access collection
```

**解決策:**
Firebase サービスアカウントに適切な権限があるか確認：
- Cloud Datastore User
- Firebase Admin SDK Administrator Service Agent

### 問題: バックアップファイルが大きすぎる

**解決策:**
- 外部ストレージ（Cloud Storage）を使用
- バックアップを圧縮

```bash
# バックアップを圧縮
tar -czf backup.tar.gz scripts/backups/production_2024-01-03_14-30-45/
```

### 問題: リストアが途中で失敗する

**解決策:**
1. ネットワーク接続を確認
2. Firebase の割り当て制限を確認
3. バックアップファイルの整合性を確認

```bash
# JSONファイルの検証
for file in scripts/backups/production_*/*.json; do
  python -m json.tool "$file" > /dev/null && echo "$file: OK" || echo "$file: INVALID"
done
```

## セキュリティのベストプラクティス

1. **バックアップファイルの暗号化**: 機密データを含むバックアップは暗号化
2. **アクセス制御**: バックアップディレクトリへのアクセスを制限
3. **定期的なテスト**: リストア手順を定期的にテスト
4. **監査ログ**: バックアップとリストアの操作をログに記録

```bash
# バックアップを暗号化
gpg --symmetric --cipher-algo AES256 scripts/backups/production_2024-01-03_14-30-45.tar.gz
```

## 次のステップ

- [ステージング環境セットアップガイド](./STAGING_SETUP.md)
- [デプロイメントワークフロー](./DEPLOYMENT.md)
- [モニタリングとアラート](./MONITORING.md)

## 参考リンク

- [Firebase Backup and Export](https://firebase.google.com/docs/firestore/manage-data/export-import)
- [Google Cloud Storage](https://cloud.google.com/storage/docs)
- [Cron式の解説](https://crontab.guru/)
