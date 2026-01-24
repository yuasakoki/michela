"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
// import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { logoutApi, authFetch } from "@/services/authService";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/constants/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Database,
  Search,
  Bot,
  UserPlus,
  LogOut,
  ArrowUpDown,
  Dumbbell,
  Users,
} from "lucide-react";

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

export default function Dashboard() {
  // useAuth();
  console.log("Dashboard Start");
  const { isDeveloper } = useRole();
  const router = useRouter();

  useEffect(() => {
    document.title = "Dashboard | MII Fit Pro";
  }, []);

  const handleLogout = async () => {
    if (confirm("Disconnect from session?")) {
      await logoutApi();
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

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await authFetch(API_ENDPOINTS.CUSTOMERS);
        if (response.ok) {
          const data = await response.json();
          const customersWithData = await Promise.all(
            data.map(async (customer: Customer) => {
              try {
                const weightResponse = await authFetch(
                  API_ENDPOINTS.WEIGHT_HISTORY(customer.id, 1000),
                );
                let weightHistory: WeightRecord[] = [];
                if (weightResponse.ok) {
                  weightHistory = await weightResponse.json();
                }

                const sortedHistory = [...weightHistory].sort(
                  (a, b) =>
                    new Date(a.recorded_at).getTime() -
                    new Date(b.recorded_at).getTime(),
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

                const completionDate = new Date(customer.completion_date);
                const today = new Date();
                const diffTime = completionDate.getTime() - today.getTime();
                const daysRemaining = Math.ceil(
                  diffTime / (1000 * 60 * 60 * 24),
                );

                return {
                  ...customer,
                  firstWeight,
                  currentWeight,
                  weightDiff,
                  daysRemaining,
                  lastUpdated,
                };
              } catch (error) {
                return {
                  ...customer,
                  firstWeight: customer.weight,
                  currentWeight: customer.weight,
                  weightDiff: 0,
                  daysRemaining: 0,
                  lastUpdated: null,
                };
              }
            }),
          );
          setCustomersWithWeightData(customersWithData);
          setCustomers(data);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        setError("Failed to retrieve customer database.");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

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
          new Date(b.completion_date).getTime(),
      );
    } else if (sortOption === "date-desc") {
      sorted.sort(
        (a, b) =>
          new Date(b.completion_date).getTime() -
          new Date(a.completion_date).getTime(),
      );
    } else if (sortOption === "weight-diff-asc") {
      sorted.sort((a, b) => (a.weightDiff || 0) - (b.weightDiff || 0));
    } else if (sortOption === "weight-diff-desc") {
      sorted.sort((a, b) => (b.weightDiff || 0) - (a.weightDiff || 0));
    }
    return sorted;
  }, [customersWithWeightData, sortOption]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-500 font-mono text-sm animate-pulse">
            INITIALIZING DASHBOARD...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-500 font-bold">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 selection:bg-blue-500/30">
      {/* Navbar / Header */}
      <div className="sticky top-0 z-50 glass-dark border-b border-white/5 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">
              MII FIT <span className="text-blue-500">PRO</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">DASHBOARD v2.0</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDeveloper && (
            <Link href="/admin/backup">
              <Button variant="secondary" size="sm" className="bg-slate-800/50">
                <Database className="mr-2 h-4 w-4" /> バックアップ
              </Button>
            </Link>
          )}
          <Link href="/research-search">
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-800/50 hover:text-blue-300"
            >
              <Search className="mr-2 h-4 w-4" /> リサーチ
            </Button>
          </Link>
          <Link href="/ai-chat">
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-800/50 hover:text-green-300"
            >
              <Bot className="mr-2 h-4 w-4" /> AIコーチ
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="container mx-auto p-4 md:p-6 space-y-8 max-w-7xl animate-fadeIn">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              顧客リスト
            </h2>
            <p className="text-slate-400 mt-1">
              トレーニング進捗と生体データを管理します。
            </p>
          </div>
          <Link href="/customer">
            <Button className="shadow-lg shadow-blue-900/20">
              <UserPlus className="mr-2 h-4 w-4" /> 顧客登録
            </Button>
          </Link>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden">
          <div className="p-4 border-b border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Users className="h-4 w-4" />
              <span>
                総顧客数:{" "}
                <span className="text-white font-mono">
                  {customersWithWeightData.length}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-slate-500" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="">並び替え...</option>
                <option value="name-asc">氏名 (昇順)</option>
                <option value="name-desc">氏名 (降順)</option>
                <option value="date-asc">目標日 (近い順)</option>
                <option value="date-desc">目標日 (遠い順)</option>
                <option value="weight-diff-asc">進捗 (良好順)</option>
                <option value="weight-diff-desc">進捗 (遅れ順)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
              <thead className="text-xs text-slate-300 uppercase bg-slate-950/50 border-b border-slate-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 font-bold tracking-wider whitespace-nowrap"
                  >
                    氏名
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 tracking-wider whitespace-nowrap"
                  >
                    開始時体重
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 tracking-wider whitespace-nowrap"
                  >
                    現在体重
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 tracking-wider whitespace-nowrap"
                  >
                    増減
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 tracking-wider whitespace-nowrap"
                  >
                    目標日
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 tracking-wider whitespace-nowrap"
                  >
                    残日数
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 tracking-wider whitespace-nowrap"
                  >
                    最終更新
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-white group-hover:text-blue-400 transition-colors whitespace-nowrap">
                      <Link
                        href={`/customer/${customer.id}`}
                        className="flex items-center gap-2"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-mono whitespace-nowrap">
                      {customer.firstWeight?.toFixed(1) || "-"}{" "}
                      <span className="text-xs text-slate-600">kg</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-white whitespace-nowrap">
                      {customer.currentWeight?.toFixed(1) || "-"}{" "}
                      <span className="text-xs text-slate-600">kg</span>
                    </td>
                    <td className="px-6 py-4 font-mono whitespace-nowrap">
                      {customer.weightDiff !== null ? (
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-bold ${customer.weightDiff > 0 ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}
                        >
                          {customer.weightDiff > 0 ? "+" : ""}
                          {customer.weightDiff.toFixed(1)} kg
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.completion_date
                        ? new Date(customer.completion_date).toLocaleDateString(
                            "ja-JP",
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.daysRemaining !== null ? (
                        <span
                          className={`font-medium ${customer.daysRemaining < 0 ? "text-red-400" : "text-slate-300"}`}
                        >
                          {customer.daysRemaining}日
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {customer.lastUpdated
                        ? new Date(customer.lastUpdated).toLocaleDateString(
                            "ja-JP",
                          )
                        : "データなし"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customersWithWeightData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Users className="h-12 w-12 mb-4 opacity-20" />
                <p>No clients found in the database.</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
