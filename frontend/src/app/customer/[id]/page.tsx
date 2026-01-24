"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import WeightChart from "@/components/WeightChart";
import TrainingVolumeChart from "@/components/TrainingVolumeChart";
import { CalorieChart, PFCChart } from "@/components/NutritionChart";
import { toast, TOAST_DURATION } from "@/utils/toast";
import { API_ENDPOINTS } from "@/constants/api";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  TARGET_NAMES,
} from "@/constants/messages";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  User,
  Calendar,
  Utensils,
  Dumbbell,
  Trash2,
  Edit2,
  Save,
  X,
  ArrowLeft,
  AlertTriangle,
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

interface WeightHistory {
  id: string;
  customer_id: string;
  weight: number;
  recorded_at: string;
}

interface Stats {
  totalTrainingSessions: number;
  avgWeeklyTraining: number;
  totalVolume: number;
  avgCalories: number;
  avgProtein: number;
}

export default function CustomerDetail() {
  useAuth();

  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [selectedWeight, setSelectedWeight] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalTrainingSessions: 0,
    avgWeeklyTraining: 0,
    totalVolume: 0,
    avgCalories: 0,
    avgProtein: 0,
  });

  const [weightHistoryForChart, setWeightHistoryForChart] = useState<any[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [mealRecords, setMealRecords] = useState<any[]>([]);
  const [nutritionGoal, setNutritionGoal] = useState<any>(null);

  const calculateBMI = (height: number, weight: number): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const getStandardBMI = (age: number): number => {
    if (age < 50) return 22.0;
    if (age < 70) return 22.5;
    return 23.0;
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.CUSTOMER(id));
        if (response.ok) {
          const data = await response.json();
          setCustomer(data);
        } else {
          setError("Failed to fetch customer data.");
        }
      } catch (err) {
        setError("Network error occurred.");
        console.error("Error fetching customer:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchWeightHistory = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.WEIGHT_HISTORY(id, 5));
        if (response.ok) {
          const data = await response.json();
          setWeightHistory(data);
        }
      } catch (err) {
        console.error("Error fetching weight history:", err);
      }
    };

    const fetchStats = async () => {
      try {
        const weightChartResponse = await fetch(
          API_ENDPOINTS.WEIGHT_HISTORY(id, 30),
        );
        if (weightChartResponse.ok) {
          const weightData = await weightChartResponse.json();
          setWeightHistoryForChart(
            weightData.map((w: any) => ({
              date: w.recorded_at,
              weight: w.weight,
            })),
          );
        }

        const trainingResponse = await fetch(
          API_ENDPOINTS.TRAINING_SESSIONS(id, 30),
        );
        if (trainingResponse.ok) {
          const trainingSessions = await trainingResponse.json();
          setTrainingSessions(trainingSessions);

          const totalVolume = trainingSessions.reduce(
            (sum: number, session: any) => {
              const sessionVolume = session.exercises.reduce(
                (exSum: number, exercise: any) => {
                  const exerciseVolume = exercise.sets.reduce(
                    (setSum: number, set: any) => sum + set.reps * set.weight,
                    0,
                  );
                  return exSum + exerciseVolume;
                },
                0,
              );
              return sum + sessionVolume;
            },
            0,
          );

          const uniqueDays = new Set(
            trainingSessions.map((s: any) => s.date.split("T")[0]),
          ).size;
          const avgWeeklyTraining = uniqueDays > 0 ? (uniqueDays / 30) * 7 : 0;

          setStats((prev) => ({
            ...prev,
            totalTrainingSessions: trainingSessions.length,
            avgWeeklyTraining: Math.round(avgWeeklyTraining * 10) / 10,
            totalVolume: Math.round(totalVolume),
          }));
        }

        const mealResponse = await fetch(
          API_ENDPOINTS.MEAL_RECORDS(id, undefined, undefined, 30),
        );
        if (mealResponse.ok) {
          const mealRecords = await mealResponse.json();
          setMealRecords(mealRecords);

          if (mealRecords.length > 0) {
            const totalCalories = mealRecords.reduce(
              (sum: number, r: any) => sum + r.total_calories,
              0,
            );
            const totalProtein = mealRecords.reduce(
              (sum: number, r: any) => sum + r.total_protein,
              0,
            );
            const uniqueDays = new Set(mealRecords.map((r: any) => r.date))
              .size;

            setStats((prev) => ({
              ...prev,
              avgCalories: Math.round(totalCalories / uniqueDays),
              avgProtein: Math.round(totalProtein / uniqueDays),
            }));
          }
        }

        const goalResponse = await fetch(API_ENDPOINTS.NUTRITION_GOAL(id));
        if (goalResponse.ok) {
          const goalData = await goalResponse.json();
          setNutritionGoal(goalData);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    if (id) {
      fetchCustomer();
      fetchWeightHistory();
      fetchStats();
    }
  }, [id]);

  useEffect(() => {
    if (customer) {
      setEditedCustomer(customer);
      setSelectedWeight(customer.weight);
      document.title = `${customer.name} | MII Fit Pro`;
    }
  }, [customer]);

  const handleSave = async () => {
    if (!editedCustomer) return;
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_CUSTOMER(id), {
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
      });
      if (response.ok) {
        setCustomer(editedCustomer);
        setIsEditing(false);
        const historyResponse = await fetch(
          API_ENDPOINTS.WEIGHT_HISTORY(id, 5),
        );
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setWeightHistory(historyData);
        }
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (err) {
      toast.error("Network error.");
    }
  };

  const handleWeightChange = async () => {
    if (!customer || selectedWeight === customer.weight) {
      toast.warning(WARNING_MESSAGES.NO_CHANGE(TARGET_NAMES.WEIGHT));
      return;
    }

    try {
      const historyResponse = await fetch(API_ENDPOINTS.ADD_WEIGHT_RECORD(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: selectedWeight }),
      });

      if (historyResponse.ok) {
        const customerResponse = await fetch(API_ENDPOINTS.CUSTOMER(id));
        if (customerResponse.ok) {
          const data = await customerResponse.json();
          setCustomer(data);
          setSelectedWeight(data.weight);
        }
        const weightHistoryResponse = await fetch(
          API_ENDPOINTS.WEIGHT_HISTORY(id, 5),
        );
        if (weightHistoryResponse.ok) {
          const historyData = await weightHistoryResponse.json();
          setWeightHistory(historyData);
        }
        toast.success(SUCCESS_MESSAGES.UPDATED(TARGET_NAMES.WEIGHT));
      } else {
        toast.error(ERROR_MESSAGES.UPDATE_FAILED(TARGET_NAMES.WEIGHT));
      }
    } catch (err) {
      toast.error("Network error.");
      console.error("Error updating weight:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_CUSTOMER(id), {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success(
          SUCCESS_MESSAGES.DELETED(TARGET_NAMES.CUSTOMER),
          TOAST_DURATION.SHORT,
        );
        setTimeout(() => {
          router.push("/dashboard");
        }, TOAST_DURATION.SHORT);
      } else {
        const error = await response.json();
        toast.error(
          ERROR_MESSAGES.DELETION_FAILED(TARGET_NAMES.CUSTOMER, error.error),
          TOAST_DURATION.LONG,
        );
        setShowDeleteModal(false);
      }
    } catch (err) {
      toast.error("Network error.");
      console.error("Error deleting customer:", err);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-500 font-mono text-sm animate-pulse">
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">
            {error || "顧客が見つかりません"}
          </h1>
          <Link href="/dashboard">
            <Button variant="secondary">戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 space-y-8 animate-fadeIn text-slate-200">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              {customer.name}
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="ml-2 text-blue-400 hover:text-blue-300"
                >
                  <Edit2 className="h-4 w-4 mr-1" /> 編集
                </Button>
              )}
            </h1>
            <p className="text-slate-400 text-sm">顧客プロフィール管理</p>
          </div>
        </div>

        {!isEditing && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/customer/${id}/training`}>
              <Button
                variant="primary"
                className="bg-purple-600 hover:bg-purple-500 border-purple-500/30"
              >
                <Dumbbell className="h-4 w-4 mr-2" /> トレーニング記録
              </Button>
            </Link>
            <Link href={`/customer/${id}/meal`}>
              <Button
                variant="primary"
                className="bg-orange-600 hover:bg-orange-500 border-orange-500/30"
              >
                <Utensils className="h-4 w-4 mr-2" /> 食事記録
              </Button>
            </Link>
          </div>
        )}

        {isEditing && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-2" /> キャンセル
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              <Save className="h-4 w-4 mr-2" /> 保存
            </Button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                プロフィール詳細
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    年齢
                  </label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedCustomer?.age}
                      onChange={(e) =>
                        setEditedCustomer((prev) =>
                          prev
                            ? { ...prev, age: parseInt(e.target.value) }
                            : null,
                        )
                      }
                    />
                  ) : (
                    <div className="text-lg font-medium">{customer.age} 歳</div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    身長
                  </label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editedCustomer?.height}
                      onChange={(e) =>
                        setEditedCustomer((prev) =>
                          prev
                            ? { ...prev, height: parseFloat(e.target.value) }
                            : null,
                        )
                      }
                    />
                  ) : (
                    <div className="text-lg font-medium">
                      {customer.height} cm
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    体重
                  </label>
                  {isEditing ? (
                    <select
                      className="w-full h-11 bg-slate-950 border border-slate-700 rounded-xl px-4 text-sm text-white"
                      value={editedCustomer?.weight}
                      onChange={(e) =>
                        setEditedCustomer((prev) =>
                          prev
                            ? { ...prev, weight: parseFloat(e.target.value) }
                            : null,
                        )
                      }
                    >
                      {Array.from({ length: 261 }, (_, i) => 20 + i * 0.5).map(
                        (w) => (
                          <option key={w} value={w}>
                            {w.toFixed(1)} kg
                          </option>
                        ),
                      )}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm text-white"
                        value={selectedWeight}
                        onChange={(e) =>
                          setSelectedWeight(parseFloat(e.target.value))
                        }
                      >
                        {Array.from(
                          { length: 261 },
                          (_, i) => 20 + i * 0.5,
                        ).map((w) => (
                          <option key={w} value={w}>
                            {w.toFixed(1)} kg
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={handleWeightChange}
                        className="h-8"
                      >
                        更新
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    指標
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-xs">BMI</span>
                      <span
                        className={`font-mono font-bold ${calculateBMI(customer.height, customer.weight) > 25 ? "text-yellow-500" : "text-green-500"}`}
                      >
                        {calculateBMI(customer.height, customer.weight).toFixed(
                          1,
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">
                        基準値
                      </span>
                      <span className="font-mono font-bold text-slate-300">
                        {getStandardBMI(customer.age).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    目標日
                  </label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedCustomer?.completion_date}
                      onChange={(e) =>
                        setEditedCustomer((prev) =>
                          prev
                            ? { ...prev, completion_date: e.target.value }
                            : null,
                        )
                      }
                    />
                  ) : (
                    <div className="text-lg font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      {customer.completion_date}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {!isEditing && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-3 text-red-500 text-sm hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> 顧客データを削除
            </button>
          )}
        </div>

        {/* Right Column: Stats & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          {!isEditing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-blue-950/20 border-blue-900/30 p-4 flex flex-col items-center justify-center text-center">
                <div className="text-blue-500 font-bold text-2xl">
                  {stats.totalTrainingSessions}
                </div>
                <div className="text-xs text-blue-300 uppercase tracking-tighter">
                  セッション数
                </div>
              </Card>
              <Card className="bg-purple-950/20 border-purple-900/30 p-4 flex flex-col items-center justify-center text-center">
                <div className="text-purple-500 font-bold text-2xl">
                  {stats.avgWeeklyTraining}
                </div>
                <div className="text-xs text-purple-300 uppercase tracking-tighter">
                  週平均
                </div>
              </Card>
              <Card className="bg-orange-950/20 border-orange-900/30 p-4 flex flex-col items-center justify-center text-center">
                <div className="text-orange-500 font-bold text-2xl">
                  {stats.avgCalories}
                </div>
                <div className="text-xs text-orange-300 uppercase tracking-tighter">
                  kcal / 日
                </div>
              </Card>
              <Card className="bg-red-950/20 border-red-900/30 p-4 flex flex-col items-center justify-center text-center">
                <div className="text-red-500 font-bold text-2xl">
                  {stats.avgProtein}g
                </div>
                <div className="text-xs text-red-300 uppercase tracking-tighter">
                  タンパク質 / 日
                </div>
              </Card>
            </div>
          )}

          {/* Charts */}
          {!isEditing && (
            <div className="space-y-8">
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle>体重推移</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <WeightChart data={weightHistoryForChart} />
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle>総負荷量</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <TrainingVolumeChart sessions={trainingSessions} />
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle>カロリー摂取量</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <CalorieChart
                    records={mealRecords}
                    nutritionGoal={nutritionGoal}
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle>PFCバランス</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <PFCChart records={mealRecords} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <Card className="w-full max-w-md border-red-900/50 bg-slate-950 shadow-2xl shadow-red-900/20">
            <CardHeader className="items-center text-center">
              <div className="h-12 w-12 bg-red-900/20 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <CardTitle className="text-red-500">
                顧客を削除しますか？
              </CardTitle>
              <CardDescription>
                本当に{" "}
                <span className="font-bold text-white">{customer.name}</span>{" "}
                のデータを削除しますか？
                <br />
                この操作は取り消せません。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 justify-center">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                キャンセル
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>
                削除を実行
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
