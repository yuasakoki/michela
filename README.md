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
- **フレームワーク**: React / Next.js（検討中）
- **ホスティング**: Firebase Hosting

### バックエンド（予定）
- **言語**: Java
- **フレームワーク**: Spring Boot
- **ホスティング**: Google Cloud Run / App Engine

### データベース
- **DB**: Google Cloud Firestore

### インフラストラクチャ
- **クラウドプラットフォーム**: Google Cloud Platform (GCP)
- **認証**: Firebase Authentication（予定）

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

- Node.js (v18以上推奨)
- npm または yarn
- Firebase CLI（オプション）

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/your-username/michela.git
cd michela

# 依存関係のインストール
npm install
# または
yarn install
```

### 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
```

ブラウザで `http://localhost:3000` を開いてアプリケーションを確認できます。

### ビルド

```bash
npm run build
# または
yarn build
```

## 🔐 環境変数の設定

`.env.local` ファイルを作成し、必要な環境変数を設定してください：

```env
# Firebase設定
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# バックエンドAPI（予定）
NEXT_PUBLIC_API_URL=your_backend_api_url
```

## 📋 主要機能（予定）

### Phase 1: MVP（最小限の製品）
- [ ] ユーザー認証（サインアップ・ログイン）
- [ ] トレーニング記録機能
- [ ] 体重・体組成記録機能
- [ ] 基本的なダッシュボード

### Phase 2: データ分析
- [ ] トレーニング進捗の可視化
- [ ] 統計データとグラフ表示
- [ ] 目標設定と達成度追跡

### Phase 3: ソーシャル機能
- [ ] ユーザー間のつながり
- [ ] トレーニング記録の共有
- [ ] コミュニティフィード

### Phase 4: AI・インテリジェンス
- [ ] トレーニングプランの自動生成
- [ ] パーソナライズされたアドバイス
- [ ] 予測分析と最適化提案

## 🤝 コントリビューション

現在、このプロジェクトは開発初期段階です。
コントリビューションに関するガイドラインは、プロジェクトの成熟に伴って整備予定です。

**MICHELA** - あなたの成長の旅を、データとともに。
*Train Smart. Live Strong* 💪
