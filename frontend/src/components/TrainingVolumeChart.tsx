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

interface TrainingSession {
  id: string;
  date: string;
  exercises: {
    exercise_name: string;
    sets: { reps: number; weight: number }[];
  }[];
}

interface TrainingVolumeChartProps {
  sessions: TrainingSession[];
}

export default function TrainingVolumeChart({
  sessions,
}: TrainingVolumeChartProps) {
  // 同じ日のセッションをグループ化してボリュームを合算
  const volumeByDate: { [date: string]: number } = {};

  sessions.forEach((session) => {
    const dateKey = session.date.split("T")[0]; // 日付部分のみ取得
    const totalVolume = session.exercises.reduce((sum, exercise) => {
      const exerciseVolume = exercise.sets.reduce(
        (setSum, set) => setSum + set.reps * set.weight,
        0
      );
      return sum + exerciseVolume;
    }, 0);

    if (!volumeByDate[dateKey]) {
      volumeByDate[dateKey] = 0;
    }
    volumeByDate[dateKey] += totalVolume;
  });

  // オブジェクトを配列に変換してソート（古い順）
  const chartData = Object.entries(volumeByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB)) // まず日付順にソート
    .map(([date, volume]) => ({
      date: new Date(date).toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      }),
      volume: volume,
    }));

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        トレーニング記録がありません
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            label={{
              value: "総ボリューム (kg)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="volume"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="総ボリューム"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
