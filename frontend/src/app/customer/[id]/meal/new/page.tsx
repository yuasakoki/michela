"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { toast, TOAST_DURATION } from "@/utils/toast";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  TARGET_NAMES,
} from "@/constants/messages";
import { toast } from "@/utils/toast";

interface FoodPreset {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Food {
  food_id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  quantity: number;
}

export default function NewMealRecord() {
  useAuth();
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [date, setDate] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [foods, setFoods] = useState<Food[]>([]);
  const [notes, setNotes] = useState("");
  const [foodPresets, setFoodPresets] = useState<FoodPreset[]>([]);
  const [loading, setLoading] = useState(true);

  // 今日の日付をデフォルトに
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  useEffect(() => {
    fetchFoodPresets();
  }, []);

  const fetchFoodPresets = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/get_food_presets`
      );
      if (response.ok) {
        const data = await response.json();
        setFoodPresets(data);
      }
    } catch (err) {
      console.error("Error fetching food presets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = () => {
    if (foodPresets.length > 0) {
      const firstPreset = foodPresets[0];
      setFoods([
        ...foods,
        {
          food_id: firstPreset.id,
          name: firstPreset.name,
          calories: firstPreset.calories,
          protein: firstPreset.protein,
          fat: firstPreset.fat,
          carbs: firstPreset.carbs,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveFood = (index: number) => {
    const newFoods = foods.filter((_, i) => i !== index);
    setFoods(newFoods);
  };

  const handleFoodChange = (index: number, field: string, value: any) => {
    const newFoods = [...foods];

    if (field === "food_id") {
      // プリセットから選択された場合
      const preset = foodPresets.find((p) => p.id === value);
      if (preset) {
        newFoods[index] = {
          food_id: preset.id,
          name: preset.name,
          calories: preset.calories,
          protein: preset.protein,
          fat: preset.fat,
          carbs: preset.carbs,
          quantity: newFoods[index].quantity,
        };
      }
    } else {
      newFoods[index] = { ...newFoods[index], [field]: value };
    }

    setFoods(newFoods);
  };

  const calculateTotals = () => {
    const totals = foods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories * food.quantity,
        protein: acc.protein + food.protein * food.quantity,
        fat: acc.fat + food.fat * food.quantity,
        carbs: acc.carbs + food.carbs * food.quantity,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
    return totals;
  };

  const handleSubmit = async () => {
    if (!date || !mealType || foods.length === 0) {
      toast.warning(WARNING_MESSAGES.REQUIRED_FIELD("必須項目"));
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/add_meal_record`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_id: customerId,
            date: date,
            meal_type: mealType,
            foods: foods,
            notes: notes,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          SUCCESS_MESSAGES.REGISTERED(TARGET_NAMES.MEAL_RECORD),
          TOAST_DURATION.SHORT
        );
        setTimeout(() => {
          router.push(`/customer/${customerId}/meal`);
        }, TOAST_DURATION.SHORT);
      } else {
        const error = await response.json();
        toast.error(
          ERROR_MESSAGES.REGISTRATION_FAILED(
            TARGET_NAMES.MEAL_RECORD,
            error.error
          ),
          TOAST_DURATION.LONG
        );
      }
    } catch (error) {
      toast.error("ネットワークエラーが発生しました");
      console.error("Error:", error);
    }
  };

  const totals = calculateTotals();

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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">食事記録登録</h1>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <form className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  日付 <span className="text-red-500">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label
                  htmlFor="mealType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  食事区分 <span className="text-red-500">*</span>
                </label>
                <select
                  id="mealType"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="breakfast">朝食</option>
                  <option value="lunch">昼食</option>
                  <option value="dinner">夕食</option>
                  <option value="snack">間食</option>
                </select>
              </div>
            </div>

            {/* 食品リスト */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  食品 <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddFood}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  + 食品追加
                </button>
              </div>

              {foods.map((food, index) => (
                <div
                  key={index}
                  className="border border-gray-300 rounded-md p-4 mb-3 bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        食品名
                      </label>
                      <select
                        value={food.food_id}
                        onChange={(e) =>
                          handleFoodChange(index, "food_id", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        {foodPresets.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        数量
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={food.quantity}
                        onChange={(e) =>
                          handleFoodChange(
                            index,
                            "quantity",
                            Number.parseFloat(e.target.value) || 1
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        カロリー (kcal)
                      </label>
                      <input
                        type="number"
                        value={Math.round(food.calories * food.quantity)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        P (g)
                      </label>
                      <input
                        type="number"
                        value={(food.protein * food.quantity).toFixed(1)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        F (g)
                      </label>
                      <input
                        type="number"
                        value={(food.fat * food.quantity).toFixed(1)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        C (g)
                      </label>
                      <input
                        type="number"
                        value={(food.carbs * food.quantity).toFixed(1)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveFood(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}

              {foods.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
                  食品を追加してください
                </div>
              )}
            </div>

            {/* 合計値 */}
            {foods.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-bold text-gray-800 mb-2">合計</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="font-medium">カロリー:</span>{" "}
                    {Math.round(totals.calories)} kcal
                  </div>
                  <div>
                    <span className="font-medium">タンパク質:</span>{" "}
                    {totals.protein.toFixed(1)} g
                  </div>
                  <div>
                    <span className="font-medium">脂質:</span>{" "}
                    {totals.fat.toFixed(1)} g
                  </div>
                  <div>
                    <span className="font-medium">炭水化物:</span>{" "}
                    {totals.carbs.toFixed(1)} g
                  </div>
                </div>
              </div>
            )}

            {/* メモ */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                メモ
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="例: 外食、自炊、など"
              />
            </div>

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
              >
                登録
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
