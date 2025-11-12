"use client";
import Image from "next/image";
import { useLogin } from "../hooks/useLogin";

export default function Home() {
  const login = useLogin();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          ようこそ
        </h1>

        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="ユーザー名"
            onChange={(e) => login.setUsername(e.target.value)}
            value={login.username}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="password"
            placeholder="パスワード"
            onChange={(e) => login.setPassword(e.target.value)}
            value={login.password}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />

          <button
            onClick={login.handleLogin}
            className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            ログイン
          </button>
        </div>
      </div>
    </div>
  );
}
