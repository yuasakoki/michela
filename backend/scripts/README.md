# MICHELA Backup & Restore Scripts

このディレクトリには、Firestore データベースのバックアップとリストアを行うためのスクリプトが含まれています。

## 📁 ファイル構成

```
scripts/
├── README.md                 # このファイル
├── backup_firestore.py       # バックアップスクリプト
├── restore_firestore.py      # リストアスクリプト
├── backup_cron.conf          # Cronジョブ設定例
└── backups/                  # バックアップファイルの保存先
    └── .gitkeep
```

## 🚀 クイックスタート

### バックアップの作成

```bash
# 本番環境のバックアップ
python backup_firestore.py --environment production

# ステージング環境のバックアップ
python backup_firestore.py --environment staging
```

### データのリストア

```bash
# ステージング環境にリストア（推奨：テスト用）
python restore_firestore.py \
  --environment staging \
  --backup-dir backups/production_2024-01-03_14-30-45

# 本番環境にリストア（要注意：--force フラグ必須）
python restore_firestore.py \
  --environment production \
  --backup-dir backups/production_2024-01-03_14-30-45 \
  --force
```

## 📖 詳細ドキュメント

完全なドキュメントは以下を参照してください：

- **[バックアップ・リストアガイド](../../docs/BACKUP_GUIDE.md)** - 詳細な使用方法とベストプラクティス
- **[ステージング環境セットアップ](../../docs/STAGING_SETUP.md)** - ステージング環境の構築方法

## 🛠️ スクリプトの詳細

### backup_firestore.py

Firestore の全コレクションを JSON ファイルにバックアップします。

**主な機能:**
- 本番環境とステージング環境の両方に対応
- コレクションごとに個別の JSON ファイルを作成
- バックアップメタデータを自動生成
- タイムスタンプ付きディレクトリに保存

**オプション:**
```
--environment {production,staging,prod,stg}
    バックアップする環境 (デフォルト: production)

--output-dir PATH
    バックアップファイルの出力先ディレクトリ
    (デフォルト: backups/環境_YYYY-MM-DD_HH-MM-SS)
```

### restore_firestore.py

バックアップファイルから Firestore にデータをリストアします。

**主な機能:**
- 本番環境とステージング環境の両方に対応
- ドライラン機能でリストア前の確認が可能
- 安全性のための確認プロンプト
- バックアップメタデータの自動読み込み

**オプション:**
```
--environment {production,staging,prod,stg}
    リストア先の環境 (デフォルト: staging - 安全のため)

--backup-dir PATH
    バックアップファイルのディレクトリ (必須)

--dry-run
    実際にデータを変更せずに動作をテスト

--force
    本番環境へのリストアを許可（必須フラグ）
```

## ⚠️ 重要な注意事項

1. **本番環境へのリストアは慎重に**
   - 必ず `--force` フラグを明示的に指定
   - 事前にドライラン（`--dry-run`）でテスト
   - バックアップメタデータを確認

2. **認証情報の設定**
   - 環境変数 `GOOGLE_CREDENTIALS` または
   - `backend/keys/` にサービスアカウントキーファイル

3. **バックアップファイルの管理**
   - バックアップは `backups/` ディレクトリに保存
   - `.gitignore` で Git 管理外に設定済み
   - 定期的に古いバックアップを削除

## 🔄 自動バックアップの設定

### GitHub Actions

`.github/workflows/backup.yml` で自動バックアップが設定されています：
- 毎日 2:00 AM UTC に自動実行
- 手動トリガーも可能

### Cron ジョブ

`backup_cron.conf` に設定例があります：

```bash
# crontab を編集
crontab -e

# 毎日 2:00 AM に本番環境をバックアップ
0 2 * * * cd /path/to/michela/backend && python scripts/backup_firestore.py --environment production
```

## 🧪 テスト手順

### 1. バックアップのテスト

```bash
# ステージング環境でテスト
python backup_firestore.py --environment staging

# 出力を確認
ls -la backups/staging_*/
cat backups/staging_*/backup_metadata.json
```

### 2. リストアのテスト

```bash
# ドライランで確認
python restore_firestore.py \
  --environment staging \
  --backup-dir backups/staging_2024-01-03_14-30-45 \
  --dry-run

# 実際にリストア
python restore_firestore.py \
  --environment staging \
  --backup-dir backups/staging_2024-01-03_14-30-45
```

## 📊 バックアップファイルの構造

各バックアップディレクトリには以下が含まれます：

```
backups/production_2024-01-03_14-30-45/
├── backup_metadata.json    # バックアップ情報
├── customers.json          # ユーザーデータ
├── weights.json            # 体重記録
├── trainings.json          # トレーニング記録
├── meals.json              # 食事記録
└── research_logs.json      # 研究ログ
```

## 🔍 トラブルシューティング

### Firebase 認証エラー

```bash
# 環境変数を設定
export GOOGLE_CREDENTIALS=$(cat ../keys/michela-*.json)

# または .env ファイルを使用
cp ../.env.example ../.env
# .env を編集して GOOGLE_CREDENTIALS を設定
```

### 権限エラー

Firebase Console でサービスアカウントの権限を確認：
- Cloud Datastore User
- Firebase Admin SDK Administrator Service Agent

### バックアップファイルの検証

```bash
# JSON ファイルの整合性を確認
for file in backups/production_*/*.json; do
  python -m json.tool "$file" > /dev/null && echo "$file: OK" || echo "$file: INVALID"
done
```

## 🔗 関連リンク

- [バックアップ・リストアガイド](../../docs/BACKUP_GUIDE.md)
- [ステージング環境セットアップ](../../docs/STAGING_SETUP.md)
- [Firebase Firestore ドキュメント](https://firebase.google.com/docs/firestore)

## 📞 サポート

質問や問題がある場合は、GitHub Issues で報告してください。
