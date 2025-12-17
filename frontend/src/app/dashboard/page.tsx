"use client";
import React from "react";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-green-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-800">
          ダッシュボードへようこそ！
        </h1>
        <Link href="/customer">
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            顧客登録
          </button>
        </Link>
      </div>
    </div>
  );
}
