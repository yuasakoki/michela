# MICHELA（ミケラ）

> **Train Smart. Live Strong**

**MICHELA**は、フィットネスデータを中心とした統合プラットフォームです。
単なる筋肉や体重の記録ツールではなく、"人間としての成長"を支えるアプリケーションを目指しています。

## 📖 名前の由来

**MICHELA（ミケラ）** は以下の要素から構成されています：

- **M**izukiの想い（M） - プロジェクトの中心となる理念
- **I**ntelligence - 知性・データに基づく洞察
- **C**onnect - つながり・コミュニティ
- **H**ealth - 健康・ウェルネス
- **E**volution - 進化・継続的な成長
- **L**og - 記録・データの蓄積
- **A**pp - アプリケーション

これらの要素を統合し、ユーザーの包括的な成長をサポートするフィットネスデータプラットフォームです。

## 🎯 プロジェクトビジョン

MICHELAは、以下の価値を提供します：

- 📊 **データドリブン**: 科学的根拠に基づいたトレーニングと健康管理
- 🤝 **つながり**: ユーザー同士のモチベーション向上とコミュニティ形成
- 📈 **継続的成長**: 身体的な進化だけでなく、精神的・知的な成長も記録
- 🎓 **学習**: フィットネスに関する知識の習得と実践

## 🏗️ 技術スタック

### フロントエンド
- **言語**: TypeScript
- **フレームワーク**: Next.js 15 (App Router)
- **スタイリング**: Tailwind CSS
- **グラフ**: Recharts
- **ホスティング**: Vercel（本番）

### バックエンド
- **言語**: Python 3.x
- **フレームワーク**: Flask
- **AI**: Google Gemini API
- **ホスティング**: Render.com

### データベース
- **DB**: Google Cloud Firestore (NoSQL)
- **認証**: ローカル認証（SHA-256ハッシュ）

### インフラストラクチャ
- **クラウドプラットフォーム**: Google Cloud Platform (GCP)
- **CI/CD**: Vercel（自動デプロイ）

## 📁 プロジェクト構造

```
src/
├─ app/
│  └─ page.tsx              # View層（UIコンポーネント）
├─ hooks/
│  └─ useLogin.ts           # ロジック層（状態管理・イベント処理）
├─ services/
│  └─ authService.ts        # Model層（API通信・外部連携）
├─ types/
│  └─ auth.ts               # 型定義（TypeScript型システム）
└─ ...
```

### アーキテクチャ設計思想

MICHELAは**関心の分離**を重視した構造を採用しています：

#### 🎨 View層（`app/`）
- UIコンポーネントのみを配置
- ビジネスロジックを含まない純粋な表示層
- 再利用可能なコンポーネント設計

#### 🔧 ロジック層（`hooks/`）
- カスタムフックによる状態管理
- イベント処理とビジネスロジック
- Viewとの疎結合を実現

#### 🌐 Model層（`services/`）
- 外部API通信
- データ永続化処理
- バックエンドとの連携

#### 📝 型定義層（`types/`）
- TypeScriptの型定義
- インターフェース・型エイリアス
- 型安全性の確保

## 🚀 Getting Started

### 前提条件

#### フロントエンド
- Node.js (v18以上推奨)
- npm

#### バックエンド
- Python 3.x
- pip
- Firebase認証情報（`keys/michela-*.json`）
- Gemini API Key

### インストール

#### フロントエンド
```bash
cd frontend
npm install
```

#### バックエンド
```bash
cd backend
pip install -r requirements.txt

# .envファイルを作成
cp .env.example .env
# GOOGLE_CREDENTIALS と GEMINI_API_KEY を設定
```

### 開発サーバーの起動

#### フロントエンド（ポート3000）
```bash
cd frontend
npm run dev
```

#### バックエンド（ポート5000）
```bash
cd backend
python src/app/logic/api.py
```
## 🔐 環境変数の設定

### フロントエンド（`.env.local`）
```env
# バックエンドAPI URL（本番環境のみ）
NEXT_PUBLIC_API_URL=https://michela.onrender.com
```

### バックエンド（`backend/.env`）
```env
# Firebase認証情報（keys/michela-*.jsonの内容をJSON文字列で）
GOOGLE_CREDENTIALS={"type":"service_account",...}

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key
```

**注意**: ローカル開発時は`NEXT_PUBLIC_API_URL`未設定で自動的に`http://127.0.0.1:5000`を使用します。

### 🚧 未実装機能
- [ ] Firebase Authentication統合
- [ ] ユーザー間のソーシャル機能
- [ ] 画像アップロード（食事写真等）
- [ ] プッシュ通知
- [ ] リアルタイム更新（Firestore Snapshot）
- [ ] テストコード

## 📚 ドキュメント
- [Copilot Instructions](.github/copilot-instructions.md) - AI開発支援用の詳細ガイド

## 🚀 デプロイ

### フロントエンド（Vercel）
```bash
cd frontend
vercel --prod
```

### バックエンド（Render.com）
- `backend/render.yaml`の設定に従って自動デプロイ
- 環境変数: `GOOGLE_CREDENTIALS`, `GEMINI_API_KEY`

## 🤝 コントリビューション

現在、このプロジェクトは活発に開発中です。
詳細な開発ガイドは[Copilot Instructions](.github/copilot-instructions.md)を参照してください。

**MICHELA** - あなたの成長の旅を、データとともに。
*Train Smart. Live Strong* 💪
