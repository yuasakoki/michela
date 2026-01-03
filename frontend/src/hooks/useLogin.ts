"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginApi } from "../services/authService";
import { toast } from "../utils/toast";

export const useLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setLoading(true);
        try {
            const result = await loginApi(username, password);
            if (result) {
                router.push("/dashboard");
            } else {
                toast.error("ログインに失敗しました");
            }
        } catch (error) {
            toast.error("ログイン中にエラーが発生しました");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return { username, password, setUsername, setPassword, handleLogin, loading };
}