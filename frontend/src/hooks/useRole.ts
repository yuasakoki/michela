"use client";
import { getCurrentUser, isDeveloper } from '@/services/authService';
import { User } from '@/types/user';

export const useRole = () => {
    const user: User | null = getCurrentUser();
    const isDevRole = isDeveloper();

    return {
        user,
        isDeveloper: isDevRole,
        isUser: user?.role === 0,
    };
};
