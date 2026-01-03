// 顧客関連の型定義

/**
 * 顧客情報
 */
export interface Customer {
    id: string;
    name: string;
    age: number;
    height: number;          // 身長（cm）
    weight: number;          // 体重（kg）
    favorite_food?: string;
    completion_date: string; // 完了予定日
}

/**
 * 体重記録
 */
export interface WeightRecord {
    id: string;
    customer_id: string;
    weight: number;          // 体重（kg）
    recorded_at: string;     // ISO 8601形式
    note?: string;
}

/**
 * 顧客統計情報
 */
export interface CustomerStats {
    totalTrainingSessions: number;
    avgWeeklyTraining: number;
    totalVolume: number;
    currentWeight: number;
    weightChange: number;
    daysUntilGoal: number;
}

/**
 * 顧客登録リクエスト
 */
export interface CustomerRequest {
    name: string;
    age: number;
    height: number;
    weight: number;
    favorite_food?: string;
    completion_date: string;
}

/**
 * 体重記録登録リクエスト
 */
export interface WeightRecordRequest {
    weight: number;
    recorded_at: string;
    note?: string;
}
