# Backend Tests

## テストの実行方法

### 必要なパッケージのインストール

```bash
cd backend
pip install -r requirements-dev.txt
```

### 全テストの実行

```bash
pytest
```

### カバレッジレポート付きで実行

```bash
pytest --cov=src/app/services --cov-report=html --cov-report=term-missing
```

カバレッジレポートは `htmlcov/index.html` で確認できます。

### 特定のテストファイルのみ実行

```bash
pytest tests/test_customer_service.py
pytest tests/test_user_service.py
```

### 特定のテストクラス/メソッドのみ実行

```bash
pytest tests/test_customer_service.py::TestCustomerService::test_register_customer_success
```

### 詳細な出力で実行

```bash
pytest -v
```

### 失敗したテストのみ再実行

```bash
pytest --lf
```

## テスト構成

- `conftest.py`: pytest設定とフィクスチャ
- `test_customer_service.py`: 顧客管理サービスのテスト
- `test_user_service.py`: ユーザー認証サービスのテスト
- `test_weight_service.py`: 体重履歴サービスのテスト
- `test_training_service.py`: トレーニング記録サービスのテスト
- `test_meal_service.py`: 食事記録サービスのテスト
- `test_ai_service.py`: AI機能サービスのテスト

## モックとフィクスチャ

全てのテストはFirestoreへの実際の接続をモックしています。
- `mock_firestore_client`: Firestoreクライアントのモック
- `sample_customer_data`: テスト用顧客データ
- `sample_user_data`: テスト用ユーザーデータ
- `sample_training_session`: テスト用トレーニングデータ
- `sample_meal_record`: テスト用食事記録データ

## カバレッジ目標

- 全サービス層: 90%以上
- クリティカルパス: 100%
