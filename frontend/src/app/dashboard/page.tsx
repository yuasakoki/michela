"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { logoutApi } from "@/services/authService";
import { useRouter } from "next/navigation";
import { toast } from "@/utils/toast";
import { API_ENDPOINTS } from "@/constants/api";

interface Customer {
  id: string;
  name: string;
  age: number;
  height: number;
  weight: number;
  favorite_food: string;
  completion_date: string;
}

interface WeightRecord {
  id: string;
  weight: number;
  recorded_at: string;
  note?: string;
}

interface CustomerWithWeightData extends Customer {
  firstWeight: number | null;
  currentWeight: number | null;
  weightDiff: number | null;
  daysRemaining: number | null;
  lastUpdated: string | null;
}

interface ResearchArticle {
  title: string;
  summary: string;
  source: string;
  date: string;
  url: string;
}

export default function Dashboard() {
  useAuth(); // 認証チェック
  const { isDeveloper } = useRole(); // 権限チェック
  const router = useRouter();

  useEffect(() => {
    document.title = "ダッシュボード | MII Fit";
  }, []);

  const handleLogout = () => {
    if (confirm("ログアウトしますか？")) {
      logoutApi();
      router.push("/");
    }
  };

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersWithWeightData, setCustomersWithWeightData] = useState<
    CustomerWithWeightData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>("");
  const [researchArticles, setResearchArticles] = useState<ResearchArticle[]>(
    []
  );
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.CUSTOMERS);
        if (response.ok) {
          const data = await response.json();

          // 各顧客の体重履歴を取得
          const customersWithData = await Promise.all(
            data.map(async (customer: Customer) => {
              try {
                const weightResponse = await fetch(
                  API_ENDPOINTS.WEIGHT_HISTORY(customer.id, 1000)
                );

                if (weightResponse.ok) {
                  const weightHistory: WeightRecord[] =
                    await weightResponse.json();

                  // 体重履歴を日付順にソート（古い順）
                  const sortedHistory = [...weightHistory].sort(
                    (a, b) =>
                      new Date(a.recorded_at).getTime() -
                      new Date(b.recorded_at).getTime()
                  );

                  const firstWeight =
                    sortedHistory.length > 0
                      ? sortedHistory[0].weight
                      : customer.weight;
                  const currentWeight =
                    sortedHistory.length > 0
                      ? sortedHistory[sortedHistory.length - 1].weight
                      : customer.weight;
                  const weightDiff = currentWeight - firstWeight;
                  const lastUpdated =
                    sortedHistory.length > 0
                      ? sortedHistory[sortedHistory.length - 1].recorded_at
                      : null;

                  // 完了予定日から残り日数を計算
                  const completionDate = new Date(customer.completion_date);
                  const today = new Date();
                  const diffTime = completionDate.getTime() - today.getTime();
                  const daysRemaining = Math.ceil(
                    diffTime / (1000 * 60 * 60 * 24)
                  );

                  return {
                    ...customer,
                    firstWeight,
                    currentWeight,
                    weightDiff,
                    daysRemaining,
                    lastUpdated,
                  };
                } else {
                  // 体重履歴が取得できない場合は登録時の体重を使用
                  const completionDate = new Date(customer.completion_date);
                  const today = new Date();
                  const diffTime = completionDate.getTime() - today.getTime();
                  const daysRemaining = Math.ceil(
                    diffTime / (1000 * 60 * 60 * 24)
                  );

                  return {
                    ...customer,
                    firstWeight: customer.weight,
                    currentWeight: customer.weight,
                    weightDiff: 0,
                    daysRemaining,
                    lastUpdated: null,
                  };
                }
              } catch (error) {
                // エラー時も登録時の体重を使用
                const completionDate = new Date(customer.completion_date);
                const today = new Date();
                const diffTime = completionDate.getTime() - today.getTime();
                const daysRemaining = Math.ceil(
                  diffTime / (1000 * 60 * 60 * 24)
                );

                return {
                  ...customer,
                  firstWeight: customer.weight,
                  currentWeight: customer.weight,
                  weightDiff: 0,
                  daysRemaining,
                  lastUpdated: null,
                };
              }
            })
          );

          setCustomersWithWeightData(customersWithData);
          setCustomers(data);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        setError("顧客データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // 顧客リストをソート
  const sortedCustomers = React.useMemo(() => {
    const sorted = [...customersWithWeightData];
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
    } else if (sortOption === "weight-diff-asc") {
      sorted.sort((a, b) => (a.weightDiff || 0) - (b.weightDiff || 0));
    } else if (sortOption === "weight-diff-desc") {
      sorted.sort((a, b) => (b.weightDiff || 0) - (a.weightDiff || 0));
    }
    return sorted;
  }, [customersWithWeightData, sortOption]);

  // 研究記事を日付順にソート（新しい順）
  const sortedResearchArticles = React.useMemo(() => {
    return [...researchArticles].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [researchArticles]);

  const handleSearchMore = () => {
    window.open(
      "https://www.google.com/search?q=筋トレ+ダイエット+最新研究",
      "_blank"
    );
  };

  const fetchResearchArticles = async () => {
    setLoadingResearch(true);
    try {
      const response = await fetch(API_ENDPOINTS.LATEST_RESEARCH);
      if (response.ok) {
        const data = await response.json();
        setResearchArticles(data.articles || []);
      } else {
        toast.error("最新研究の取得に失敗しました");
      }
    } catch (err) {
      toast.error("ネットワークエラーが発生しました");
      console.error("Error fetching research:", err);
    } finally {
      setLoadingResearch(false);
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 max-w-7xl w-full mx-2 md:mx-4">
        <div className="flex justify-center mb-4">
          <Image src="/vercel.svg" alt="logo" width={150} height={150} />
        </div>
        <div className="text-right mb-4 md:mb-6">
          {isDeveloper && (
            <Link href="/admin/backup">
              <button className="px-4 py-2 md:px-6 md:py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition duration-300 text-sm md:text-base mr-2">
                🛠️ バックアップ
              </button>
            </Link>
          )}
          <Link href="/research-search">
            <button className="px-4 py-2 md:px-6 md:py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition duration-300 text-sm md:text-base mr-2">
              研究を検索
            </button>
          </Link>
          <Link href="/ai-chat">
            <button className="px-4 py-2 md:px-6 md:py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300 text-sm md:text-base mr-2">
              AI相談
            </button>
          </Link>
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
              <option value="weight-diff-asc">体重差分昇順</option>
              <option value="weight-diff-desc">体重差分降順</option>
            </select>
          </div>

          {/* スマホ用レイアウト: 氏名列固定 + 横スクロール（テーブル構造） */}
          <div className="block md:hidden overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-200 z-10 border-r border-gray-300">
                    氏名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    初回体重 (kg)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    現在体重 (kg)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    体重差分 (kg)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    完了予定
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    残り日数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    最終更新
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200">
                      <Link
                        href={`/customer/${customer.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.firstWeight?.toFixed(1) || "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.currentWeight?.toFixed(1) || "-"}
                    </td>
                    <td
                      className={`px-4 py-4 whitespace-nowrap text-sm font-semibold ${
                        customer.weightDiff && customer.weightDiff > 0
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {customer.weightDiff !== null
                        ? `${
                            customer.weightDiff > 0 ? "+" : ""
                          }${customer.weightDiff.toFixed(1)}`
                        : "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.completion_date
                        ? new Date(customer.completion_date).toLocaleDateString(
                            "ja-JP",
                            {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td
                      className={`px-4 py-4 whitespace-nowrap text-sm font-semibold ${
                        customer.daysRemaining !== null &&
                        customer.daysRemaining < 0 &&
                        (!customer.weightDiff || customer.weightDiff > 0)
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {customer.daysRemaining !== null
                        ? `${customer.daysRemaining > 0 ? "" : ""}${
                            customer.daysRemaining
                          }日`
                        : "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {customer.lastUpdated
                        ? new Date(customer.lastUpdated).toLocaleDateString(
                            "ja-JP",
                            {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                            }
                          )
                        : "未記録"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    初回体重 (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    現在体重 (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    体重差分 (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    完了予定
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    残り日数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終更新
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
                      {customer.firstWeight?.toFixed(1) || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.currentWeight?.toFixed(1) || "-"}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        customer.weightDiff && customer.weightDiff > 0
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {customer.weightDiff !== null
                        ? `${
                            customer.weightDiff > 0 ? "+" : ""
                          }${customer.weightDiff.toFixed(1)}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.completion_date
                        ? new Date(customer.completion_date).toLocaleDateString(
                            "ja-JP",
                            {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        customer.daysRemaining !== null &&
                        customer.daysRemaining < 0 &&
                        (!customer.weightDiff || customer.weightDiff > 0)
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {customer.daysRemaining !== null
                        ? `${customer.daysRemaining > 0 ? "" : ""}${
                            customer.daysRemaining
                          }日`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {customer.lastUpdated
                        ? new Date(customer.lastUpdated).toLocaleDateString(
                            "ja-JP",
                            {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                            }
                          )
                        : "未記録"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customersWithWeightData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              登録された顧客データがありません。
            </div>
          )}
        </div>

        {/* ログアウトボタン */}
        <div className="text-center mt-8 pb-4">
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 transition duration-300"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
