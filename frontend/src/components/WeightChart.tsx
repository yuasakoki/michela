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

interface WeightRecord {
  date: string;
  weight: number;
}

interface WeightChartProps {
  data: WeightRecord[];
}

export default function WeightChart({ data }: WeightChartProps) {
  // 同じ日の体重記録をグループ化（最後の記録を使用）
  const weightByDate: { [date: string]: number } = {};

  data.forEach((record) => {
    const dateKey = record.date.split("T")[0]; // 日付部分のみ取得
    // 同じ日に複数記録がある場合、後の記録で上書き（通常は最新）
    weightByDate[dateKey] = record.weight;
  });

  // オブジェクトを配列に変換してソート（古い順）
  const formattedData = Object.entries(weightByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, weight]) => ({
      date: new Date(date).toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      }),
      weight: weight,
    }));

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">体重記録がありません</div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            domain={["dataMin - 2", "dataMax + 2"]}
            label={{ value: "体重 (kg)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="体重"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
