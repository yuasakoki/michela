"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/constants/api";
import { toast, TOAST_DURATION } from "@/utils/toast";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TARGET_NAMES,
} from "@/constants/messages";

interface Exercise {
  exercise_id: string;
  exercise_name: string;
  sets: {
    reps: number;
    weight: number;
  }[];
  notes?: string;
}

interface TrainingSession {
  id: string;
  customer_id: string;
  date: string;
  exercises: Exercise[];
  notes: string;
  duration_minutes: number;
}

interface Customer {
  id: string;
  name: string;
}

export default function CustomerTraining() {
  useAuth();

  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSessionIds, setDeleteSessionIds] = useState<string[]>([]); // 複数セッション削除用
  const [selectedDeleteSessionId, setSelectedDeleteSessionId] = useState<
    string | null
  >(null); // 選択されたセッションID
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [cachedUntil, setCachedUntil] = useState<string | null>(null);

  useEffect(() => {
    document.title = "トレーニング記録 | MII Fit";
    fetchCustomer();
    fetchSessions();
  }, [customerId]);

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

  const fetchSessions = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TRAINING_SESSIONS(customerId, 20));
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Error fetching training sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalVolume = (exercise: Exercise) => {
    return exercise.sets.reduce(
      (total, set) => total + set.reps * set.weight,
      0
    );
  };

  // 同じ日付のセッションをグループ化
  const groupSessionsByDate = () => {
    const grouped: { [date: string]: TrainingSession[] } = {};

    sessions.forEach((session) => {
      if (!grouped[session.date]) {
        grouped[session.date] = [];
      }
      grouped[session.date].push(session);
    });

    // 日付でソート（新しい順）
    return Object.entries(grouped).sort(
      ([dateA], [dateB]) =>
        new Date(dateB).getTime() - new Date(dateA).getTime()
    );
  };

  // 同じ日付・同じ種目を結合（セットを統合）
  const groupExercisesByName = (dateSessions: TrainingSession[]) => {
    interface GroupedExercise {
      exercise_id: string;
      exercise_name: string;
      sets: { reps: number; weight: number }[];
      notes: string[];
      sessionIds: string[]; // 削除用に元のセッションIDを保持
    }

    const grouped: { [exerciseName: string]: GroupedExercise } = {};

    dateSessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        if (!grouped[exercise.exercise_name]) {
          grouped[exercise.exercise_name] = {
            exercise_id: exercise.exercise_id,
            exercise_name: exercise.exercise_name,
            sets: [],
            notes: [],
            sessionIds: [],
          };
        }
        // セットを結合
        grouped[exercise.exercise_name].sets.push(...exercise.sets);
        // メモを結合（空でないもののみ）
        if (exercise.notes && exercise.notes.trim()) {
          grouped[exercise.exercise_name].notes.push(exercise.notes);
        }
        // セッションIDを記録（重複を防ぐ）
        if (!grouped[exercise.exercise_name].sessionIds.includes(session.id)) {
          grouped[exercise.exercise_name].sessionIds.push(session.id);
        }
      });
    });

    return Object.values(grouped);
  };

  const handleDelete = async (sessionId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_TRAINING_SESSION(sessionId), {
          method: "DELETE",
        }
      );
      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.DELETED());
        setDeleteId(null);
        setDeleteSessionIds([]);
        setSelectedDeleteSessionId(null);
        fetchSessions();
      } else {
        toast.error(ERROR_MESSAGES.DELETION_FAILED());
      }
    } catch (err) {
      toast.error("ネットワークエラーが発生しました");
      console.error("Error deleting session:", err);
    }
  };

  const handleDeleteClick = (sessionIds: string[]) => {
    if (sessionIds.length === 1) {
      // 単一セッションの場合は直接削除確認
      setDeleteId(sessionIds[0]);
    } else {
      // 複数セッションの場合は選択モーダルを表示
      setDeleteSessionIds(sessionIds);
      setSelectedDeleteSessionId(sessionIds[0]); // デフォルトで最初のセッションを選択
    }
  };

  const handleCancelMultiDelete = () => {
    setDeleteSessionIds([]);
    setSelectedDeleteSessionId(null);
  };

  const handleConfirmMultiDelete = () => {
    if (selectedDeleteSessionId) {
      handleDelete(selectedDeleteSessionId);
    }
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    setAiAdvice("");
    setCachedUntil(null);
    try {
      const response = await fetch(API_ENDPOINTS.TRAINING_ADVICE(customerId));
      if (response.ok) {
        const data = await response.json();
        setAiAdvice(data.advice);
        if (data.is_cached && data.cached_until) {
          setCachedUntil(data.cached_until);
        }
      } else {
        const error = await response.json();
        toast.error(
          `アドバイス取得に失敗: ${error.error}`,
          TOAST_DURATION.LONG
        );
      }
    } catch (err) {
      toast.error("ネットワークエラーが発生しました");
      console.error("Error fetching advice:", err);
    } finally {
      setLoadingAdvice(false);
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center mb-4">
          <Image src="/vercel.svg" alt="logo" width={150} height={150} />
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {customer?.name} - トレーニング記録
          </h1>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href={`/customer/${customerId}/training/new`}>
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300">
              新規記録
            </button>
          </Link>
          <button
            onClick={handleGetAdvice}
            disabled={loadingAdvice}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition duration-300 disabled:bg-gray-400"
          >
            {loadingAdvice ? "生成中..." : "AIアドバイス"}
          </button>
          <Link href={`/customer/${customerId}`}>
            <button className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition duration-300">
              戻る
            </button>
          </Link>
        </div>

        {/* AIアドバイス表示エリア */}
        {aiAdvice && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <div className="text-3xl">💡</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-purple-800">
                    AIトレーナーからのアドバイス
                  </h3>
                  <button
                    onClick={() => {
                      setAiAdvice("");
                      setCachedUntil(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold px-2"
                    title="閉じる"
                  >
                    ✕
                  </button>
                </div>
                {cachedUntil && (
                  <div className="text-xs text-gray-500 mb-2">
                    ※ このアドバイスはキャッシュされています。次回の更新:{" "}
                    {new Date(cachedUntil).toLocaleString("ja-JP")}
                  </div>
                )}
                <div className="text-gray-700 prose prose-sm max-w-none">
                  <ReactMarkdown>{aiAdvice}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              トレーニング記録がありません。
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {groupSessionsByDate().map(([date, dateSessions]) => (
                <div key={date} className="p-6 hover:bg-gray-50">
                  {/* 日付ヘッダー */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      {new Date(date).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {dateSessions.length}セッション
                    </span>
                  </div>

                  {/* 同じ種目を結合して表示 */}
                  <div className="space-y-3">
                    {groupExercisesByName(dateSessions).map(
                      (groupedExercise, idx) => {
                        const totalVolume = groupedExercise.sets.reduce(
                          (total, set) => total + set.reps * set.weight,
                          0
                        );

                        return (
                          <div
                            key={`${date}-${groupedExercise.exercise_name}-${idx}`}
                            className="bg-gray-50 p-3 rounded-lg relative"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-800">
                                {groupedExercise.exercise_name}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                  {groupedExercise.sets.length}セット
                                </span>
                                <button
                                  onClick={() =>
                                    handleDeleteClick(
                                      groupedExercise.sessionIds
                                    )
                                  }
                                  className="text-red-600 hover:text-red-800 text-lg font-bold"
                                  title="このセッションを削除"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {groupedExercise.sets.map((set, setIdx) => (
                                <span
                                  key={setIdx}
                                  className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                                >
                                  {set.reps}回 × {set.weight}kg
                                </span>
                              ))}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              総重量: {totalVolume.toFixed(0)}kg
                            </div>
                            {groupedExercise.notes.length > 0 && (
                              <div className="mt-2 text-xs text-gray-600 italic space-y-1">
                                {groupedExercise.notes.map((note, noteIdx) => (
                                  <div key={noteIdx}>💬 {note}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 削除確認モーダル（単一セッション） */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">削除確認</h2>
            <p className="text-gray-600 mb-6">
              このトレーニングセッションを削除してもよろしいですか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 複数セッション選択モーダル */}
      {deleteSessionIds.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              どのセッションを削除しますか？
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              この種目は複数のセッションに分かれています。削除するセッションを選択してください。
            </p>
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {deleteSessionIds.map((sessionId) => {
                const session = sessions.find((s) => s.id === sessionId);
                if (!session) return null;

                // このセッション内の該当種目を見つける
                const exerciseInSession = session.exercises[0]; // グループ化された種目の最初
                const totalVolume = exerciseInSession.sets.reduce(
                  (sum, set) => sum + set.reps * set.weight,
                  0
                );

                return (
                  <label
                    key={sessionId}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedDeleteSessionId === sessionId
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 hover:border-red-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deleteSession"
                      value={sessionId}
                      checked={selectedDeleteSessionId === sessionId}
                      onChange={() => setSelectedDeleteSessionId(sessionId)}
                      className="mr-3"
                    />
                    <div className="inline-block">
                      <div className="font-medium text-gray-800">
                        セッション（{exerciseInSession.sets.length}セット）
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        総重量: {totalVolume.toFixed(0)}kg
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1">
                        {exerciseInSession.sets.map((set, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 px-2 py-0.5 rounded"
                          >
                            {set.reps}回×{set.weight}kg
                          </span>
                        ))}
                      </div>
                      {exerciseInSession.notes && (
                        <div className="text-xs text-gray-600 mt-2 italic">
                          💬 {exerciseInSession.notes}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelMultiDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmMultiDelete}
                disabled={!selectedDeleteSessionId}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
