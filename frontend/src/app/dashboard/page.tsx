"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
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

export default function Dashboard() {
  useAuth(); // 認証チェック

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(
          "https://michela.onrender.com/get_customers"
        );
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        } else {
          setError("データの取得に失敗しました。");
        }
      } catch (err) {
        setError("ネットワークエラーが発生しました。");
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const sortedCustomers = React.useMemo(() => {
    const sorted = [...customers];
    if (sortOption === "name-asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "name-desc") {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === "date-asc") {
      sorted.sort(
        (a, b) =>
          new Date(a.completion_date).getTime() -
          new Date(b.completion_date).getTime()
      );
    } else if (sortOption === "date-desc") {
      sorted.sort(
        (a, b) =>
          new Date(b.completion_date).getTime() -
          new Date(a.completion_date).getTime()
      );
    }
    return sorted;
  }, [customers, sortOption]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">読み込み中...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-800">{error}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center mb-4 md:mb-6">
          <Image src="/vercel.svg" alt="logo" width={150} height={150} />
        </div>
        {/* <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          メインメニュー
        </h1> */}
        <div className="text-right mb-4 md:mb-6">
          <Link href="/customer">
            <button className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300 text-sm md:text-base">
              顧客登録
            </button>
          </Link>
        </div>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <label
              htmlFor="sort"
              className="mr-2 text-sm font-medium text-gray-700"
            >
              ソート:
            </label>
            <select
              id="sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="">選択してください</option>
              <option value="name-asc">氏名昇順</option>
              <option value="name-desc">氏名降順</option>
              <option value="date-asc">完了予定日昇順</option>
              <option value="date-desc">完了予定日降順</option>
            </select>
          </div>

          {/* スマホ用レイアウト: 氏名固定 + 横スクロール */}
          <div className="block md:hidden">
            <div className="flex">
              {/* 氏名列（固定） */}
              <div className="flex-shrink-0 w-32 border-r border-gray-200">
                <div className="bg-gray-200 px-4 py-3 sticky top-0">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    氏名
                  </span>
                </div>
                {sortedCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="px-4 py-4 border-b border-gray-200 bg-white"
                  >
                    <Link
                      href={`/customer/${customer.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      {customer.name}
                    </Link>
                  </div>
                ))}
              </div>

              {/* スクロール可能な列 */}
              <div className="overflow-x-auto flex-1">
                <div className="inline-block min-w-full">
                  <table className="min-w-full">
                    <thead className="bg-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          年齢
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          身長 (cm)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          体重 (kg)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          好きな食べ物
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          完了予定
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.age}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.height}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.weight}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.favorite_food}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.completion_date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* PC用レイアウト: 通常のテーブル */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    氏名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    年齢
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    身長 (cm)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    体重 (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    好きな食べ物
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    完了予定
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/customer/${customer.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.age}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.height}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.weight}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.favorite_food}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.completion_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              登録された顧客データがありません。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
