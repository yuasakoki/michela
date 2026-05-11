"use client";
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { useTrainingList, groupExercisesByName } from "@/hooks/useTrainingList";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dumbbell, ArrowLeft, Plus, Bot, X } from "lucide-react";

export default function CustomerTraining() {
  useAuth();

  const params = useParams();
  const customerId = params.id as string;

  const {
    customer,
    sessions,
    loading,
    deleteId,
    deleteSessionIds,
    selectedDeleteSessionId,
    aiAdvice,
    loadingAdvice,
    cachedUntil,
    groupedSessionsByDate,
    setDeleteId,
    setSelectedDeleteSessionId,
    setAiAdvice,
    setCachedUntil,
    handleDelete,
    handleDeleteClick,
    handleCancelMultiDelete,
    handleConfirmMultiDelete,
    handleGetAdvice,
  } = useTrainingList(customerId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-purple-500 font-mono text-sm animate-pulse">
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 px-1 py-1 md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href={`/customer/${customerId}`} className="shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="h-8 w-8 md:h-10 md:w-10 shrink-0 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                <Dumbbell className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base md:text-2xl font-bold tracking-tight text-white">
                  {customer?.name} - トレーニング記録
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 md:gap-1">
          <Link href={`/customer/${customerId}/training/new`}>
            <Button className="bg-green-600 hover:bg-green-500 text-sm md:text-base">
              <Plus className="h-4 w-4 mr-1 md:mr-2" />
              新規記録
            </Button>
          </Link>
          {/* <Button
            onClick={handleGetAdvice}
            disabled={loadingAdvice}
            variant="secondary"
            className="bg-purple-600 hover:bg-purple-500 text-sm md:text-base"
          >
            <Bot className="h-4 w-4 mr-1 md:mr-2" />
            {loadingAdvice ? "生成中..." : "AIアドバイス"}
          </Button> */}
        </div>
      </div>

      <div className="space-y-4">
        {/* AIアドバイス表示エリア */}
        {aiAdvice && (
          <Card className="border-purple-800 bg-purple-950/30 backdrop-blur-md">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="text-2xl md:text-3xl">💡</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm md:text-lg font-bold text-purple-300">
                      AIトレーナーからのアドバイス
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAiAdvice("");
                        setCachedUntil(null);
                      }}
                      className="text-slate-400 hover:text-white shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {cachedUntil && (
                    <div className="text-xs text-slate-500 mb-2">
                      ※ キャッシュ有効期限:{" "}
                      {new Date(cachedUntil).toLocaleString("ja-JP")}
                    </div>
                  )}
                  <div className="text-slate-200 prose prose-sm max-w-none prose-invert">
                    <ReactMarkdown>{aiAdvice}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md md:mx-0">
          {sessions.length === 0 ? (
            <CardContent className="text-center py-12 text-slate-500">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              トレーニング記録がありません。
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700 ">
                {groupedSessionsByDate.map(([date, dateSessions]) => (
                  <DateSection
                    key={date}
                    date={date}
                    dateSessions={dateSessions}
                    onDeleteClick={handleDeleteClick}
                  />
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* 削除確認モーダル（単一セッション） */}
        {deleteId && (
          <DeleteConfirmModal
            onCancel={() => setDeleteId(null)}
            onConfirm={() => handleDelete(deleteId)}
          />
        )}

        {/* 複数セッション選択モーダル */}
        {deleteSessionIds.length > 0 && (
          <MultiDeleteModal
            sessions={sessions}
            deleteSessionIds={deleteSessionIds}
            selectedDeleteSessionId={selectedDeleteSessionId}
            onSelectSession={setSelectedDeleteSessionId}
            onCancel={handleCancelMultiDelete}
            onConfirm={handleConfirmMultiDelete}
          />
        )}
      </div>
    </div>
  );
}

// Sub-components

interface DateSectionProps {
  date: string;
  dateSessions: import("@/hooks/useTrainingList").TrainingSession[];
  onDeleteClick: (sessionIds: string[]) => void;
}

function DateSection({ date, dateSessions, onDeleteClick }: DateSectionProps) {
  const groupedExercises = groupExercisesByName(dateSessions);

  return (
    <div className="md:p-6 hover:bg-slate-800/30 transition-colors">
      {/* 日付ヘッダー */}
      <div className="flex justify-between items-center">
        <h3 className="text-base md:text-xl font-bold text-slate-200">
          {new Date(date).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h3>
        <span className="text-xs md:text-sm text-slate-500 shrink-0 ml-2">
          {dateSessions.length}セッション
        </span>
      </div>

      <div className="space-y-3 md:space-y-4">
        {groupedExercises.map((groupedExercise, idx) => {
          const totalVolume = groupedExercise.sets.reduce(
            (total, set) => total + set.reps * set.weight,
            0,
          );

          return (
            <div
              key={`${date}-${groupedExercise.exercise_name}-${idx}`}
              className="bg-slate-800/20 p-1 md:p-4 rounded-lg"
            >
              <div className="flex justify-between items-center gap-2">
                <span className="font-medium text-slate-200 text-base md:text-lg">
                  {groupedExercise.exercise_name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-slate-400">
                    {groupedExercise.sets.length}セット
                  </span>
                  <button
                    onClick={() => onDeleteClick(groupedExercise.sessionIds)}
                    className="text-red-500 hover:text-red-400 text-xl leading-none p-1"
                    title="このセッションを削除"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 md:gap-2">
                {groupedExercise.sets.map((set, setIdx) => (
                  <span
                    key={setIdx}
                    className="text-sm bg-slate-900/50 px-1 py-1 rounded border border-slate-700"
                  >
                    {set.reps}回 × {set.weight}kg
                  </span>
                ))}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                総重量: {totalVolume.toFixed(0)}kg
              </div>
              {groupedExercise.notes.length > 0 && (
                <div className="mt-1 text-xs text-slate-400 italic space-y-0.5">
                  {groupedExercise.notes.map((note, noteIdx) => (
                    <div key={noteIdx}>💬 {note}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-200 mb-3">削除確認</h2>
        <p className="text-sm text-slate-400 mb-5">
          このトレーニングセッションを削除してもよろしいですか？
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-slate-700 text-slate-200 rounded hover:bg-slate-600 text-sm"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

interface MultiDeleteModalProps {
  sessions: import("@/hooks/useTrainingList").TrainingSession[];
  deleteSessionIds: string[];
  selectedDeleteSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function MultiDeleteModal({
  sessions,
  deleteSessionIds,
  selectedDeleteSessionId,
  onSelectSession,
  onCancel,
  onConfirm,
}: MultiDeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-lg">
        <h2 className="text-lg font-bold text-slate-200 mb-2">
          どのセッションを削除しますか？
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          この種目は複数のセッションに分かれています。削除するセッションを選択してください。
        </p>
        <div className="space-y-2 mb-5 max-h-72 overflow-y-auto">
          {deleteSessionIds.map((sessionId) => {
            const session = sessions.find((s) => s.id === sessionId);
            if (!session) return null;

            const exerciseInSession = session.exercises[0];
            const totalVolume = exerciseInSession.sets.reduce(
              (sum, set) => sum + set.reps * set.weight,
              0,
            );

            return (
              <label
                key={sessionId}
                className={`block p-3 border-2 rounded-lg cursor-pointer transition ${
                  selectedDeleteSessionId === sessionId
                    ? "border-red-500 bg-red-950/30"
                    : "border-slate-700 hover:border-red-800"
                }`}
              >
                <input
                  type="radio"
                  name="deleteSession"
                  value={sessionId}
                  checked={selectedDeleteSessionId === sessionId}
                  onChange={() => onSelectSession(sessionId)}
                  className="mr-2"
                />
                <div className="inline-block align-top">
                  <div className="text-sm font-medium text-slate-200">
                    {exerciseInSession.sets.length}セット
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    総重量: {totalVolume.toFixed(0)}kg
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1">
                    {exerciseInSession.sets.map((set, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-800 px-1.5 py-0.5 rounded"
                      >
                        {set.reps}回×{set.weight}kg
                      </span>
                    ))}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-slate-700 text-slate-200 rounded hover:bg-slate-600 text-sm"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedDeleteSessionId}
            className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-sm"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
