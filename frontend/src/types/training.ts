// トレーニング関連の型定義

/**
 * トレーニングセット（旧構造・既存データ用）
 */
export interface Set {
    reps: number;
    weight: number;
}

/**
 * トレーニングセット（新構造）
 */
export interface ExerciseSetV2 {
    set_number: number;
    set_type: 'warmup' | 'working';
    weight_kg: number;
    reps_planned: number;
    reps_actual: number;
    rir_target: number | null;
}

/**
 * 推奨セットレスポンス
 */
export interface RecommendSetsResponse {
    recommended_sets: ExerciseSetV2[];
    actual_max_kg: number;
    is_first_session: boolean;
    previous_working_weight_kg: number | null;
    weight_changed: boolean;
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
