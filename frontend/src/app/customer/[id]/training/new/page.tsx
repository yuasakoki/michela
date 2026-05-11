"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast, TOAST_DURATION } from "@/utils/toast";
import { API_ENDPOINTS, COMMON_ERROR_MESSAGES } from "@/constants/api";
import {
  fetchMaxWeightApi,
  fetchRecommendedSetsApi,
} from "@/services/trainingService";
import { authFetch } from "@/services/authService";
import { ROUTES } from "@/constants/routes";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  TARGET_NAMES,
} from "@/constants/messages";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Dumbbell,
  ArrowLeft,
  Plus,
  Save,
  X,
  Settings,
  Check,
} from "lucide-react";

interface ExercisePreset {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface ExerciseSet {
  set_number: number;
  set_type: "warmup" | "working";
  weight_kg: number;
  reps_planned: number;
  reps_actual: number;
  rir_target: number | null;
}

interface Exercise {
  exercise_id: string;
  exercise_name: string;
  sets: ExerciseSet[];
  notes?: string;
  max_weight_kg?: number | null;
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
  const [maxWeight, setMaxWeight] = useState<number | null>(null);
  const [generatingRecommendationFor, setGeneratingRecommendationFor] =
    useState<number | null>(null);

  const categories = [
    { id: "chest", name: "胸" },
    { id: "back", name: "背中" },
    { id: "shoulders", name: "肩" },
    { id: "arms", name: "腕" },
    { id: "legs", name: "脚" },
    { id: "abs", name: "腹筋" },
    { id: "other", name: "その他" },
  ];

  const calculateDefaultWeight = (): number => {
    if (!customer) return 20;

    let factor = 0.35;
    if (customer.age < 30) {
      factor = 0.4;
    } else if (customer.age > 60) {
      factor = 0.3;
    }

    const weight = customer.weight * factor;
    return Math.round(weight / 2.5) * 2.5;
  };

  const filteredExercises = selectedCategory
    ? exercisePresets.filter((preset) => preset.category === selectedCategory)
    : [];

