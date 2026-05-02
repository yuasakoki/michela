# MICHELA


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

## 🎯 プロジェクトビジョン

MICHELAは、以下の価値を提供します：

- 📊 **データドリブン**: 科学的根拠に基づいたトレーニングと健康管理
- 🤝 **つながり**: ユーザー同士のモチベーション向上とコミュニティ形成
- 📈 **継続的成長**: 身体的な進化だけでなく、精神的・知的な成長も記録
- 🎓 **学習**: フィットネスに関する知識の習得と実践

## 🤝 コントリビューション

**MICHELA** - あなたの成長の旅を、データとともに。
*Train Smart. Live Strong* 💪

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Recharts |
| Backend | Flask, Python 3.x, Google Gemini API |
| Database | Google Cloud Firestore (NoSQL) |
| Hosting | Vercel (Frontend), Render.com (Backend) |


## Architecture

### Frontend: 4-Layer Structure

```
frontend/src/
├── app/        # View: UI components only
├── hooks/      # Logic: State management, event handlers
├── services/   # Model: API communication
└── types/      # Type definitions
```

### Backend: Blueprint-based Routing

```
backend/src/app/
├── logic/
│   ├── api.py           # Entry point, CORS, Blueprint registration
│   └── routes/          # Route handlers by domain
│       ├── auth_routes.py
│       ├── customer_routes.py
│       ├── training_routes.py
│       ├── meal_routes.py
│       └── ...
└── services/            # Business logic, Firestore access
    ├── customer_service.py
    ├── training_service.py
    ├── ai_service.py
    └── ...
```

---

## Data Model (Firestore)

| Collection | Description |
|------------|-------------|
| `customer` | Customer profiles |
| `weight_history` | Weight records |
| `training_sessions` | Training logs with exercises |
| `meal_records` | Meal logs with nutrition data |
| `nutrition_goals` | Target calories and macros |
| `users` | Authentication data |
| `exercise_presets` | Exercise master data |
| `food_presets` | Food master data |

---

## Key Constraints

- **Frontend**: No business logic in View layer. Use hooks for state, services for API calls.
- **Backend**: `api.py` handles routing only. All Firestore access must be in `*_service.py`.
- **AI**: Gemini API calls must go through backend service layer. Frontend never calls Gemini directly.

---

## References

- [CLAUDE.md](CLAUDE.md) - AI coding guidelines
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Detailed specifications
