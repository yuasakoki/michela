"use client";
import React, { useEffect, useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/constants/api";
import { getAuthToken } from "@/services/authService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dumbbell, Activity, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const login = useLogin();

  useEffect(() => {
    console.log("useEffect fired");
    document.title = "MII Fit | Trainer Portal";

    // localStorageのトークンを検証してログイン済みか確認
    const checkAuth = async () => {
      const token = getAuthToken();

      // トークンがない場合はログイン画面を表示
      if (!token) {
        console.log("[Auth] No token found → show login form");
        setIsCheckingAuth(false);
        return;
      }

      console.log("[Auth] Checking token with backend...");
      try {
        const response = await fetch(API_ENDPOINTS.VERIFY_TOKEN, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("[Auth] verify_token response:", response.status);

        if (response.ok) {
          // トークンが有効 → ダッシュボードへ
          console.log("[Auth] Token valid → redirect to /dashboard");
          router.replace("/dashboard");
        } else {
          // トークンが無効 → ログイン画面を表示
          console.log("[Auth] Token invalid (401) → show login form");
          setIsCheckingAuth(false);
        }
      } catch (error) {
        // ネットワークエラー時もログイン画面を表示
        console.log("[Auth] Network error:", error);
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !login.loading) {
      login.handleLogin();
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-950">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-blue-900/50 to-transparent opacity-50" />

      <div className="w-full max-w-md animate-fadeIn z-10">
        <div className="flex flex-col items-center mb-8 animate-float">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-4 transform rotate-3 hover:rotate-6 transition-transform">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-white text-glow">
            MII FIT <span className="text-blue-500">PRO</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium tracking-wide uppercase">
            パーソナルトレーナー インテリジェンス
          </p>
        </div>

        <Card className="border-slate-800/50 shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

          <CardHeader className="space-y-1 pb-2 text-center">
            <CardTitle className="text-xl">システムログイン</CardTitle>
            <CardDescription>
              IDとパスワードを入力してアクセスしてください
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="ユーザーID"
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                    login.setUsername(value);
                  }}
                  onKeyPress={handleKeyPress}
                  value={login.username}
                  autoCapitalize="off"
                  autoComplete="username"
                  className="bg-black/20 border-slate-700/50 focus:border-blue-500/50 h-12 text-center text-lg tracking-wider font-semibold placeholder:text-slate-600 placeholder:text-sm placeholder:font-normal transition-all"
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="パスワード"
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                    login.setPassword(value);
                  }}
                  onKeyPress={handleKeyPress}
                  value={login.password}
                  autoComplete="current-password"
                  className="bg-black/20 border-slate-700/50 focus:border-blue-500/50 h-12 text-center text-lg tracking-widest placeholder:text-slate-600 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal transition-all"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={login.handleLogin}
                  isLoading={login.loading}
                  className="w-full text-base font-bold tracking-wide h-12 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 shadow-lg shadow-blue-900/30 border-t border-blue-400/20"
                >
                  {login.loading ? "認証中..." : "ログイン"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-600">
              <Activity className="h-3 w-3" />
              <span>セキュリティ接続: 確立済み</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="absolute bottom-8 text-xs text-slate-700 font-mono">
        v2.0.0 // MII FIT SYSTEM
      </div>
    </div>
  );
}
