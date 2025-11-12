Mifit CIM (MICHELA) - フィットネスデータプラットフォーム✨ プロジェクトの目的と理念Mifit CIM (MICHELA) は、単なる筋肉や体重の記録を超え、**「人間としての成長」**をサポートするための統合型フィットネスデータプラットフォームです。MICHELAに込められた想い私たちのプロダクト名「MICHELA（ミケラ）」には、以下の理念が込められています。**Mizukiの想い（M）**を中心に、Intelligence(知性)・Connect(つながり)・Health(健康)・Evolution(進化)・Log(記録)・Appを統合する。このプラットフォームは、ユーザーがデータを基に賢くトレーニングし（Train Smart）、精神的・肉体的に強く生きる（Live Strong）ための土台となります。Train Smart. Live Strong.🚀 技術スタック本プロジェクトは、スケーラビリティ、開発効率、および堅牢性を重視し、以下の技術スタックを採用しています。💻 フロントエンド項目技術備考フレームワークTypeScript (React または Next.js が有力)型安全性を確保し、大規模開発に対応。Next.jsを利用する場合はサーバーサイドレンダリング（SSR）の恩恵も活用。言語TypeScriptJavaScriptのスーパーセット。型定義によりバグを早期発見。🛠️ バックエンド & インフラストラクチャ項目技術備考APIサーバーJava (Spring Boot)処理速度と安定性を重視したエンタープライズ級のAPI開発。データベース (DB)Google Cloud Firestoreリアルタイム性、モバイル/Web連携の容易さ、および柔軟なデータ構造に対応。ホスティング (API)Cloud Run または App EngineJava APIをコンテナまたはマネージド環境で実行し、スケーラビリティと運用負荷を低減。ホスティング (フロント)Firebase HostingCDNを利用した高速な静的コンテンツ配信。📐 アーキテクチャとファイル構成フロントエンドは、関心の分離と再利用性を高めるために、Hooks + Service + View の構成を採用しています。この構成は、モダンなReact/Next.js開発において、データの流れとロジックの責務を明確にするためのベストプラクティスです。ディレクトリ構造src/
├─ app/
│  └─ page.tsx              ← View (UIコンポーネントのみ)
├─ components/
│  └─ ...                   ← 再利用可能なUI部品
├─ hooks/
│  └─ useLogin.ts           ← Logic (Controller相当: 画面の状態管理、イベント処理、Service層の呼び出し)
├─ services/
│  └─ authService.ts        ← Data (Model相当: 外部通信やAPI連携。データ取得と整形)
├─ types/
│  └─ auth.ts               ← TypeScriptの型定義ファイル
├─ utils/
│  └─ ...                   ← 共通のユーティリティ関数
責務の分離ディレクトリ役割説明app/Viewユーザーインターフェース (UI) のレンダリングを担当。ビジネスロジックは含めません。hooks/Logic (Controller)画面の状態管理、ユーザーイベント処理、Service層への指示を行います。コンポーネントとデータの橋渡し役です。services/Data (Model)外部データソース（API、DB）との通信、データ取得、および整形を担当します。データ操作の単一責任を持ちます。types/Definitionsデータ構造の定義を集中管理し、型安全性を高めます。⚙️ 開発環境のセットアップ1. 依存関係のインストール# フロントエンド (React/Next.js)
cd src/
npm install
# または yarn install
2. 環境変数の設定プロジェクトルートに.env.localファイルを作成し、Firebase/Google Cloudの設定を記述します。# .env.local (例)
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
# ... その他 Firebase/Java API エンドポイントなど
3. アプリケーションの実行# フロントエンドの開発サーバー起動
npm run dev
4. バックエンド (Java/Spring Boot)Java APIは別途、専用のリポジトリまたはbackend/ディレクトリで管理されます。Java JDK 17+ をインストールMaven/Gradleを使ってビルドローカルでSpring Bootアプリケーションを実行🤝 貢献ガイドライン開発に参加される方は、以下のルールを遵守してください。ブランチ名: feature/, bugfix/, hotfix/ プレフィックスを使用してください。コミットメッセージ: Conventional Commitsを推奨します (feat: add login functionality)。TypeScriptの型: types/ディレクトリの型定義を積極的に利用し、anyの使用は極力避けてください。Firestoreアクセス: 直接ViewやHooksからFirestoreの操作は行わず、必ずservices/層を経由してください。Copyright (c) 2024 Mifit CIM. All Rights Reserved.
