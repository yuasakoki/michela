# MICHELA アーキテクチャレビュー

**実施日**: 2026年1月4日  
**バージョン**: v1.0

---

## 📋 目次

1. [総評](#総評)
2. [アーキテクチャ分析](#アーキテクチャ分析)
3. [検出された問題点](#検出された問題点)
4. [推奨される改善](#推奨される改善)
5. [画面一覧](#画面一覧)

---

## 総評

### ✅ 良い点

1. **明確な4層アーキテクチャ**
   - View/Logic/Model/Type層が適切に分離
   - カスタムフック（`hooks/`）による状態管理が統一的
   - サービス層（`services/`）がAPI通信を集約

2. **バックエンド設計**
   - Flaskエンドポイントが機能別に整理
   - サービス層（`backend/src/app/services/`）でビジネスロジックを分離
   - Firebase Admin SDKによるFirestore連携

3. **TypeScript型安全性**
   - `types/`ディレクトリで型定義を集約
   - インターフェースが明確

4. **定数管理**
   - `constants/`でメッセージ、ルート、API URLを管理
   - トースト通知のユーティリティ統一（`utils/toast.ts`）

### ⚠️ 改善すべき点

以下に詳細を記載。

---

## アーキテクチャ分析

### フロントエンド構造

```
frontend/src/
├── app/                    # Next.js App Router（View層）
│   ├── page.tsx           # ログイン画面
│   ├── dashboard/         # ダッシュボード
│   ├── customer/          # 顧客管理
│   │   ├── [id]/         # 顧客詳細（動的ルート）
│   │   │   ├── page.tsx          # 顧客詳細トップ
│   │   │   ├── training/         # トレーニング記録
│   │   │   ├── meal/             # 食事記録
│   │   │   └── stats/            # 統計（未使用？）
│   ├── ai-chat/          # AI相談
│   ├── research-search/  # 研究検索
│   ├── admin/            # 管理機能
│   └── debug-auth/       # デバッグ用
├── components/            # 再利用コンポーネント
│   ├── WeightChart.tsx
│   ├── TrainingVolumeChart.tsx
│   └── NutritionChart.tsx
├── hooks/                 # ロジック層
│   ├── useAuth.ts        # 認証チェック
│   ├── useLogin.ts       # ログイン処理
│   └── useRole.ts        # 権限管理
├── services/              # Model層
│   └── authService.ts    # 認証API通信
├── types/                 # 型定義
│   ├── auth.ts
│   └── user.ts
├── constants/             # 定数管理
│   ├── messages.ts       # メッセージ
│   ├── routes.ts         # ルート定義
│   └── api.ts            # API URL
├── utils/                 # ユーティリティ
│   └── toast.ts          # トースト通知
├── features/              # 機能別モジュール（未使用）
│   └── customer/
└── middleware.ts          # Next.jsミドルウェア
```

### バックエンド構造

```
backend/
├── src/app/
│   ├── logic/
│   │   └── api.py        # Flaskエンドポイント（730行）
│   └── services/         # ビジネスロジック層
│       ├── customer_service.py
│       ├── weight_service.py
│       ├── training_service.py
│       ├── meal_service.py
│       ├── user_service.py
│       ├── ai_service.py
│       └── research_service.py
├── keys/                  # Firebase認証情報
├── tests/                 # テストコード（空）
├── .env                   # 環境変数
├── requirements.txt       # Python依存関係
└── render.yaml            # Render.comデプロイ設定
```

---

## 検出された問題点

### 🔴 Critical（重大な問題）

#### 1. **認証システムの脆弱性**

**問題**:
- ログイン処理がハードコード（admin/1234）
- トークン生成が簡易的（`btoa(username:timestamp)`）
- パスワードハッシュ化なし
- セッション管理が不十分

**影響**:
- セキュリティリスク
- 本番環境で使用不可

**場所**:
- [frontend/src/services/authService.ts](../frontend/src/services/authService.ts)
- [backend/src/app/services/user_service.py](../backend/src/app/services/user_service.py)

**推奨対応**:
- Firebase Authenticationへの移行
- JWTトークンの導入
- bcryptによるパスワードハッシュ化

---

#### 2. **API URL管理の不統一**

**問題**:
- バックエンドURLが各コンポーネントに直接記述
- `process.env.NEXT_PUBLIC_API_URL`と`http://127.0.0.1:5000`が混在
- `constants/api.ts`が存在するが未使用

**影響**:
- 本番/開発環境の切り替えが困難
- メンテナンス性の低下

**場所**:
- 全画面コンポーネント（約15ファイル）
- [frontend/src/constants/api.ts](../frontend/src/constants/api.ts)

**推奨対応**:
```typescript
// constants/api.ts を統一的に使用
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

// 各コンポーネント
import { API_BASE_URL } from '@/constants/api';
const response = await fetch(`${API_BASE_URL}/get_customers`);
```

---

#### 3. **エラーハンドリングの不統一**

**問題**:
- 一部で`alert()`、一部で`toast`、一部でconsole.errorのみ
- エラーメッセージが不明瞭（"Failed to fetch"）
- バックエンドエラーレスポンスの構造が統一されていない

**影響**:
- ユーザー体験の低下
- デバッグが困難

**場所**:
- 全画面コンポーネント

**推奨対応**:
- エラーハンドリング統一（全て`toast.error()`を使用）
- バックエンドエラーレスポンス統一（`{error: string, code: string}`）
- エラーバウンダリーの導入

---

### 🟡 Warning（改善推奨）

#### 4. **重複コードが多い**

**問題**:
- 各画面で同じfetch処理を繰り返し記述
- 認証チェック（`useAuth()`）が全画面に散在
- グラフコンポーネントの初期化処理が重複

**影響**:
- メンテナンス性の低下
- バグ混入リスク

**推奨対応**:
- カスタムフック化（`useCustomer`, `useTraining`, `useMeal`）
- API通信ヘルパー関数の作成（`services/apiClient.ts`）

---

#### 5. **型定義の不足**

**問題**:
- `types/auth.ts`と`types/user.ts`で型が重複（`User`型）
- トレーニング・食事記録の型定義がない
- バックエンドレスポンスの型が未定義（`any`が多用）

**影響**:
- 型安全性の低下
- リファクタリングが困難

**推奨対応**:
```typescript
// types/training.ts
export interface Exercise {
  exercise_id: string;
  exercise_name: string;
  sets: Set[];
}

export interface Set {
  reps: number;
  weight: number;
}

export interface TrainingSession {
  id: string;
  customer_id: string;
  date: string;
  exercises: Exercise[];
}
```

---

#### 6. **未使用ファイル・機能**

**問題**:
- `features/customer/` ディレクトリが空
- `stats/page.tsx` と `[id]/page.tsx` で機能が重複
- `debug-auth/page.tsx` が本番環境に残留
- バックエンドに3つのバックアップファイル（`api_old.py`, `api_backup.py`, `api_refactored.py`）

**推奨対応**:
- 未使用ファイルの削除またはGit履歴への移動
- デバッグページの本番除外設定

---

#### 7. **テストコードが存在しない**

**問題**:
- `backend/tests/` が空
- フロントエンドにテストディレクトリなし
- 手動テストのみに依存

**影響**:
- リグレッションバグのリスク
- リファクタリングの困難さ

**推奨対応**:
- Backend: pytest導入
- Frontend: Vitest + React Testing Library導入

---

#### 8. **バックエンドの単一ファイル肥大化**

**問題**:
- `api.py`が730行と巨大
- 全エンドポイント（約50個）が1ファイルに集約

**影響**:
- 可読性の低下
- マージコンフリクトのリスク

**推奨対応**:
- Blueprintによるモジュール分割
```python
# api/auth_routes.py
# api/customer_routes.py
# api/training_routes.py
# api/meal_routes.py
```

---

### 🟢 Info（参考情報）

#### 9. **パフォーマンス最適化の余地**

**観察**:
- 顧客一覧画面で全顧客の体重履歴を取得（最大1000件×顧客数）
- グラフデータの再計算が毎レンダリング時に実行
- 画像最適化の警告（`Image`コンポーネント）

**推奨対応**:
- ページネーション導入
- `useMemo`によるメモ化
- Next.js Image最適化設定

---

#### 10. **Markdown対応の不完全性**

**観察**:
- AIアドバイスのみMarkdown表示
- トレーニング・食事アドバイスはプレーンテキスト

**推奨対応**:
- 全AIアドバイスをMarkdown対応
- Tailwind Typographyの統一的適用

---

## 推奨される改善

### 優先度: 高

1. ✅ **API URL統一** - `constants/api.ts`を全画面で使用
2. ✅ **エラーハンドリング統一** - 全て`toast`に統一
3. ✅ **型定義の追加** - `types/training.ts`, `types/meal.ts`作成
4. ✅ **未使用ファイル削除** - バックアップファイル、デバッグページ

### 優先度: 中

5. 🔄 **認証システム改善** - Firebase Auth統合（Phase 2）
6. 🔄 **バックエンドリファクタリング** - Blueprint分割
7. 🔄 **カスタムフック追加** - `useCustomer`, `useTraining`, `useMeal`
8. 🔄 **テストコード導入** - pytest + Vitest

### 優先度: 低

9. ⏳ **パフォーマンス最適化** - ページネーション、メモ化
10. ⏳ **Markdown統一** - 全AIアドバイス対応

---

## 画面一覧

### 認証系

| 画面名 | パス | 機能 | 状態 |
|--------|------|------|------|
| ログイン | `/` | ユーザー認証 | ✅ 動作中 |
| デバッグ認証 | `/debug-auth` | 認証デバッグ | ⚠️ 削除推奨 |

### 顧客管理系

| 画面名 | パス | 機能 | 状態 |
|--------|------|------|------|
| ダッシュボード | `/dashboard` | 顧客一覧・概要 | ✅ 動作中 |
| 顧客登録 | `/customer` | 新規顧客登録 | ✅ 動作中 |
| 顧客詳細 | `/customer/[id]` | 詳細情報・グラフ | ✅ 動作中 |
| 統計（旧） | `/customer/[id]/stats` | 統計表示 | ⚠️ 重複 |

### トレーニング系

| 画面名 | パス | 機能 | 状態 |
|--------|------|------|------|
| トレーニング履歴 | `/customer/[id]/training` | 記録一覧・AI | ✅ 動作中 |
| トレーニング登録 | `/customer/[id]/training/new` | 新規登録 | ✅ 動作中 |

### 食事管理系

| 画面名 | パス | 機能 | 状態 |
|--------|------|------|------|
| 食事履歴 | `/customer/[id]/meal` | 記録一覧・グラフ | ✅ 動作中 |
| 食事登録 | `/customer/[id]/meal/new` | 新規登録 | ✅ 動作中 |
| 栄養目標設定 | `/customer/[id]/meal/goal` | 目標設定 | ✅ 動作中 |

### AI機能系

| 画面名 | パス | 機能 | 状態 |
|--------|------|------|------|
| AI相談 | `/ai-chat` | Gemini AIチャット | ✅ 動作中 |
| 研究検索 | `/research-search` | PubMed検索 | ✅ 動作中 |

### 管理機能系

| 画面名 | パス | 機能 | 状態 |
|--------|------|------|------|
| バックアップ | `/admin/backup` | データバックアップ | ✅ 動作中 |

**合計**: 15画面（デバッグ・重複含む）

---

## 次のステップ

### Phase 1: クリーンアップ（優先度: 高）

- [ ] API URL統一（`constants/api.ts`使用）
- [ ] エラーハンドリング統一（`toast`）
- [ ] 型定義追加（training, meal）
- [ ] 未使用ファイル削除

### Phase 2: 詳細設計書作成（次回作業）

各画面の詳細設計書をMarkdown形式で作成：

1. ログイン画面（`/`）
2. ダッシュボード（`/dashboard`）
3. 顧客登録（`/customer`）
4. 顧客詳細（`/customer/[id]`）
5. トレーニング履歴（`/customer/[id]/training`）
6. トレーニング登録（`/customer/[id]/training/new`）
7. 食事履歴（`/customer/[id]/meal`）
8. 食事登録（`/customer/[id]/meal/new`）
9. 栄養目標設定（`/customer/[id]/meal/goal`）
10. AI相談（`/ai-chat`）
11. 研究検索（`/research-search`）
12. バックアップ（`/admin/backup`）

### Phase 3: アーキテクチャ改善（中長期）

- 認証システム刷新（Firebase Auth）
- バックエンドリファクタリング（Blueprint）
- テストコード導入
- パフォーマンス最適化

---

## まとめ

MICHELAのアーキテクチャは**基本的に健全**です。4層分離、サービス層の導入、定数管理など、良い設計原則が守られています。

**主な改善点**は以下の3点：

1. **API URL管理の統一化**（即座に対応可能）
2. **エラーハンドリングの標準化**（即座に対応可能）
3. **型定義の拡充**（即座に対応可能）

これらを改善後、各画面の詳細設計書を作成することで、**保守性・拡張性の高いドキュメント化されたプロジェクト**になります。

---

**レビュアー**: GitHub Copilot  
**日付**: 2026年1月4日
