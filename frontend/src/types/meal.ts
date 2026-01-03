// 食事管理関連の型定義

/**
 * 食品アイテム
 */
export interface FoodItem {
    food_name: string;
    amount: number;         // 量（g）
    calories: number;       // カロリー（kcal）
    protein: number;        // タンパク質（g）
    fat: number;            // 脂質（g）
    carbs: number;          // 炭水化物（g）
}

/**
 * 食事記録
 */
export interface MealRecord {
    id: string;
    customer_id: string;
    date: string;           // ISO 8601形式
    meal_type: string;      // 朝食/昼食/夕食/間食
    foods: FoodItem[];
    total_calories: number;
    total_protein: number;
    total_fat: number;
    total_carbs: number;
    note?: string;
}

/**
 * 栄養目標
 */
export interface NutritionGoal {
    customer_id: string;
    target_calories: number;
    target_protein: number;
    target_fat: number;
    target_carbs: number;
}

/**
 * 食品プリセット
 */
export interface FoodPreset {
    id: string;
    name: string;
    calories_per_100g: number;
    protein_per_100g: number;
    fat_per_100g: number;
    carbs_per_100g: number;
    category: string;
}

/**
 * 日別栄養サマリー
 */
export interface DailyNutritionSummary {
    date: string;
    total_calories: number;
    total_protein: number;
    total_fat: number;
    total_carbs: number;
    meal_count: number;
}

/**
 * 食事記録登録リクエスト
 */
export interface MealRecordRequest {
    customer_id: string;
    date: string;
    meal_type: string;
    foods: FoodItem[];
    note?: string;
}

/**
 * AIアドバイスレスポンス
 */
export interface MealAdviceResponse {
    advice: string;
    cached_until?: string;
    is_cached?: boolean;
}
