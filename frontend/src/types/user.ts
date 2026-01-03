export interface User {
    id: string;
    username: string;
    role: number; // 0: 使用者, 1: 開発者
    email?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    user: User;
}
