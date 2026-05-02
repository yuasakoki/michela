# MICHELA Project Guide

## Important Instructions for AI
- **Never give ambiguous or uncertain answers.**
- **If something is unclear, always ask the user for clarification before proceeding.**

## Tech Stack
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Flask + Firebase Admin SDK + Gemini API
- **Database**: Firestore (NoSQL)

## Language Rules
- Perform all internal reasoning, analysis, and processing in English.
- Output ONLY the final response in Japanese.
- Do NOT include English explanations, translations, or mixed-language output.
- If Japanese output is not possible, ask for clarification in Japanese.

## Gemini API Usage Rules
- Gemini API must be called from the backend service layer only.
- Frontend must NEVER call Gemini API directly.
- Gemini responses used in UI must be persisted in Firestore.
- Temporary or experimental Gemini outputs must not be sent directly to the frontend.

## Backend Architecture Rules
- api.py is responsible for routing, request parsing, and HTTP response formatting only.
- api.py must NOT access Firestore or external services directly.
- All business logic and Firestore access must be implemented in *_service.py files.
- Validation logic should be handled in the service layer, not in api.py.

## 4-Layer Architecture (Required)

```
frontend/src/
├── app/       # View layer: UI only. No logic or API calls allowed
├── hooks/     # Logic layer: use* hooks for state management
├── services/  # Model layer: *Api functions for API calls only
└── types/     # Type definitions
```

## Naming Conventions

| Target | Convention | Example |
|--------|------------|---------|
| Component | PascalCase | `CustomerRegist` |
| Hook | `use*` | `useLogin`, `useAuth` |
| API function | `*Api` | `loginApi` |
| Python function | snake_case | `register_customer` |

## Code Patterns

### Frontend
```typescript
// services/*Service.ts - API calls
export const fetchCustomerApi = async (id: string): Promise<Customer> => { ... }

// hooks/use*.ts - State management
export const useCustomer = (id: string) => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  // ...
  return { customer, isLoading, error }
}

// app/*/page.tsx - UI only
const { customer, isLoading } = useCustomer(id)
```

### Backend
```python
# services/*_service.py - Tuple return pattern
def get_customer(customer_id: str) -> tuple[dict | None, str | None]:
    # Success: (result, None)
    # Failure: (None, error_message)
```
## Error Handling Rules
- Service functions must return (result, None) on success.
- On failure, services must return (None, error_message).
- api.py is responsible for mapping error_message to HTTP status codes.
- Frontend must not rely on backend error message contents.

### Toast Messages
```typescript
import { toast } from '@/utils/toast'
import { SUCCESS_MESSAGES, ERROR_MESSAGES, TARGET_NAMES } from '@/constants/messages'

toast.success(SUCCESS_MESSAGES.REGISTERED(TARGET_NAMES.CUSTOMER))
toast.error(ERROR_MESSAGES.FETCH_FAILED(TARGET_NAMES.CUSTOMER))
```

## Key Files

| Purpose | File |
|---------|------|
| Auth check | [frontend/src/hooks/useAuth.ts](frontend/src/hooks/useAuth.ts) |
| Role check | [frontend/src/hooks/useRole.ts](frontend/src/hooks/useRole.ts) |
| API endpoints | [frontend/src/constants/api.ts](frontend/src/constants/api.ts) |
| Message constants | [frontend/src/constants/messages.ts](frontend/src/constants/messages.ts) |
| Flask routes | [backend/src/app/logic/api.py](backend/src/app/logic/api.py) |

## Auth Hook Responsibility Rules
useAuth:
- Handles authentication state only.
- Performs token verification and login status management.
- Must NOT handle role-based logic.
- May trigger redirect only for unauthenticated users.

useRole:
- Handles role checking logic only.
- Returns boolean flags for permissions.
- Must NOT perform redirects or API calls.

## Firestore Collections

`customer`, `weight_history`, `training_sessions`, `meal_records`, `users`, `exercise_presets`, `food_presets`, `nutrition_goals`, `customer_gamification`, `leaderboard`, `items`

## Firestore Data Rules
- Each collection must have a clearly defined document ID strategy.
- Subcollections should NOT be created unless explicitly specified.
- All documents related to a customer must include a customer_id field.
- Cross-collection relationships must be handled at the application level, not by nesting.

## Feature Specifications
- [Gamification System](docs/gamification-spec.md) - Ranking, Avatar, Achievements, Items
