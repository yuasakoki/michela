"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast, TOAST_DURATION } from "@/utils/toast";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TARGET_NAMES,
} from "@/constants/messages";

export default function CustomerRegist() {
  useAuth(); // 認証チェック
  const router = useRouter();

  useEffect(() => {
    document.title = "顧客登録 | MII Fit";
  }, []);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [favoriteFood, setFavoriteFood] = useState("");
  const [completionDate, setCompletionDate] = useState("");

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register_customer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            age: Number.parseInt(age),
            height: Number.parseFloat(height),
            weight: Number.parseFloat(weight),
            favorite_food: favoriteFood,
            completion_date: completionDate,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(
          SUCCESS_MESSAGES.REGISTERED(TARGET_NAMES.CUSTOMER),
          TOAST_DURATION.SHORT
        );
        // フォームをリセット
        setName("");
        setAge("");
        setHeight("");
        setWeight("");
        setFavoriteFood("");
        setCompletionDate("");
        // ダッシュボードに移動
        setTimeout(() => {
          router.push("/dashboard");
        }, TOAST_DURATION.SHORT);
      } else {
        const error = await response.json();
        toast.error(
          ERROR_MESSAGES.REGISTRATION_FAILED(
            TARGET_NAMES.CUSTOMER,
            error.error
          ),
          TOAST_DURATION.LONG
        );
      }
    } catch (error) {
      toast.error("ネットワークエラーが発生しました");
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <Image src="/vercel.svg" alt="logo" width={150} height={150} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          顧客登録
        </h1>
        <form className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              氏名
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700"
            >
              年齢
            </label>
            <input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label
              htmlFor="height"
              className="block text-sm font-medium text-gray-700"
            >
              身長 (cm)
            </label>
            <input
              id="height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label
              htmlFor="weight"
              className="block text-sm font-medium text-gray-700"
            >
              体重 (kg)
            </label>
            <input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label
              htmlFor="favoriteFood"
              className="block text-sm font-medium text-gray-700"
            >
              好きな食べ物
            </label>
            <input
              id="favoriteFood"
              type="text"
              value={favoriteFood}
              onChange={(e) => setFavoriteFood(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label
              htmlFor="completionDate"
              className="block text-sm font-medium text-gray-700"
            >
              完了予定
            </label>
            <input
              id="completionDate"
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            登録
          </button>
          <div className="mt-4">
            <Link href="/dashboard">
              <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                戻る
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
