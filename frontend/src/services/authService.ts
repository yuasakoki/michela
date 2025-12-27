// トークン管理
const AUTH_TOKEN_KEY = 'michela_auth_token';

export const loginApi = (username: string, password: string): boolean => {
    const isValid = username === "admin" && password === "1234";
    if (isValid) {
        // ログイン成功時にトークンを保存
        const token = btoa(`${username}:${Date.now()}`); // 簡易的なトークン生成
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        // クッキーにも保存（Middleware用）
        document.cookie = `michela_auth_token=${token}; path=/; max-age=86400`; // 24時間
    }
    return isValid;
};

export const logoutApi = (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
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