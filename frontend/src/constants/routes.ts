/**
 * ルーティングパス定義
 * アプリケーション内の画面遷移パスを管理
 */

export const ROUTES = {
    // 認証
    LOGIN: '/',

    // ダッシュボード
    DASHBOARD: '/dashboard',

    // 顧客管理
    CUSTOMER_REGISTER: '/customer',
    CUSTOMER_DETAIL: (customerId: string) => `/customer/${customerId}`,
    CUSTOMER_STATS: (customerId: string) => `/customer/${customerId}/stats`,

    // トレーニング
    TRAINING_LIST: (customerId: string) => `/customer/${customerId}/training`,
    TRAINING_NEW: (customerId: string) => `/customer/${customerId}/training/new`,
    TRAINING_EDIT: (customerId: string, sessionId: string) =>
        `/customer/${customerId}/training/${sessionId}/edit`,

    // 食事記録
    MEAL_LIST: (customerId: string) => `/customer/${customerId}/meal`,
    MEAL_NEW: (customerId: string) => `/customer/${customerId}/meal/new`,
    MEAL_GOAL: (customerId: string) => `/customer/${customerId}/meal/goal`,

    // AI・研究
    AI_CHAT: '/ai-chat',
    RESEARCH_SEARCH: '/research-search',

    // 管理者
    ADMIN_BACKUP: '/admin/backup',
    DEBUG_AUTH: '/debug-auth',
} as const;