  useEffect(() => {
    if (!selectedExercise) {
      setMaxWeight(null);
      return;
    }
    fetchMaxWeightApi(customerId, selectedExercise).then((w) => {
      setMaxWeight(w);
    });
  }, [selectedExercise, customerId]);

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
        WARNING_MESSAGES.REQUIRED_SELECTION(TARGET_NAMES.TRAINING_EXERCISE),
      );
      return;
    }
    const preset = exercisePresets.find((p) => p.id === selectedExercise);
    if (!preset) return;

    const sets: ExerciseSet[] = [
      {
        set_number: 1,
        set_type: "working",
        weight_kg: maxWeight ?? calculateDefaultWeight(),
        reps_planned: 10,
        reps_actual: 10,
        rir_target: null,
      },
    ];

    setExercises([
      ...exercises,
      {
        exercise_id: preset.id,
        exercise_name: preset.name,
        sets,
        notes: "",
        max_weight_kg: maxWeight,
      },
    ]);
    setSelectedExercise("");
    setMaxWeight(null);
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const sets = newExercises[exerciseIndex].sets;
    const lastSet = sets[sets.length - 1];
    newExercises[exerciseIndex].sets.push({
      ...lastSet,
      set_number: sets.length + 1,
    });
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
    field: "reps_actual" | "weight_kg",
    value: number,
  ) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex][field] = value;
    setExercises(newExercises);
  };

  const handleGenerateRecommendationForExercise = async (
    exerciseIndex: number,
  ) => {
    const exercise = exercises[exerciseIndex];
    setGeneratingRecommendationFor(exerciseIndex);
    const data = await fetchRecommendedSetsApi(
      customerId,
      exercise.exercise_id,
    );
    if (data) {
      const newExercises = [...exercises];
      newExercises[exerciseIndex].sets = data.recommended_sets;
      newExercises[exerciseIndex].max_weight_kg = data.actual_max_kg;
      setExercises(newExercises);
    }
    setGeneratingRecommendationFor(null);
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
          SUCCESS_MESSAGES.REGISTERED(TARGET_NAMES.TRAINING_EXERCISE),
        );
        setNewExerciseName("");
        setNewExerciseCategory("");
        fetchExercisePresets();
      } else {
        const error = await response.json();
        toast.error(
          ERROR_MESSAGES.REGISTRATION_FAILED(
            TARGET_NAMES.TRAINING_EXERCISE,
            error.error,
          ),
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
        },
      );

      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.DELETED(TARGET_NAMES.TRAINING_EXERCISE));
        fetchExercisePresets();
      } else {
        const error = await response.json();
        toast.error(
          ERROR_MESSAGES.DELETION_FAILED(
            TARGET_NAMES.TRAINING_EXERCISE,
            error.error,
          ),
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
        WARNING_MESSAGES.MINIMUM_REQUIRED(TARGET_NAMES.TRAINING_EXERCISE),
      );
      return;
    }

    const loadingAlert = document.createElement("div");
    loadingAlert.id = "loading-alert";
    loadingAlert.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    loadingAlert.innerHTML = `
      <div class="bg-slate-900 rounded-lg p-6 max-w-sm mx-4 border border-slate-700">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span class="text-slate-200">登録中...</span>
        </div>
      </div>
    `;
    document.body.appendChild(loadingAlert);

    try {
      const response = await authFetch(API_ENDPOINTS.ADD_TRAINING_SESSION, {
        method: "POST",
        body: JSON.stringify({
          customer_id: customerId,
          date,
          exercises,
          notes,
          duration_minutes: 0,
        }),
      });

      document.body.removeChild(loadingAlert);

      if (response.ok) {
        const draftKey = `training_draft_${customerId}`;
        localStorage.removeItem(draftKey);

        toast.success("登録が完了しました", TOAST_DURATION.SHORT);
        setTimeout(() => {
          router.push(ROUTES.TRAINING_LIST(customerId));
        }, TOAST_DURATION.SHORT);
      } else {
        const error = await response.json();
        toast.error(
          `登録に失敗しました\n入力内容は保存されています`,
          TOAST_DURATION.LONG,
        );
      }
    } catch (error) {
      const loadingElement = document.getElementById("loading-alert");
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }

      toast.error(
        COMMON_ERROR_MESSAGES.NETWORK_ERROR_RETRY,
        TOAST_DURATION.VERY_LONG,
      );
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/customer/${customerId}/training`}>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  新規トレーニング記録
                </h1>
                <p className="text-sm text-slate-400">
                  {customer?.name || "読み込み中..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Date and Exercise Selection */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                日付
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-300">
                  種目を追加
                </label>
                <button
                  onClick={() => setShowExerciseManager(true)}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" />
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">部位を選択...</option>
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
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                    disabled={!selectedCategory}
                  >
                    <option value="">
                      {selectedCategory
                        ? "種目を選択..."
                        : "部位を選択してください"}
                    </option>
                    {filteredExercises.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={addExercise}
                    disabled={!selectedExercise}
                    className="bg-purple-600 hover:bg-purple-500"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    追加
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercise List */}
        {exercises.map((exercise, exerciseIdx) => (
          <Card
            key={exerciseIdx}
            className="border-slate-800 bg-slate-900/50 backdrop-blur-md"
          >
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {exercise.exercise_name}
                  </h3>
                  {exercise.max_weight_kg != null && (
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-slate-400">
                        過去最高重量: {exercise.max_weight_kg}kg
                      </p>
                      <Button
                        onClick={() =>
                          handleGenerateRecommendationForExercise(exerciseIdx)
                        }
                        disabled={generatingRecommendationFor === exerciseIdx}
                        variant="secondary"
                        size="sm"
                        className="bg-slate-700 hover:bg-slate-600 text-xs h-6 px-2"
                      >
                        {generatingRecommendationFor === exerciseIdx
                          ? "生成中..."
                          : "推奨セット生成"}
                      </Button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeExercise(exerciseIdx)}
                  className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  削除
                </button>
              </div>

              <div className="space-y-2">
                {exercise.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className="flex gap-2 items-center bg-slate-800/50 p-2 rounded-lg"
                  >
                    <span className="text-sm text-slate-400 w-16">
                      セット{setIdx + 1}
                    </span>
                    <select
                      value={set.reps_actual}
                      onChange={(e) =>
                        updateSet(
                          exerciseIdx,
                          setIdx,
                          "reps_actual",
                          Number.parseInt(e.target.value),
                        )
                      }
                      className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200"
                    >
                      {Array.from({ length: 40 }, (_, i) => i + 1).map(
                        (reps) => (
                          <option key={reps} value={reps}>
                            {reps}回
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      value={set.weight_kg}
                      onChange={(e) =>
                        updateSet(
                          exerciseIdx,
                          setIdx,
                          "weight_kg",
                          Number.parseFloat(e.target.value),
                        )
                      }
                      className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200"
                    >
                      {Array.from({ length: 80 }, (_, i) => (i + 1) * 2.5).map(
                        (weight) => (
                          <option key={weight} value={weight}>
                            {weight}kg
                          </option>
                        ),
                      )}
                    </select>
                    <button
                      onClick={() => removeSet(exerciseIdx, setIdx)}
                      className="ml-auto text-red-400 hover:text-red-300 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => addSet(exerciseIdx)}
                variant="secondary"
                className="mt-3 bg-slate-800 hover:bg-slate-700 border border-slate-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                セット追加
              </Button>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  種目メモ
                </label>
                <textarea
                  value={exercise.notes || ""}
                  onChange={(e) =>
                    updateExerciseNotes(exerciseIdx, e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:ring-purple-500 focus:border-purple-500"
                  rows={2}
                  placeholder="この種目のフォームや気づきをメモ..."
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Notes */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <CardContent>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              メモ
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-purple-500 focus:border-purple-500"
              rows={2}
              placeholder="トレーニングの内容や体調などのメモ..."
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={exercises.length === 0}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            登録
          </Button>
          <Link href={`/customer/${customerId}/training`}>
            <Button
              variant="secondary"
              className="bg-slate-800 hover:bg-slate-700"
            >
              キャンセル
            </Button>
          </Link>
        </div>
      </div>

      {/* Exercise Manager Modal */}
      {showExerciseManager && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">種目管理</h2>
              <button
                onClick={() => setShowExerciseManager(false)}
                className="text-slate-400 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Add new exercise form */}
            <div className="mb-6 p-4 bg-purple-950/30 border border-purple-800 rounded-lg">
              <label className="block text-sm font-medium text-purple-300 mb-2">
                新しい種目を追加
              </label>
              <div className="space-y-2">
                <select
                  value={newExerciseCategory}
                  onChange={(e) => setNewExerciseCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
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
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                    placeholder="種目名を入力..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddExercisePreset();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddExercisePreset}
                    className="bg-purple-600 hover:bg-purple-500"
                  >
                    追加
                  </Button>
                </div>
              </div>
            </div>

            {/* Exercise list */}
            <div className="space-y-2">
              {exercisePresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800"
                >
                  <span className="font-medium text-slate-200">
                    {preset.name}
                  </span>
                  <button
                    onClick={() => handleDeleteExercisePreset(preset.id)}
                    className="text-red-400 hover:text-red-300 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowExerciseManager(false)}
                variant="secondary"
                className="bg-slate-800 hover:bg-slate-700"
              >
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
