"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { toast, TOAST_DURATION } from "@/utils/toast";
import { API_ENDPOINTS, COMMON_ERROR_MESSAGES } from "@/constants/api";
import { ROUTES } from "@/constants/routes";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  TARGET_NAMES,
} from "@/constants/messages";

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
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  age: number;
  weight: number;
}

export default function NewTrainingSession() {
  useAuth();

  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState("");
  const [exercisePresets, setExercisePresets] = useState<ExercisePreset[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showExerciseManager, setShowExerciseManager] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newExerciseCategory, setNewExerciseCategory] = useState("");

  // 部位の定義
  const categories = [
    { id: "chest", name: "胸" },
    { id: "back", name: "背中" },
    { id: "shoulders", name: "肩" },
    { id: "arms", name: "腕" },
    { id: "legs", name: "脚" },
    { id: "abs", name: "腹筋" },
    { id: "other", name: "その他" },
  ];

  // 体重と年齢からデフォルト重量を算出（初心者向け: 体重の30-40%）
  const calculateDefaultWeight = (): number => {
    if (!customer) return 20;

    // 年齢による係数調整
    let factor = 0.35; // デフォルト35%
    if (customer.age < 30) {
      factor = 0.4; // 若い人は少し高め
    } else if (customer.age > 60) {
      factor = 0.3; // 高齢者は低め
    }

    const weight = customer.weight * factor;
    // 2.5kg単位に丸める
    return Math.round(weight / 2.5) * 2.5;
  };

  // 選択された部位に応じて種目をフィルタリング
  const filteredExercises = selectedCategory
    ? exercisePresets.filter((preset) => preset.category === selectedCategory)
    : [];

  // 入力内容をローカルストレージに自動保存（下書き）
  useEffect(() => {
    if (exercises.length > 0 || notes.trim() !== "") {
      const draftKey = `training_draft_${customerId}`;
      const draft = {
        date,
        exercises,
        notes,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [date, exercises, notes, customerId]);

  useEffect(() => {
    document.title = "トレーニング記録 - 新規登録 | MII Fit";
    fetchCustomer();
    fetchExercisePresets();

    // ローカルストレージから下書きを復元
    const draftKey = `training_draft_${customerId}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (confirm("保存された下書きがあります。復元しますか？")) {
          setDate(draft.date || new Date().toISOString().split("T")[0]);
          setExercises(draft.exercises || []);
          setNotes(draft.notes || "");
        } else {
          // 復元しない場合は下書きを削除
          localStorage.removeItem(draftKey);
        }
      } catch (error) {
        console.error("下書きの復元に失敗しました:", error);
      }
    }
  }, []);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CUSTOMER(customerId));
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const fetchExercisePresets = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.EXERCISE_PRESETS);
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
      toast.warning(
        WARNING_MESSAGES.REQUIRED_SELECTION(TARGET_NAMES.TRAINING_EXERCISE)
      );
      return;
    }
    const preset = exercisePresets.find((p) => p.id === selectedExercise);
    if (!preset) return;

    const defaultWeight = calculateDefaultWeight();

    setExercises([
      ...exercises,
      {
        exercise_id: preset.id,
        exercise_name: preset.name,
        sets: [{ reps: 10, weight: defaultWeight }],
        notes: "",
      },
    ]);
    setSelectedExercise("");
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    // セット1の値を引き継ぐ
    const firstSet = newExercises[exerciseIndex].sets[0];
    newExercises[exerciseIndex].sets.push({ ...firstSet });
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

  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].notes = notes;
    setExercises(newExercises);
  };

  const handleAddExercisePreset = async () => {
    if (!newExerciseName.trim()) {
      toast.warning(WARNING_MESSAGES.REQUIRED_FIELD("種目名"));
      return;
    }

    if (!newExerciseCategory) {
      toast.warning(WARNING_MESSAGES.REQUIRED_SELECTION("部位"));
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.ADD_EXERCISE_PRESET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newExerciseName,
          category: newExerciseCategory,
        }),
      });

      if (response.ok) {
        toast.success(
          SUCCESS_MESSAGES.REGISTERED(TARGET_NAMES.TRAINING_EXERCISE)
        );
        setNewExerciseName("");
        setNewExerciseCategory("");
        fetchExercisePresets();
      } else {
        const error = await response.json();
        toast.error(
          ERROR_MESSAGES.REGISTRATION_FAILED(
            TARGET_NAMES.TRAINING_EXERCISE,
            error.error
          )
        );
      }
    } catch (error) {
      toast.error(COMMON_ERROR_MESSAGES.NETWORK_ERROR);
      console.error("Error:", error);
    }
  };

  const handleDeleteExercisePreset = async (exerciseId: string) => {
    if (!confirm("この種目を削除しますか？")) {
      return;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.DELETE_EXERCISE_PRESET(exerciseId),
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.DELETED(TARGET_NAMES.TRAINING_EXERCISE));
        fetchExercisePresets();
      } else {
        const error = await response.json();
        toast.error(
          ERROR_MESSAGES.DELETION_FAILED(
            TARGET_NAMES.TRAINING_EXERCISE,
            error.error
          )
        );
      }
    } catch (error) {
      toast.error(COMMON_ERROR_MESSAGES.NETWORK_ERROR);
      console.error("Error:", error);
    }
  };

  const handleSubmit = async () => {
    if (exercises.length === 0) {
      toast.warning(
        WARNING_MESSAGES.MINIMUM_REQUIRED(TARGET_NAMES.TRAINING_EXERCISE)
      );
      return;
    }

    // 登録処理中の表示
    const loadingAlert = document.createElement("div");
    loadingAlert.id = "loading-alert";
    loadingAlert.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    loadingAlert.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="text-gray-800">登録中...</span>
        </div>
      </div>
    `;
    document.body.appendChild(loadingAlert);

    try {
      const response = await fetch(API_ENDPOINTS.ADD_TRAINING_SESSION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          date,
          exercises,
          notes,
          duration_minutes: 0,
        }),
      });

      // ローディング表示を削除
      document.body.removeChild(loadingAlert);

      if (response.ok) {
        // 登録成功時に下書きを削除
        const draftKey = `training_draft_${customerId}`;
        localStorage.removeItem(draftKey);

        toast.success("登録が完了しました✨", TOAST_DURATION.SHORT);
        setTimeout(() => {
          router.push(ROUTES.TRAINING_LIST(customerId));
        }, TOAST_DURATION.SHORT);
      } else {
        const error = await response.json();
        toast.error(
          `登録に失敗しました\n入力内容は保存されています`,
          TOAST_DURATION.LONG
        );
      }
    } catch (error) {
      // ローディング表示を削除
      const loadingElement = document.getElementById("loading-alert");
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }

      toast.error(
        COMMON_ERROR_MESSAGES.NETWORK_ERROR_RETRY,
        TOAST_DURATION.VERY_LONG
      );
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

        {/* 自動保存通知 */}
        {(exercises.length > 0 || notes.trim() !== "") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-blue-800">
              入力内容は自動的に保存されています
            </span>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="space-y-4">
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  種目を追加
                </label>
                <button
                  onClick={() => setShowExerciseManager(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  種目を管理
                </button>
              </div>
              <div className="space-y-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedExercise("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">まず部位を選択...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!selectedCategory}
                  >
                    <option value="">
                      {selectedCategory
                        ? "種目を選択..."
                        : "まず部位を選択してください"}
                    </option>
                    {filteredExercises.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addExercise}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={!selectedExercise}
                  >
                    追加
                  </button>
                </div>
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
                  <select
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
                  >
                    {Array.from({ length: 40 }, (_, i) => i + 1).map((reps) => (
                      <option key={reps} value={reps}>
                        {reps}回
                      </option>
                    ))}
                  </select>
                  <select
                    value={set.weight}
                    onChange={(e) =>
                      updateSet(
                        exerciseIdx,
                        setIdx,
                        "weight",
                        Number.parseFloat(e.target.value)
                      )
                    }
                    className="w-24 px-2 py-1 border border-gray-300 rounded"
                  >
                    {Array.from({ length: 80 }, (_, i) => (i + 1) * 2.5).map(
                      (weight) => (
                        <option key={weight} value={weight}>
                          {weight}kg
                        </option>
                      )
                    )}
                  </select>
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

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                種目メモ
              </label>
              <textarea
                value={exercise.notes || ""}
                onChange={(e) =>
                  updateExerciseNotes(exerciseIdx, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={2}
                placeholder="この種目のフォームや気づきをメモ..."
              />
            </div>
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

      {/* 種目管理モーダル */}
      {showExerciseManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">種目管理</h2>
              <button
                onClick={() => setShowExerciseManager(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* 新規種目追加フォーム */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しい種目を追加
              </label>
              <div className="space-y-2">
                <select
                  value={newExerciseCategory}
                  onChange={(e) => setNewExerciseCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">部位を選択...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newExerciseName}
                    onChange={(e) => setNewExerciseName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="種目名を入力..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddExercisePreset();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddExercisePreset}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>

            {/* 種目一覧 */}
            <div className="space-y-2">
              {exercisePresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100"
                >
                  <span className="font-medium">{preset.name}</span>
                  <button
                    onClick={() => handleDeleteExercisePreset(preset.id)}
                    className="text-red-600 hover:text-red-800 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowExerciseManager(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
