"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface NutritionGoal {
  customer_id: string;
  target_calories: number;
  target_protein: number;
  target_fat: number;
  target_carbs: number;
}

export default function NutritionGoalSetting() {
  useAuth();
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [targetCalories, setTargetCalories] = useState("");
  const [targetProtein, setTargetProtein] = useState("");
  const [targetFat, setTargetFat] = useState("");
  const [targetCarbs, setTargetCarbs] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNutritionGoal();
  }, [customerId]);

  const fetchNutritionGoal = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/get_nutrition_goal/${customerId}`
      );
      if (response.ok) {
        const data = await response.json();
        setTargetCalories(data.target_calories.toString());
        setTargetProtein(data.target_protein.toString());
        setTargetFat(data.target_fat.toString());
        setTargetCarbs(data.target_carbs.toString());
      }
    } catch (err) {
      console.error("Error fetching nutrition goal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!targetCalories || !targetProtein || !targetFat || !targetCarbs) {
      alert("すべての項目を入力してください。");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/set_nutrition_goal/${customerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target_calories: Number.parseInt(targetCalories),
            target_protein: Number.parseInt(targetProtein),
            target_fat: Number.parseInt(targetFat),
            target_carbs: Number.parseInt(targetCarbs),
          }),
        }
      );

      if (response.ok) {
        alert("栄養目標を設定しました！");
        router.push(`/customer/${customerId}/meal`);
      } else {
        const error = await response.json();
        alert(`設定に失敗しました: ${error.error}`);
      }
    } catch (error) {
      alert("ネットワークエラーが発生しました。");
      console.error("Error:", error);
    }
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

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">栄養目標設定</h1>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <form className="space-y-6">
            <div>
              <label
                htmlFor="targetCalories"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                目標カロリー (kcal/日)
              </label>
              <input
                id="targetCalories"
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="例: 2000"
              />
              <p className="text-xs text-gray-500 mt-1">
                減量: 体重×25-30kcal, 維持: 体重×30-35kcal, 増量: 体重×35-40kcal
              </p>
            </div>

            <div>
              <label
                htmlFor="targetProtein"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                目標タンパク質 (g/日)
              </label>
              <input
                id="targetProtein"
                type="number"
                value={targetProtein}
                onChange={(e) => setTargetProtein(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="例: 150"
              />
              <p className="text-xs text-gray-500 mt-1">
                推奨: 体重×1.6-2.2g（トレーニングする場合）
              </p>
            </div>

            <div>
              <label
                htmlFor="targetFat"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                目標脂質 (g/日)
              </label>
              <input
                id="targetFat"
                type="number"
                value={targetFat}
                onChange={(e) => setTargetFat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="例: 60"
              />
              <p className="text-xs text-gray-500 mt-1">
                推奨: 総カロリーの20-30%
              </p>
            </div>

            <div>
              <label
                htmlFor="targetCarbs"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                目標炭水化物 (g/日)
              </label>
              <input
                id="targetCarbs"
                type="number"
                value={targetCarbs}
                onChange={(e) => setTargetCarbs(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="例: 200"
              />
              <p className="text-xs text-gray-500 mt-1">
                推奨: 残りのカロリーを炭水化物で埋める（1g=4kcal）
              </p>
            </div>

            {/* PFC比率の表示 */}
            {targetProtein && targetFat && targetCarbs && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-bold text-gray-800 mb-2">PFC比率</h3>
                <div className="text-sm">
                  {(() => {
                    const p = Number.parseInt(targetProtein) * 4;
                    const f = Number.parseInt(targetFat) * 9;
                    const c = Number.parseInt(targetCarbs) * 4;
                    const total = p + f + c;
                    return (
                      <div className="grid grid-cols-3 gap-3">
                        <div>タンパク質: {Math.round((p / total) * 100)}%</div>
                        <div>脂質: {Math.round((f / total) * 100)}%</div>
                        <div>炭水化物: {Math.round((c / total) * 100)}%</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
              >
                保存
              </button>
              <Link href={`/customer/${customerId}/meal`}>
                <button
                  type="button"
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition duration-300"
                >
                  キャンセル
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
