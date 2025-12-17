export interface User {
    id: string;
    name: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}
