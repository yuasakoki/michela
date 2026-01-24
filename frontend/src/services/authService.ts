import { LoginResponse, User } from '@/types/user';
import { API_ENDPOINTS } from '@/constants/api';

const USER_DATA_KEY = 'michela_user_data';

/**
 * ログインAPI
 * - バックエンドがJWTをHttpOnly Cookieに設定
 */
export const loginApi = async (username: string, password: string): Promise<boolean> => {
    console.log('========== LOGIN API START ==========');
    console.log('API URL:', API_ENDPOINTS.LOGIN);

    try {
        const response = await fetch(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data: LoginResponse = await response.json();
            console.log('Login successful, user:', data.user);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));

            // Cookieを確認（HttpOnlyはJSから見えないが、試しにログ）
            console.log('Document cookies:', document.cookie);
            console.log('========== LOGIN API END (SUCCESS) ==========');
            return true;
        }

        const errorData = await response.json();
        console.log('Login failed:', errorData);
        console.log('========== LOGIN API END (FAILED) ==========');
        return false;
    } catch (error) {
        console.error('Login error:', error);
        console.log('========== LOGIN API END (ERROR) ==========');
        return false;
    }
};

/**
 * ログアウトAPI
 * - バックエンドでCookieを削除
 */
export const logoutApi = async (): Promise<void> => {
    try {
        await fetch(API_ENDPOINTS.LOGOUT, {
            method: 'POST',
            credentials: 'include',
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    localStorage.removeItem(USER_DATA_KEY);
};

/**
 * 認証済みかどうか（表示用、実際の検証はmiddleware→バックエンドで行う）
 */
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(USER_DATA_KEY) !== null;
};

/**
 * 現在のユーザー情報を取得
 */
export const getCurrentUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(USER_DATA_KEY);
    if (!userData) return null;
    try {
        return JSON.parse(userData) as User;
    } catch {
        return null;
    }
};

/**
 * 開発者権限チェック
 */
export const isDeveloper = (): boolean => {
    const user = getCurrentUser();
    return user?.role === 1;
};
