"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/constants/api";
import { toast, TOAST_DURATION } from "@/utils/toast";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TARGET_NAMES,
} from "@/constants/messages";

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
      const response = await fetch(API_ENDPOINTS.MEAL_RECORDS(customerId, undefined, undefined, 50));
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
      const response = await fetch(API_ENDPOINTS.DAILY_NUTRITION(customerId, date));
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
        }
      );
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-float animate-pulse-glow mb-6">
            <Image
              src="/vercel.svg"
              alt="loading"
              width={200}
              height={200}
              priority
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p className="mt-4 text-gray-600 text-lg">データを読み込んでいます</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-800">{error}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">食事記録</h1>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href={`/customer/${customerId}/meal/new`}>
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300">
              新規記録
            </button>
          </Link>
          <Link href={`/customer/${customerId}/meal/goal`}>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition duration-300">
              目標設定
            </button>
          </Link>
          <button
            onClick={handleGetAdvice}
            disabled={loadingAdvice}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
          >
            {loadingAdvice ? "生成中..." : "AIアドバイス"}
          </button>
          <Link href={`/customer/${customerId}`}>
            <button className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition duration-300">
              戻る
            </button>
          </Link>
        </div>

        {/* AIアドバイス表示エリア */}
        {aiAdvice && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🍎</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-blue-800">
                    AI栄養士からのアドバイス
                  </h3>
                  <button
                    onClick={() => {
                      setAiAdvice("");
                      setCachedUntil(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold px-2"
                    title="閉じる"
                  >
                    ✕
                  </button>
                </div>
                {cachedUntil && (
                  <div className="text-xs text-gray-500 mb-2">
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
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
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
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
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
            <div className="mt-4 text-sm text-gray-600">
              食事回数: {dailySummary.meal_count}回
            </div>
          </div>
        )}

        {/* 食事記録一覧 */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    時刻
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    食事区分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    内容
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カロリー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P/F/C
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
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
                        <div className="text-xs text-gray-500 mt-1">
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
            <div className="text-center py-12 text-gray-500">
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">削除確認</h2>
            <p className="text-gray-600 mb-6">
              この食事記録を削除してもよろしいですか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
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
