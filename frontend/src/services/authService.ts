import { LoginResponse, User } from '@/types/user';
import { API_ENDPOINTS } from '@/constants/api';

const USER_DATA_KEY = 'michela_user_data';
const AUTH_TOKEN_KEY = 'michela_auth_token';

/**
 * 認証トークンを取得
 */
export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * 認証ヘッダーを取得（API呼び出し用）
 */
export const getAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

/**
 * ログインAPI
 * - バックエンドからJWTを受け取りlocalStorageに保存
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

        if (response.ok) {
            const data: LoginResponse = await response.json();
            console.log('Login successful, user:', data.user);

            // ユーザー情報とトークンをlocalStorageに保存
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
            if (data.token) {
                localStorage.setItem(AUTH_TOKEN_KEY, data.token);
                console.log('Token saved to localStorage');
            }

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
 * - localStorageからトークンとユーザー情報を削除
 */
export const logoutApi = async (): Promise<void> => {
    try {
        await fetch(API_ENDPOINTS.LOGOUT, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * 認証済みかどうか（トークンの存在で判定）
 */
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(AUTH_TOKEN_KEY) !== null;
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

/**
 * 認証付きfetch（Authorizationヘッダーを自動付与）
 * @param url - リクエストURL
 * @param options - fetchオプション
 * @returns Response
 */
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getAuthToken();
    const headers = new Headers(options.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Content-Typeがない場合はデフォルトでJSONを設定
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
        ...options,
        headers,
    });
};
