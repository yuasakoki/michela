import { API_ENDPOINTS } from '@/constants/api';
import { authFetch } from './authService';
import type { RecommendSetsResponse } from '@/types/training';
export type { ExerciseSetV2 } from '@/types/training';

export interface ExerciseSet {
    // 旧フォーマット
    reps?: number;
    weight?: number;
    // 新フォーマット (V2)
    weight_kg?: number;
    reps_actual?: number;
    set_number?: number;
    set_type?: 'warmup' | 'working';
    reps_planned?: number;
    rir_target?: number | null;
}

export interface Exercise {
    exercise_id: string;
    exercise_name: string;
    sets: ExerciseSet[];
    notes?: string;
}

export interface TrainingSession {
    id: string;
    customer_id: string;
    date: string;
    exercises: Exercise[];
    notes: string;
    duration_minutes: number;
}

export interface TrainingAdviceResponse {
    advice: string;
    is_cached?: boolean;
    cached_until?: string;
}

/**
 * トレーニングセッション一覧を取得
 */
export const fetchTrainingSessionsApi = async (
    customerId: string,
    limit: number = 20
): Promise<TrainingSession[]> => {
    try {
        const response = await authFetch(API_ENDPOINTS.TRAINING_SESSIONS(customerId, limit));
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error('Error fetching training sessions:', error);
        return [];
    }
};

/**
 * トレーニングセッションを削除
 */
export const deleteTrainingSessionApi = async (sessionId: string): Promise<boolean> => {
    try {
        const response = await authFetch(API_ENDPOINTS.DELETE_TRAINING_SESSION(sessionId), {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting training session:', error);
        return false;
    }
};

/**
 * 推奨セットを生成
 */
export const fetchRecommendedSetsApi = async (
    customerId: string,
    exerciseId: string
): Promise<RecommendSetsResponse | null> => {
    try {
        const response = await authFetch(API_ENDPOINTS.RECOMMEND_SETS, {
            method: 'POST',
            body: JSON.stringify({ customer_id: customerId, exercise_id: exerciseId }),
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching recommended sets:', error);
        return null;
    }
};

/**
 * 特定種目の過去最高重量を取得
 */
export const fetchMaxWeightApi = async (
    customerId: string,
    exerciseId: string
): Promise<number | null> => {
    try {
        const response = await authFetch(API_ENDPOINTS.MAX_WEIGHT(customerId, exerciseId));
        if (response.ok) {
            const data = await response.json();
            return data.max_weight;
        }
        return null;
    } catch (error) {
        console.error('Error fetching max weight:', error);
        return null;
    }
};

/**
 * AIトレーニングアドバイスを取得
 */
export const fetchTrainingAdviceApi = async (
    customerId: string
): Promise<TrainingAdviceResponse | null> => {
    try {
        const response = await authFetch(API_ENDPOINTS.TRAINING_ADVICE(customerId));
        if (response.ok) {
            return await response.json();
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch advice');
    } catch (error) {
        console.error('Error fetching training advice:', error);
        throw error;
    }
};
