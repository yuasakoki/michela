"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast, TOAST_DURATION } from "@/utils/toast";
import { API_ENDPOINTS } from "@/constants/api";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TARGET_NAMES,
} from "@/constants/messages";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { UserPlus, ChevronLeft, Ruler, Weight, Calendar, Utensils, Hash } from "lucide-react";

export default function CustomerRegist() {
  useAuth();
  const router = useRouter();

  useEffect(() => {
    document.title = "顧客登録 | MII Fit Pro";
  }, []);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [favoriteFood, setFavoriteFood] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER_CUSTOMER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          age: Number.parseInt(age),
          height: Number.parseFloat(height),
          weight: Number.parseFloat(weight),
          favorite_food: favoriteFood,
          completion_date: completionDate,
        }),
      });

      if (response.ok) {
        toast.success(
          SUCCESS_MESSAGES.REGISTERED(TARGET_NAMES.CUSTOMER),
          TOAST_DURATION.SHORT
        );
        setName("");
        setAge("");
        setHeight("");
        setWeight("");
        setFavoriteFood("");
        setCompletionDate("");
        setTimeout(() => {
          router.push("/dashboard");
        }, TOAST_DURATION.SHORT);
      } else {
        const error = await response.json();
        toast.error(
          ERROR_MESSAGES.REGISTRATION_FAILED(
            TARGET_NAMES.CUSTOMER,
            error.error
          ),
          TOAST_DURATION.LONG
        );
      }
    } catch (error) {
      toast.error("Network error occurred.");
      console.error("Error:", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-lg border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <CardHeader>
             <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                    <CardTitle>新規顧客プロフィール</CardTitle>
                    <p className="text-sm text-slate-400">新しいトレーニングプログラムを開始します。</p>
                </div>
             </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">氏名</label>
            <Input
              placeholder="例: 山田 太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950 border-slate-700 focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3 h-3" /> 年齢
                </label>
                <Input
                  type="number"
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="bg-slate-950 border-slate-700 focus:border-blue-500"
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 目標日
                </label>
                <Input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="bg-slate-950 border-slate-700 focus:border-blue-500"
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> 身長 (cm)
                </label>
                <Input
                  type="number"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="bg-slate-950 border-slate-700 focus:border-blue-500"
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Weight className="w-3 h-3" /> 体重 (kg)
                </label>
                <Input
                  type="number"
                  placeholder="70.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-slate-950 border-slate-700 focus:border-blue-500"
                />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Utensils className="w-3 h-3" /> 好きな食べ物
            </label>
            <Input
              placeholder="例: 鶏むね肉"
              value={favoriteFood}
              onChange={(e) => setFavoriteFood(e.target.value)}
              className="bg-slate-950 border-slate-700 focus:border-blue-500"
            />
          </div>

          <Button
            onClick={handleSubmit}
            isLoading={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500"
          >
             {loading ? "登録中..." : "プロフィール作成"}
          </Button>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-800/50 pt-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ChevronLeft className="mr-2 h-4 w-4" /> キャンセルして戻る
              </Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
