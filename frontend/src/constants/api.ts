/**
 * API定数定義
 * APIエンドポイントと共通エラーメッセージを管理
 */

/**
 * APIベースURL
 * 環境変数NEXT_PUBLIC_API_URLが設定されていない場合はローカルホストを使用
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

/**
 * APIエンドポイント定義
 */
export const API_ENDPOINTS = {
    // 認証
    LOGIN: `${API_BASE_URL}/login`,

    // 顧客管理
    CUSTOMERS: `${API_BASE_URL}/get_customers`,
    CUSTOMER: (id: string) => `${API_BASE_URL}/get_customer/${id}`,
    REGISTER_CUSTOMER: `${API_BASE_URL}/register_customer`,
    UPDATE_CUSTOMER: (id: string) => `${API_BASE_URL}/update_customer/${id}`,
    DELETE_CUSTOMER: (id: string) => `${API_BASE_URL}/delete_customer/${id}`,

    // 体重履歴
    WEIGHT_HISTORY: (customerId: string, limit?: number) =>
        `${API_BASE_URL}/get_weight_history/${customerId}${limit ? `?limit=${limit}` : ''}`,
    ADD_WEIGHT_RECORD: (customerId: string) => `${API_BASE_URL}/add_weight_record/${customerId}`,

    // トレーニング記録
    EXERCISE_PRESETS: `${API_BASE_URL}/get_exercise_presets`,
    ADD_EXERCISE_PRESET: `${API_BASE_URL}/add_exercise_preset`,
    DELETE_EXERCISE_PRESET: (id: string) => `${API_BASE_URL}/delete_exercise_preset/${id}`,
    TRAINING_SESSIONS: (customerId: string, limit?: number) =>
        `${API_BASE_URL}/get_training_sessions/${customerId}${limit ? `?limit=${limit}` : ''}`,
    TRAINING_SESSION: (id: string) => `${API_BASE_URL}/get_training_session/${id}`,
    ADD_TRAINING_SESSION: `${API_BASE_URL}/add_training_session`,
    UPDATE_TRAINING_SESSION: (id: string) => `${API_BASE_URL}/update_training_session/${id}`,
    DELETE_TRAINING_SESSION: (id: string) => `${API_BASE_URL}/delete_training_session/${id}`,
    TRAINING_ADVICE: (customerId: string) => `${API_BASE_URL}/get_training_advice/${customerId}`,

    // 食事記録
    FOOD_PRESETS: `${API_BASE_URL}/get_food_presets`,
    MEAL_RECORDS: (customerId: string, startDate?: string, endDate?: string, limit?: number) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (limit) params.append('limit', limit.toString());
        const queryString = params.toString();
        return `${API_BASE_URL}/get_meal_records/${customerId}${queryString ? `?${queryString}` : ''}`;
    },
    MEAL_RECORD: (id: string) => `${API_BASE_URL}/get_meal_record/${id}`,
    ADD_MEAL_RECORD: `${API_BASE_URL}/add_meal_record`,
    UPDATE_MEAL_RECORD: (id: string) => `${API_BASE_URL}/update_meal_record/${id}`,
    DELETE_MEAL_RECORD: (id: string) => `${API_BASE_URL}/delete_meal_record/${id}`,
    DAILY_NUTRITION: (customerId: string, date: string) =>
        `${API_BASE_URL}/get_daily_nutrition/${customerId}/${date}`,
    NUTRITION_GOAL: (customerId: string) => `${API_BASE_URL}/get_nutrition_goal/${customerId}`,
    SET_NUTRITION_GOAL: (customerId: string) => `${API_BASE_URL}/set_nutrition_goal/${customerId}`,
    MEAL_ADVICE: (customerId: string) => `${API_BASE_URL}/get_meal_advice/${customerId}`,

    // AI機能
    AI_CHAT: `${API_BASE_URL}/ai_chat`,
    LATEST_RESEARCH: `${API_BASE_URL}/get_latest_research`,
    SEARCH_RESEARCH: `${API_BASE_URL}/search_research`,
    RESEARCH_SUMMARY: (pmid: string) => `${API_BASE_URL}/research_summary/${pmid}`,

    // バックアップ
    BACKUP_ALL: `${API_BASE_URL}/backup_all`,
    RESTORE_BACKUP: `${API_BASE_URL}/restore_backup`,
} as const;

/**
 * 共通エラーメッセージ
 * ネットワークエラーなど、全画面で共通のエラーメッセージ
 */
export const COMMON_ERROR_MESSAGES = {
    NETWORK_ERROR: 'ネットワークエラーが発生しました',
    NETWORK_ERROR_RETRY: 'ネットワークエラー\nページを再読み込みしてください',
    UNKNOWN_ERROR: '予期しないエラーが発生しました',
} as const;
