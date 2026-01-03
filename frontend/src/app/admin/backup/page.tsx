"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_ENDPOINTS } from "@/constants/api";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState("");

  const handleBackup = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(API_ENDPOINTS.BACKUP_ALL);
      if (response.ok) {
        const data = await response.json();

        // JSONファイルとしてダウンロード
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `michela_backup_${timestamp}.json`;

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        setMessage(
          `✅ バックアップ完了: ${filename}\n📊 顧客数: ${data.collections.customers.length}\n📊 トレーニング: ${data.collections.training_sessions.length}\n📊 食事記録: ${data.collections.meal_records.length}`
        );
      } else {
        const error = await response.json();
        setMessage(`❌ エラー: ${error.error}`);
      }
    } catch (err) {
      setMessage("❌ ネットワークエラーが発生しました。");
      console.error("Error backing up:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      `⚠️ 警告: 現在のデータが上書きされます。\n復元を実行しますか？\n\nファイル: ${file.name}`
    );
    if (!confirmed) return;

    setRestoring(true);
    setMessage("");

    try {
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);

      const response = await fetch(API_ENDPOINTS.RESTORE_BACKUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(
          `✅ 復元完了!\n📊 顧客: ${result.restored_counts.customers}\n📊 体重履歴: ${result.restored_counts.weight_history}\n📊 トレーニング: ${result.restored_counts.training_sessions}\n📊 食事記録: ${result.restored_counts.meal_records}\n📊 栄養目標: ${result.restored_counts.nutrition_goals}`
        );
      } else {
        const error = await response.json();
        setMessage(`❌ 復元エラー: ${error.error}`);
      }
    } catch (err) {
      setMessage(
        "❌ ファイル読み込みエラー。正しいバックアップファイルを選択してください。"
      );
      console.error("Error restoring:", err);
    } finally {
      setRestoring(false);
      // ファイル入力をリセット
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-4">
          <Image src="/vercel.svg" alt="logo" width={150} height={150} />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              🛠️ Developer専用 - バックアップ管理
            </h1>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️
              この機能は開発者専用です。データの完全性を保証するため、バックアップファイルは安全な場所に保存してください。
            </p>
          </div>

          {/* バックアップセクション */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-xl font-bold text-blue-800 mb-4">
              📥 バックアップ作成
            </h2>
            <p className="text-gray-700 mb-4">
              全データをJSON形式でダウンロードします。
            </p>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "バックアップ中..." : "💾 バックアップをダウンロード"}
            </button>
          </div>

          {/* 復元セクション */}
          <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
            <h2 className="text-xl font-bold text-green-800 mb-4">
              📤 バックアップ復元
            </h2>
            <p className="text-gray-700 mb-4">
              バックアップファイルを選択してデータを復元します。
            </p>
            <div className="flex items-center gap-4">
              <label
                htmlFor="restore-file"
                className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300 cursor-pointer"
              >
                {restoring ? "復元中..." : "🔄 ファイルを選択して復元"}
              </label>
              <input
                id="restore-file"
                type="file"
                accept="application/json"
                onChange={handleRestore}
                disabled={restoring}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ※
              現在のデータが上書きされます。必ずバックアップを取ってから実行してください。
            </p>
          </div>

          {/* メッセージ表示 */}
          {message && (
            <div
              className={`p-4 rounded-lg mb-6 whitespace-pre-line ${
                message.includes("✅")
                  ? "bg-green-100 border border-green-300 text-green-800"
                  : "bg-red-100 border border-red-300 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {/* 使用方法 */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📖 使用方法
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                <strong>定期的なバックアップ:</strong>{" "}
                週次でバックアップボタンをクリックしてファイルをダウンロード
              </li>
              <li>
                <strong>ファイル保存:</strong>{" "}
                ダウンロードしたJSONファイルは外部ストレージ（OneDrive、Google
                Driveなど）に保存
              </li>
              <li>
                <strong>データベース復元:</strong>{" "}
                DBが破損した場合、復元ボタンからバックアップファイルを選択
              </li>
              <li>
                <strong>復元確認:</strong> 復元後、ダッシュボードでデータを確認
              </li>
            </ol>
          </div>

          {/* 戻るボタン */}
          <div className="mt-6">
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition duration-300">
                ← ダッシュボードに戻る
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
