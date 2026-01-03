"use client";
import Image from "next/image";
import { useLogin } from "../hooks/useLogin";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    document.title = "MII Fit";
  }, []);

  const login = useLogin();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !login.loading) {
      login.handleLogin();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-center mb-4">
          <Image src="/vercel.svg" alt="logo" width={150} height={150} />
        </div>
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="ユーザー名"
            onChange={(e) => login.setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            value={login.username}
            inputMode="text"
            autoCapitalize="off"
            autoComplete="username"
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="password"
            placeholder="パスワード"
            onChange={(e) => login.setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            value={login.password}
            autoComplete="current-password"
            className="border border-gray-300 rounded-lg px-3 py-2"
          />

          <button
            onClick={login.handleLogin}
            disabled={login.loading}
            className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {login.loading ? "ログイン中..." : "ログイン"}
          </button>
        </div>
      </div>
    </div>
  );
}
