"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import WeightChart from "@/components/WeightChart";
import TrainingVolumeChart from "@/components/TrainingVolumeChart";
import NutritionChart from "@/components/NutritionChart";

interface Customer {
  id: string;
  name: string;
}

interface WeightRecord {
  date: string;
  weight: number;
}

interface TrainingSession {
  id: string;
  date: string;
  exercises: {
    exercise_name: string;
    sets: { reps: number; weight: number }[];
  }[];
}

interface MealRecord {
  date: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
}

interface NutritionGoal {
  target_calories: number;
  target_protein: number;
  target_fat: number;
  target_carbs: number;
}

export default function CustomerStats() {
  useAuth();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>(
    []
  );
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // 統計データ
  const [stats, setStats] = useState({
    totalTrainingSessions: 0,
    avgWeeklyTraining: 0,
    totalVolume: 0,
    avgCalories: 0,
    avgProtein: 0,
  });

  useEffect(() => {
    document.title = "統計・グラフ | MII Fit";
    fetchAllData();
  }, [customerId]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchCustomer(),
        fetchWeightHistory(),
        fetchTrainingSessions(),
        fetchMealRecords(),
        fetchNutritionGoal(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomer = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/get_customer/${customerId}`
    );
    if (response.ok) {
      const data = await response.json();
      setCustomer(data);
    }
  };

  const fetchWeightHistory = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/get_weight_history/${customerId}?limit=30`
    );
    if (response.ok) {
      const data = await response.json();
      setWeightHistory(data);
    }
  };

  const fetchTrainingSessions = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/get_training_sessions/${customerId}?limit=30`
    );
    if (response.ok) {
      const data = await response.json();
      setTrainingSessions(data);
      calculateTrainingStats(data);
    }
  };

  const fetchMealRecords = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/get_meal_records/${customerId}?limit=30`
    );
    if (response.ok) {
      const data = await response.json();
      setMealRecords(data);
      calculateNutritionStats(data);
    }
  };

  const fetchNutritionGoal = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/get_nutrition_goal/${customerId}`
    );
    if (response.ok) {
      const data = await response.json();
      setNutritionGoal(data);
    }
  };

  const calculateTrainingStats = (sessions: TrainingSession[]) => {
    const totalVolume = sessions.reduce((sum, session) => {
      const sessionVolume = session.exercises.reduce((exSum, exercise) => {
        const exerciseVolume = exercise.sets.reduce(
          (setSum, set) => setSum + set.reps * set.weight,
          0
        );
        return exSum + exerciseVolume;
      }, 0);
      return sum + sessionVolume;
    }, 0);

    // 過去30日間の週平均を計算
    const avgWeeklyTraining = (sessions.length / 30) * 7;

    setStats((prev) => ({
      ...prev,
      totalTrainingSessions: sessions.length,
      avgWeeklyTraining: Math.round(avgWeeklyTraining * 10) / 10,
      totalVolume: Math.round(totalVolume),
    }));
  };

  const calculateNutritionStats = (records: MealRecord[]) => {
    if (records.length === 0) return;

    const totalCalories = records.reduce((sum, r) => sum + r.total_calories, 0);
    const totalProtein = records.reduce((sum, r) => sum + r.total_protein, 0);

    // 日数を計算（ユニークな日付）
    const uniqueDays = new Set(records.map((r) => r.date)).size;

    setStats((prev) => ({
      ...prev,
      avgCalories: Math.round(totalCalories / uniqueDays),
      avgProtein: Math.round(totalProtein / uniqueDays),
    }));
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-4">
          <Image src="/vercel.svg" alt="logo" width={150} height={150} />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {customer?.name} - 統計・グラフ
          </h1>
        </div>

        {/* 戻るボタン */}
        <div className="mb-6">
          <Link href={`/customer/${customerId}`}>
            <button className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition duration-300">
              戻る
            </button>
          </Link>
        </div>

        {/* 統計サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 mb-1">総セッション数</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalTrainingSessions}
            </div>
            <div className="text-xs text-gray-400 mt-1">過去30日間</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 mb-1">週平均トレーニング</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.avgWeeklyTraining}回
            </div>
            <div className="text-xs text-gray-400 mt-1">過去30日間の平均</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 mb-1">総トレーニング量</div>
            <div className="text-3xl font-bold text-purple-600">
              {stats.totalVolume.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">kg（重量×回数）</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 mb-1">平均カロリー</div>
            <div className="text-3xl font-bold text-orange-600">
              {stats.avgCalories}
            </div>
            <div className="text-xs text-gray-400 mt-1">kcal/日</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 mb-1">平均タンパク質</div>
            <div className="text-3xl font-bold text-red-600">
              {stats.avgProtein}g
            </div>
            <div className="text-xs text-gray-400 mt-1">g/日</div>
          </div>
        </div>

        {/* グラフセクション */}
        <div className="space-y-8">
          {/* 体重推移グラフ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📊 体重推移
            </h2>
            <WeightChart data={weightHistory} />
          </div>

          {/* トレーニングボリューム推移グラフ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              💪 トレーニングボリューム推移
            </h2>
            <TrainingVolumeChart sessions={trainingSessions} />
          </div>

          {/* 栄養素推移グラフ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🍎 栄養素摂取量推移
            </h2>
            <NutritionChart
              records={mealRecords}
              nutritionGoal={nutritionGoal || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
