"use client";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MealRecord {
  date: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
}

interface NutritionChartProps {
  records: MealRecord[];
  nutritionGoal?: {
    target_calories: number;
    target_protein: number;
    target_fat: number;
    target_carbs: number;
  };
}

export default function NutritionChart({
  records,
  nutritionGoal,
}: NutritionChartProps) {
  // 日別の栄養素を集計
  const dailyData = records.reduce((acc, record) => {
    const date = record.date;
    if (!acc[date]) {
      acc[date] = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      };
    }
    acc[date].calories += record.total_calories;
    acc[date].protein += record.total_protein;
    acc[date].fat += record.total_fat;
    acc[date].carbs += record.total_carbs;
    return acc;
  }, {} as Record<string, { calories: number; protein: number; fat: number; carbs: number }>);

  // グラフ用データに変換
  const chartData = Object.entries(dailyData)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      }),
      カロリー: Math.round(data.calories),
      タンパク質: Math.round(data.protein),
      脂質: Math.round(data.fat),
      炭水化物: Math.round(data.carbs),
    }));

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">食事記録がありません</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* カロリー推移グラフ */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          カロリー摂取量推移
        </h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="カロリー"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              {nutritionGoal && (
                <Line
                  type="monotone"
                  data={chartData.map((d) => ({
                    ...d,
                    目標: nutritionGoal.target_calories,
                  }))}
                  dataKey="目標"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PFCバランス推移グラフ */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          PFCバランス推移
        </h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                label={{ value: "g", angle: 0, position: "insideTopRight" }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="タンパク質"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="脂質"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="炭水化物"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
