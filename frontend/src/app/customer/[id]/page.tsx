"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Customer {
  id: string;
  name: string;
  age: number;
  height: number;
  weight: number;
  favorite_food: string;
  completion_date: string;
}

export default function CustomerDetail() {
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/get_customer/${id}`
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

    if (id) {
      fetchCustomer();
    }
  }, [id]);

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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">顧客詳細</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              氏名
            </label>
            <p className="mt-1 text-lg">{customer.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              年齢
            </label>
            <p className="mt-1 text-lg">{customer.age} 歳</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              身長
            </label>
            <p className="mt-1 text-lg">{customer.height} cm</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              体重
            </label>
            <p className="mt-1 text-lg">{customer.weight} kg</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              好きな食べ物
            </label>
            <p className="mt-1 text-lg">{customer.favorite_food}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              完了予定
            </label>
            <p className="mt-1 text-lg">{customer.completion_date}</p>
          </div>
        </div>
        <div className="mt-8">
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
