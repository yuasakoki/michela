"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {loginApi} from "../services/authService";

export const useLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = async () => {
        try {
            const result = await loginApi(username, password);
            if (result) {
                router.push("/dashboard");
            } else {
                alert("ログインに失敗しました。");
            }
        } catch (error) {
            alert("ログイン中にエラーが発生しました。");
            console.error(error);
        }
    };

    return {username, password, setUsername, setPassword, handleLogin};
}