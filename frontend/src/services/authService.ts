import { LoginRequest, LoginResponse, User } from '@/types/user';

const AUTH_TOKEN_KEY = 'michela_auth_token';
const USER_DATA_KEY = 'michela_user_data';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://michela.onrender.com';

export const loginApi = async (username: string, password: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data: LoginResponse = await response.json();

            // トークン生成（簡易的）
            const token = btoa(`${username}:${Date.now()}`);
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));

            // クッキーにも保存
            document.cookie = `michela_auth_token=${token}; path=/; max-age=86400`;

            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
};

export const logoutApi = (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    // クッキーも削除
    document.cookie = 'michela_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false; // SSR対応
    return localStorage.getItem(AUTH_TOKEN_KEY) !== null;
};

export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

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

export const isDeveloper = (): boolean => {
    const user = getCurrentUser();
    return user?.role === 1;
};