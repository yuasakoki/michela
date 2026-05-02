import { API_ENDPOINTS } from '@/constants/api';
import { authFetch } from './authService';

export interface ExerciseSet {
    reps: number;
    weight: number;
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
