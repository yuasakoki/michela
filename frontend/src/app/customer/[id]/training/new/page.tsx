"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

interface ExercisePreset {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface ExerciseSet {
  reps: number;
  weight: number;
}

interface Exercise {
  exercise_id: string;
  exercise_name: string;
  sets: ExerciseSet[];
}

export default function NewTrainingSession() {
  useAuth();

  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [exercisePresets, setExercisePresets] = useState<ExercisePreset[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");

  useEffect(() => {
    document.title = "トレーニング記録 - 新規登録 | MII Fit";
    fetchExercisePresets();
  }, []);

  const fetchExercisePresets = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/get_exercise_presets`
      );
      if (response.ok) {
        const data = await response.json();
        setExercisePresets(data);
      }
    } catch (error) {
      console.error("Error fetching exercise presets:", error);
    }
  };

  const addExercise = () => {
    if (!selectedExercise) {
      alert("種目を選択してください");
      return;
    }
    const preset = exercisePresets.find((p) => p.id === selectedExercise);
    if (!preset) return;

    setExercises([
      ...exercises,
      {
        exercise_id: preset.id,
        exercise_name: preset.name,
        sets: [{ reps: 10, weight: 20 }],
      },
    ]);
    setSelectedExercise("");
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const lastSet =
      newExercises[exerciseIndex].sets[
        newExercises[exerciseIndex].sets.length - 1
      ];
    newExercises[exerciseIndex].sets.push({ ...lastSet });
    setExercises(newExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.splice(setIndex, 1);
    if (newExercises[exerciseIndex].sets.length === 0) {
      newExercises.splice(exerciseIndex, 1);
    }
    setExercises(newExercises);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: "reps" | "weight",
    value: number
  ) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex][field] = value;
    setExercises(newExercises);
  };

  const removeExercise = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    newExercises.splice(exerciseIndex, 1);
    setExercises(newExercises);
  };

  const handleSubmit = async () => {
    if (exercises.length === 0) {
      alert("少なくとも1つの種目を追加してください");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/add_training_session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customerId,
            date,
            exercises,
            notes,
            duration_minutes: durationMinutes,
          }),
        }
      );

      if (response.ok) {
        alert("トレーニング記録を登録しました");
        router.push(`/customer/${customerId}/training`);
      } else {
        const error = await response.json();
        alert(`登録に失敗しました: ${error.error}`);
      }
    } catch (error) {
      alert("ネットワークエラーが発生しました");
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-4">
          <Image src="/vercel.svg" alt="logo" width={150} height={150} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          トレーニング記録 - 新規登録
        </h1>

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所要時間（分）
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(Number.parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                種目を追加
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">種目を選択...</option>
                  {exercisePresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addExercise}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        </div>

        {exercises.map((exercise, exerciseIdx) => (
          <div
            key={exerciseIdx}
            className="bg-white shadow-lg rounded-lg p-6 mb-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {exercise.exercise_name}
              </h3>
              <button
                onClick={() => removeExercise(exerciseIdx)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                削除
              </button>
            </div>

            <div className="space-y-2">
              {exercise.sets.map((set, setIdx) => (
                <div key={setIdx} className="flex gap-2 items-center">
                  <span className="text-sm text-gray-600 w-16">
                    セット{setIdx + 1}
                  </span>
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) =>
                      updateSet(
                        exerciseIdx,
                        setIdx,
                        "reps",
                        Number.parseInt(e.target.value)
                      )
                    }
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                    min="0"
                  />
                  <span className="text-sm">回</span>
                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) =>
                      updateSet(
                        exerciseIdx,
                        setIdx,
                        "weight",
                        Number.parseFloat(e.target.value)
                      )
                    }
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                    min="0"
                    step="0.5"
                  />
                  <span className="text-sm">kg</span>
                  <button
                    onClick={() => removeSet(exerciseIdx, setIdx)}
                    className="ml-auto text-red-600 hover:text-red-800 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addSet(exerciseIdx)}
              className="mt-3 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
            >
              + セット追加
            </button>
          </div>
        ))}

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メモ
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={4}
            placeholder="トレーニングの内容や体調などのメモ..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300"
          >
            登録
          </button>
          <Link href={`/customer/${customerId}/training`}>
            <button className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition duration-300">
              キャンセル
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
