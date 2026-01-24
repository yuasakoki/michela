"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/constants/api";
import { toast, TOAST_DURATION } from "@/utils/toast";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TARGET_NAMES,
} from "@/constants/messages";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Utensils, ArrowLeft, Plus, Target, Bot, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Food {
  food_id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  quantity: number;
}

interface MealRecord {
  id: string;
  customer_id: string;
  date: string;
  meal_type: string;
  foods: Food[];
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  notes: string;
  photo_url: string;
  created_at: string;
}

interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  meal_count: number;
}

interface NutritionGoal {
  target_calories: number;
  target_protein: number;
  target_fat: number;
  target_carbs: number;
}

const MEAL_TYPE_LABELS: { [key: string]: string } = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export default function MealHistory() {
  useAuth();
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [cachedUntil, setCachedUntil] = useState<string | null>(null);

  // 今日の日付を取得
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setSelectedDate(today);
  }, [today]);

  useEffect(() => {
    fetchMealRecords();
    fetchNutritionGoal();
  }, [customerId]);

  useEffect(() => {
    if (selectedDate) {
      fetchDailySummary(selectedDate);
    }
  }, [selectedDate, customerId]);

  const fetchMealRecords = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.MEAL_RECORDS(customerId, undefined, undefined, 50)
      );
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        setError("食事記録の取得に失敗しました。");
      }
    } catch (err) {
      setError("ネットワークエラーが発生しました。");
      console.error("Error fetching meal records:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async (date: string) => {
    try {
      const response = await fetch(
        API_ENDPOINTS.DAILY_NUTRITION(customerId, date)
      );
      if (response.ok) {
        const data = await response.json();
        setDailySummary(data);
      }
    } catch (err) {
      console.error("Error fetching daily summary:", err);
    }
  };

  const fetchNutritionGoal = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.NUTRITION_GOAL(customerId));
      if (response.ok) {
        const data = await response.json();
        setNutritionGoal(data);
      }
    } catch (err) {
      console.error("Error fetching nutrition goal:", err);
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_MEAL_RECORD(recordId), {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.DELETED());
        setDeleteId(null);
        fetchMealRecords();
        if (selectedDate) {
          fetchDailySummary(selectedDate);
        }
      } else {
        toast.error(ERROR_MESSAGES.DELETION_FAILED());
      }
    } catch (err) {
      toast.error("ネットワークエラーが発生しました");
      console.error("Error deleting meal record:", err);
    }
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    setAiAdvice("");
    setCachedUntil(null);
    try {
      const response = await fetch(API_ENDPOINTS.MEAL_ADVICE(customerId));
      if (response.ok) {
        const data = await response.json();
        setAiAdvice(data.advice);
        if (data.is_cached && data.cached_until) {
          setCachedUntil(data.cached_until);
        }
      } else {
        const error = await response.json();
        toast.error(
          `アドバイス取得に失敗: ${error.error}`,
          TOAST_DURATION.LONG
        );
      }
    } catch (err) {
      toast.error("ネットワークエラーが発生しました");
      console.error("Error fetching advice:", err);
    } finally {
      setLoadingAdvice(false);
    }
  };

  // 選択された日付の記録のみを表示
  const filteredRecords = selectedDate
    ? records.filter((r) => r.date === selectedDate)
    : records;

  // 達成率を計算
  const getAchievementRate = (current: number, target: number) => {
    if (!target) return 0;
    return Math.round((current / target) * 100);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-orange-500 font-mono text-sm animate-pulse">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500">{error}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/customer/${customerId}`}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">食事記録</h1>
                <p className="text-sm text-slate-400">栄養管理とカロリートラッキング</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/customer/${customerId}/meal/new`}>
            <Button className="bg-green-600 hover:bg-green-950/300">
              <Plus className="h-4 w-4 mr-2" />
              新規記録
            </Button>
          </Link>
          <Link href={`/customer/${customerId}/meal/goal`}>
            <Button variant="secondary" className="bg-purple-600 hover:bg-purple-500">
              <Target className="h-4 w-4 mr-2" />
              目標設定
            </Button>
          </Link>
          <Button
            onClick={handleGetAdvice}
            disabled={loadingAdvice}
            variant="secondary"
            className="bg-blue-600 hover:bg-blue-950/300"
          >
            <Bot className="h-4 w-4 mr-2" />
            {loadingAdvice ? "生成中..." : "AIアドバイス"}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">

        {/* AIアドバイス表示エリア */}
        {aiAdvice && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-800 rounded-lg p-6 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🍎</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-blue-300">
                    AI栄養士からのアドバイス
                  </h3>
                  <button
                    onClick={() => {
                      setAiAdvice("");
                      setCachedUntil(null);
                    }}
                    className="text-slate-500 hover:text-gray-700 text-xl font-bold px-2"
                    title="閉じる"
                  >
                    ✕
                  </button>
                </div>
                {cachedUntil && (
                  <div className="text-xs text-slate-500 mb-2">
                    ※ このアドバイスはキャッシュされています。次回の更新:{" "}
                    {new Date(cachedUntil).toLocaleString("ja-JP")}
                  </div>
                )}
                <div className="text-gray-700 whitespace-pre-line">
                  {aiAdvice}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 日付選択 */}
        <div className="bg-slate-900/50 shadow-md rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <label htmlFor="date" className="font-medium text-gray-700">
              日付:
            </label>
            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* 1日のサマリー */}
        {dailySummary && nutritionGoal && (
          <div className="bg-slate-900/50 shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-200 mb-4">
              {selectedDate} の栄養サマリー
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">カロリー:</span>
                    <span>
                      {dailySummary.total_calories} /{" "}
                      {nutritionGoal.target_calories} kcal (
                      {getAchievementRate(
                        dailySummary.total_calories,
                        nutritionGoal.target_calories
                      )}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          getAchievementRate(
                            dailySummary.total_calories,
                            nutritionGoal.target_calories
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">タンパク質:</span>
                    <span>
                      {dailySummary.total_protein} /{" "}
                      {nutritionGoal.target_protein} g (
                      {getAchievementRate(
                        dailySummary.total_protein,
                        nutritionGoal.target_protein
                      )}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-red-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          getAchievementRate(
                            dailySummary.total_protein,
                            nutritionGoal.target_protein
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">脂質:</span>
                    <span>
                      {dailySummary.total_fat} / {nutritionGoal.target_fat} g (
                      {getAchievementRate(
                        dailySummary.total_fat,
                        nutritionGoal.target_fat
                      )}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-yellow-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          getAchievementRate(
                            dailySummary.total_fat,
                            nutritionGoal.target_fat
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">炭水化物:</span>
                    <span>
                      {dailySummary.total_carbs} / {nutritionGoal.target_carbs}{" "}
                      g (
                      {getAchievementRate(
                        dailySummary.total_carbs,
                        nutritionGoal.target_carbs
                      )}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          getAchievementRate(
                            dailySummary.total_carbs,
                            nutritionGoal.target_carbs
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-400">
              食事回数: {dailySummary.meal_count}回
            </div>
          </div>
        )}

        {/* 食事記録一覧 */}
        <div className="bg-slate-900/50 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    時刻
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    食事区分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    内容
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    カロリー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    P/F/C
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-900/50 divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/20">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.created_at
                        ? new Date(record.created_at).toLocaleTimeString(
                            "ja-JP",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {MEAL_TYPE_LABELS[record.meal_type] || record.meal_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.foods.map((f) => f.name).join(", ")}
                      {record.notes && (
                        <div className="text-xs text-slate-500 mt-1">
                          {record.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(record.total_calories)} kcal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(record.total_protein)}g /{" "}
                      {Math.round(record.total_fat)}g /{" "}
                      {Math.round(record.total_carbs)}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setDeleteId(record.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              {selectedDate
                ? "この日の食事記録はありません。"
                : "食事記録がありません。"}
            </div>
          )}
        </div>
      </div>

      {/* 削除確認モーダル */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-900/50 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-200 mb-4">削除確認</h2>
            <p className="text-slate-400 mb-6">
              この食事記録を削除してもよろしいですか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-300 text-slate-200 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
