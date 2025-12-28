"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

interface Customer {
  id: string;
  name: string;
  age: number;
  height: number;
  weight: number;
  favorite_food: string;
  completion_date: string;
}

interface WeightHistory {
  id: string;
  customer_id: string;
  weight: number;
  recorded_at: string;
}

export default function CustomerDetail() {
  useAuth(); // 認証チェック

  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [selectedWeight, setSelectedWeight] = useState<number>(0);

  // BMI計算関数
  const calculateBMI = (height: number, weight: number): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  // 年齢に基づく標準BMI値を取得
  const getStandardBMI = (age: number): number => {
    // 厚生労働省の日本人の標準体重に基づくBMI標準値
    // 18-49歳: 22.0、50-69歳: 22.5、70歳以上: 23.0
    if (age < 50) return 22.0;
    if (age < 70) return 22.5;
    return 23.0;
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/get_customer/${id}`
        );
        if (response.ok) {
          const data = await response.json();
          setCustomer(data);
        } else {
          setError("顧客データの取得に失敗しました。");
        }
      } catch (err) {
        setError("ネットワークエラーが発生しました。");
        console.error("Error fetching customer:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchWeightHistory = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/get_weight_history/${id}?limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          setWeightHistory(data);
        }
      } catch (err) {
        console.error("Error fetching weight history:", err);
      }
    };

    if (id) {
      fetchCustomer();
      fetchWeightHistory();
    }
  }, [id]);

  useEffect(() => {
    if (customer) {
      setEditedCustomer(customer);
      setSelectedWeight(customer.weight);
    }
  }, [customer]);

  const handleSave = async () => {
    if (!editedCustomer) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/update_customer/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editedCustomer.name,
            age: editedCustomer.age,
            height: editedCustomer.height,
            weight: editedCustomer.weight,
            favorite_food: editedCustomer.favorite_food,
            completion_date: editedCustomer.completion_date,
          }),
        }
      );
      if (response.ok) {
        setCustomer(editedCustomer);
        setIsEditing(false);

        // 体重履歴を再取得
        const historyResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/get_weight_history/${id}?limit=5`
        );
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setWeightHistory(historyData);
        }
      } else {
        alert("更新に失敗しました。");
      }
    } catch (err) {
      alert("ネットワークエラー");
    }
  };

  const handleWeightChange = async () => {
    if (!customer || selectedWeight === customer.weight) {
      alert("体重が変更されていません。");
      return;
    }

    try {
      // 体重履歴を追加
      const historyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/add_weight_record/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weight: selectedWeight,
          }),
        }
      );

      if (historyResponse.ok) {
        // 顧客情報を再取得
        const customerResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/get_customer/${id}`
        );
        if (customerResponse.ok) {
          const data = await customerResponse.json();
          setCustomer(data);
          setSelectedWeight(data.weight);
        }

        // 体重履歴を再取得
        const weightHistoryResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/get_weight_history/${id}?limit=5`
        );
        if (weightHistoryResponse.ok) {
          const historyData = await weightHistoryResponse.json();
          setWeightHistory(historyData);
        }

        alert("体重が更新されました。");
      } else {
        alert("体重の更新に失敗しました。");
      }
    } catch (err) {
      alert("ネットワークエラーが発生しました。");
      console.error("Error updating weight:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">読み込み中...</h1>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-800">
            {error || "顧客が見つかりません。"}
          </h1>
          <div className="mt-4">
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition duration-300">
                戻る
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className="flex justify-center mb-4">
          <Image src="/vercel.svg" alt="logo" width={150} height={150} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">顧客詳細</h1>
        <div className="mb-6">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300 mr-4"
            >
              編集
            </button>
          )}
          {isEditing && (
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedCustomer(customer);
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700"
            >
              キャンセル
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              氏名
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedCustomer?.name || ""}
                onChange={(e) =>
                  setEditedCustomer((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            ) : (
              <p className="mt-1 text-lg">{customer.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              年齢
            </label>
            {isEditing ? (
              <input
                type="number"
                value={editedCustomer?.age || 0}
                onChange={(e) =>
                  setEditedCustomer((prev) =>
                    prev ? { ...prev, age: parseInt(e.target.value) } : null
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            ) : (
              <p className="mt-1 text-lg">{customer.age} 歳</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              身長
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={editedCustomer?.height || 0}
                onChange={(e) =>
                  setEditedCustomer((prev) =>
                    prev
                      ? { ...prev, height: parseFloat(e.target.value) }
                      : null
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            ) : (
              <p className="mt-1 text-lg">{customer.height} cm</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              体重
            </label>
            {isEditing ? (
              <select
                value={editedCustomer?.weight || 0}
                onChange={(e) =>
                  setEditedCustomer((prev) =>
                    prev
                      ? { ...prev, weight: parseFloat(e.target.value) }
                      : null
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                {Array.from({ length: 261 }, (_, i) => 20 + i * 0.5).map(
                  (weight) => (
                    <option key={weight} value={weight}>
                      {weight.toFixed(1)} kg
                    </option>
                  )
                )}
              </select>
            ) : (
              <div className="flex items-center gap-2 mt-1 max-w-md">
                <select
                  value={selectedWeight}
                  onChange={(e) =>
                    setSelectedWeight(parseFloat(e.target.value))
                  }
                  className="block w-auto border border-gray-300 rounded-md shadow-sm p-2 bg-white cursor-pointer"
                >
                  {Array.from({ length: 261 }, (_, i) => 20 + i * 0.5).map(
                    (weight) => (
                      <option key={weight} value={weight}>
                        {weight.toFixed(1)} kg
                      </option>
                    )
                  )}
                </select>
                <button
                  onClick={handleWeightChange}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition duration-300 whitespace-nowrap"
                >
                  変更
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              好きな食べ物
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedCustomer?.favorite_food || ""}
                onChange={(e) =>
                  setEditedCustomer((prev) =>
                    prev ? { ...prev, favorite_food: e.target.value } : null
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            ) : (
              <p className="mt-1 text-lg">{customer.favorite_food}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              完了予定
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedCustomer?.completion_date || ""}
                onChange={(e) =>
                  setEditedCustomer((prev) =>
                    prev ? { ...prev, completion_date: e.target.value } : null
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            ) : (
              <p className="mt-1 text-lg">{customer.completion_date}</p>
            )}
          </div>

          {/* BMI値表示 */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700">
              BMI値
            </label>
            <div className="mt-1">
              <p className="text-lg">
                <span className="font-semibold">現在:</span>{" "}
                {calculateBMI(customer.height, customer.weight).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                標準BMI値（{customer.age}歳）:{" "}
                {getStandardBMI(customer.age).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                ※ 標準BMI値は厚生労働省の日本人の標準体重に基づいています
                <br />
                （18-49歳: 22.0、50-69歳: 22.5、70歳以上: 23.0）
              </p>
            </div>
          </div>
        </div>

        {/* 体重履歴セクション */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            直近の体重履歴
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">
                    記録日時
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">
                    体重
                  </th>
                </tr>
              </thead>
              <tbody>
                {weightHistory.length > 0 ? (
                  weightHistory.map((history) => (
                    <tr key={history.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900 border">
                        {new Date(history.recorded_at).toLocaleString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border">
                        {history.weight.toFixed(1)} kg
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-gray-500 border"
                    >
                      体重履歴がありません。体重を変更すると履歴が記録されます。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          {isEditing && (
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300 mr-4"
            >
              保存
            </button>
          )}
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition duration-300">
              戻る
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
