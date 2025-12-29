"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

interface Exercise {
  exercise_id: string;
  exercise_name: string;
  sets: {
    reps: number;
    weight: number;
  }[];
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/get_customer/${customerId}`
      );
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/get_training_sessions/${customerId}?limit=20`
      );
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

  const handleDelete = async (sessionId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/delete_training_session/${sessionId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        alert("トレーニングセッションを削除しました。");
        setDeleteId(null);
        fetchSessions();
      } else {
        alert("削除に失敗しました。");
      }
    } catch (err) {
      alert("ネットワークエラーが発生しました。");
      console.error("Error deleting session:", err);
    }
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    setAiAdvice("");
    setCachedUntil(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/get_training_advice/${customerId}`
      );
      if (response.ok) {
        const data = await response.json();
        setAiAdvice(data.advice);
        if (data.is_cached && data.cached_until) {
          setCachedUntil(data.cached_until);
        }
      } else {
        const error = await response.json();
        alert(`アドバイス取得に失敗しました: ${error.error}`);
      }
    } catch (err) {
      alert("ネットワークエラーが発生しました。");
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
                <div className="text-gray-700 whitespace-pre-line">
                  {aiAdvice}
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
              {sessions.map((session) => (
                <div key={session.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {new Date(session.date).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {session.duration_minutes > 0 &&
                          `${session.duration_minutes}分`}
                      </p>
                    </div>
                    <Link
                      href={`/customer/${customerId}/training/${session.id}`}
                    >
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 text-sm">
                        詳細
                      </button>
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {session.exercises.map((exercise, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800">
                            {exercise.exercise_name}
                          </span>
                          <span className="text-sm text-gray-600">
                            {exercise.sets.length}セット
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {exercise.sets.map((set, setIdx) => (
                            <span
                              key={setIdx}
                              className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                            >
                              {set.reps}回 × {set.weight}kg
                            </span>
                          ))}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          総重量: {getTotalVolume(exercise).toFixed(0)}kg
                        </div>
                      </div>
                    ))}
                  </div>

                  {session.notes && (
                    <div className="mt-4 text-sm text-gray-600">
                      <span className="font-medium">メモ: </span>
                      {session.notes}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setDeleteId(session.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 削除確認モーダル */}
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
    </div>
  );
}
