"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/services/authService";

/**
 * 認証チェック用カスタムフック
 * 保護されたページで使用し、未ログインユーザーをログイン画面にリダイレクト
 */
export const useAuth = () => {
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/");
        }
    }, [router]);

    return { isAuthenticated: isAuthenticated() };
};
