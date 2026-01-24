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

// 日別データを集計するヘルパー関数
function aggregateDailyData(records: MealRecord[]) {
  const dailyData = records.reduce(
    (acc, record) => {
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
    },
    {} as Record<
      string,
      { calories: number; protein: number; fat: number; carbs: number }
    >,
  );

  return Object.entries(dailyData)
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
}

// カロリー摂取量グラフ
export function CalorieChart({ records, nutritionGoal }: NutritionChartProps) {
  const chartData = aggregateDailyData(records);

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        食事記録がありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="カロリー"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 3 }}
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
  );
}

// PFCバランスグラフ
export function PFCChart({ records }: { records: MealRecord[] }) {
  const chartData = aggregateDailyData(records);

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        食事記録がありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
        <YAxis
          stroke="#94a3b8"
          fontSize={12}
          label={{
            value: "g",
            angle: 0,
            position: "insideTopRight",
            fill: "#94a3b8",
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="タンパク質"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="脂質"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="炭水化物"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 後方互換性のためのデフォルトエクスポート（両方のグラフを含む）
export default function NutritionChart({
  records,
  nutritionGoal,
}: NutritionChartProps) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        食事記録がありません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-64">
        <CalorieChart records={records} nutritionGoal={nutritionGoal} />
      </div>
      <div className="h-64">
        <PFCChart records={records} />
      </div>
    </div>
  );
}
