// トレーニング関連の型定義

/**
 * トレーニングセット
 */
export interface Set {
    reps: number;      // 回数
    weight: number;    // 重量（kg）0の場合は自重
}

/**
 * エクササイズ（種目）
 */
export interface Exercise {
    exercise_id: string;
    exercise_name: string;
    sets: Set[];
}

/**
 * トレーニングセッション
 */
export interface TrainingSession {
    id: string;
    customer_id: string;
    date: string;       // ISO 8601形式
    exercises: Exercise[];
    note?: string;
}

/**
 * エクササイズプリセット
 */
export interface ExercisePreset {
    id: string;
    name: string;
    category: string;
    is_default: boolean;
}

/**
 * トレーニングセッション登録リクエスト
 */
export interface TrainingSessionRequest {
    customer_id: string;
    date: string;
    exercises: Exercise[];
    note?: string;
}

/**
 * AIアドバイスレスポンス
 */
export interface TrainingAdviceResponse {
    advice: string;
    cached_until?: string;
    is_cached?: boolean;
}
