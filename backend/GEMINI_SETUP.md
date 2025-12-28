# Gemini API 設定ガイド

## 1. Gemini APIキーの取得

### Google AI Studioでの取得方法

1. **Google AI Studioにアクセス**
   - URL: https://makersuite.google.com/app/apikey
   - Googleアカウントでログイン

2. **APIキーを作成**
   - "Create API Key"ボタンをクリック
   - 既存のGoogle Cloudプロジェクトを選択、または新規作成
   - APIキーが生成される（例: `AIzaSy...`）

3. **APIキーをコピー**
   - 生成されたキーをコピーして安全に保管

## 2. ローカル環境での設定

### Windowsの場合

**PowerShellで環境変数を設定:**
```powershell
$env:GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

**永続的に設定する場合:**
1. システムの環境変数設定を開く
2. 新しい環境変数を追加:
   - 変数名: `GEMINI_API_KEY`
   - 値: 取得したAPIキー

### macOS/Linuxの場合

**~/.bashrc または ~/.zshrc に追加:**
```bash
export GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

**設定を反映:**
```bash
source ~/.bashrc  # または source ~/.zshrc
```

## 3. バックエンドの起動

### 依存パッケージのインストール
```bash
cd backend
pip install -r requirements.txt
```

### 環境変数を設定してバックエンド起動
```bash
# Windowsの場合
$env:GEMINI_API_KEY="YOUR_API_KEY_HERE"
python src/app/logic/api.py

# macOS/Linuxの場合
export GEMINI_API_KEY="YOUR_API_KEY_HERE"
python src/app/logic/api.py
```

## 4. 本番環境（Render.com）での設定

### Render.comダッシュボードで設定

1. Render.comのダッシュボードにログイン
2. michela-backendサービスを選択
3. "Environment"タブをクリック
4. 新しい環境変数を追加:
   - Key: `GEMINI_API_KEY`
   - Value: 取得したAPIキー
5. "Save Changes"をクリック
6. サービスが自動的に再デプロイされる

### render.yamlでの設定（オプション）

```yaml
services:
  - type: web
    name: michela-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python src/app/logic/api.py
    envVars:
      - key: GOOGLE_CREDENTIALS
        value: '{"type":"service_account", ...}'
      - key: GEMINI_API_KEY
        sync: false  # ダッシュボードで設定
```

## 5. 動作確認

### ローカルでのテスト
1. バックエンドを起動（port 5000）
2. フロントエンドを起動（port 3000）
   ```bash
   cd frontend
   npm run dev
   ```
3. http://localhost:3000/dashboard にアクセス
4. "AI相談"ボタンをクリック
5. 質問を入力してテスト

### 本番環境でのテスト
1. https://michela.vercel.app/dashboard にアクセス
2. "AI相談"ボタンをクリック
3. 質問を入力してテスト

## 6. 無料枠の制限

### Gemini API無料プラン
- **リクエスト数**: 15 RPM（リクエスト/分）
- **トークン数**: 
  - 150万トークン/日
  - 150億トークン/月
- **モデル**: gemini-pro

個人利用には十分な無料枠です。

## 7. トラブルシューティング

### APIキーが設定されていない場合
**エラー**: `"Gemini API key not configured"`
**解決策**: 環境変数`GEMINI_API_KEY`を設定してサーバーを再起動

### APIキーが無効な場合
**エラー**: API呼び出しエラー
**解決策**: Google AI Studioで新しいAPIキーを生成

### ネットワークエラー
**エラー**: `"ネットワークエラーが発生しました"`
**解決策**: 
- バックエンドが起動しているか確認
- CORSエラーの場合はapi.pyのCORS設定を確認

## 8. セキュリティ上の注意

- APIキーをGitにコミットしない
- `.gitignore`に環境変数ファイルを追加
- 本番環境では環境変数で管理
- APIキーを公開しない

## 9. 使用例

### AI相談画面での質問例
```
- 筋肥大に最適なタンパク質摂取量は？
- HIITと有酸素運動の違いは？
- 減量中のカロリー設定方法は？
- クレアチンサプリメントの効果は？
- プログレッシブオーバーロードの原則とは？
```
