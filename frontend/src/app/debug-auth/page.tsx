"use client";
import { useEffect, useState } from "react";
import { getCurrentUser, isDeveloper, logoutApi } from "@/services/authService";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DebugAuth() {
  const [user, setUser] = useState<any>(null);
  const [isDevRole, setIsDevRole] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsDevRole(isDeveloper());
  }, []);

  const handleLogout = () => {
    logoutApi();
    router.push("/");
  };

  const handleClearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    alert("全てのストレージをクリアしました。ログインページに戻ります。");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🔍 認証デバッグページ
        </h1>

        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h2 className="text-xl font-semibold mb-3">現在のログイン情報</h2>
          {user ? (
            <div className="space-y-2">
              <p>
                <strong>ユーザーID:</strong> {user.id}
              </p>
              <p>
                <strong>ユーザー名:</strong> {user.username}
              </p>
              <p>
                <strong>権限:</strong>{" "}
                {user.role === 1 ? "🛠️ 開発者 (role=1)" : "👤 使用者 (role=0)"}
              </p>
              <p>
                <strong>メール:</strong> {user.email || "なし"}
              </p>
              <p>
                <strong>isDeveloper():</strong>{" "}
                {isDevRole ? "true ✅" : "false ❌"}
              </p>
            </div>
          ) : (
            <p className="text-red-600">ログイン情報が見つかりません</p>
          )}
        </div>

        <div className="mb-6 p-4 bg-yellow-50 rounded">
          <h2 className="text-xl font-semibold mb-3">LocalStorageデータ</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(
              {
                auth_token: localStorage.getItem("michela_auth_token"),
                user_data: localStorage.getItem("michela_user_data"),
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="mb-6 p-4 bg-green-50 rounded">
          <h2 className="text-xl font-semibold mb-3">デフォルトユーザー情報</h2>
          <div className="space-y-2">
            <p>
              <strong>開発者アカウント:</strong>
            </p>
            <p className="ml-4">
              ユーザー名:{" "}
              <code className="bg-gray-200 px-2 py-1 rounded">admin</code>
            </p>
            <p className="ml-4">
              パスワード:{" "}
              <code className="bg-gray-200 px-2 py-1 rounded">1234</code>
            </p>
            <p className="ml-4">権限: 開発者 (role=1)</p>

            <p className="mt-4">
              <strong>使用者アカウント:</strong>
            </p>
            <p className="ml-4">
              ユーザー名:{" "}
              <code className="bg-gray-200 px-2 py-1 rounded">user</code>
            </p>
            <p className="ml-4">
              パスワード:{" "}
              <code className="bg-gray-200 px-2 py-1 rounded">user123</code>
            </p>
            <p className="ml-4">権限: 使用者 (role=0)</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-300"
          >
            ログアウト
          </button>
          <button
            onClick={handleClearStorage}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg shadow-md hover:bg-orange-700 transition duration-300"
          >
            全ストレージクリア
          </button>
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
              ダッシュボードへ
            </button>
          </Link>
          <Link href="/">
            <button className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition duration-300">
              ログインページへ
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
