"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/constants/api";

interface SearchResult {
  pmid: string;
  title: string;
  authors: string;
  date: string;
  url: string;
}

interface Summary {
  pmid: string;
  title: string;
  summary: string;
  url: string;
}

export default function ResearchSearch() {
  useAuth();

  useEffect(() => {
    document.title = "研究検索 | MII Fit";
  }, []);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [displayedResults, setDisplayedResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [translatedQuery, setTranslatedQuery] = useState("");
  const [expandedPmid, setExpandedPmid] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<{ [key: string]: Summary }>({});
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const handleSearch = async (newOffset: number = 0) => {
    if (!query.trim()) {
      toast.warning("検索キーワードを入力してください");
      return;
    }

    setLoading(true);
    setResults([]);
    setDisplayedResults([]);
    if (newOffset === 0) {
      setTranslatedQuery("");
    }
    setExpandedPmid(null);

    try {
      const response = await fetch(API_ENDPOINTS.SEARCH_RESEARCH, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, offset: newOffset }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setTranslatedQuery(data.translated_query || "");
        setOffset(newOffset);
        setTotalCount(data.count || 0);

        // 結果を1件ずつ順次表示
        if (data.results && data.results.length > 0) {
          for (let i = 0; i < data.results.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 200)); // 200ms間隔
            setDisplayedResults((prev) => [...prev, data.results[i]]);
          }
        }
      } else {
        toast.error("検索に失敗しました");
      }
    } catch (err) {
      toast.error("ネットワークエラーが発生しました");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = async (pmid: string) => {
    // 既に展開されている場合は閉じる
    if (expandedPmid === pmid) {
      setExpandedPmid(null);
      return;
    }

    setExpandedPmid(pmid);

    // 既に要約を取得済みなら再取得しない
    if (summaries[pmid]) {
      return;
    }

    setLoadingSummary(pmid);

    try {
      const response = await fetch(API_ENDPOINTS.RESEARCH_SUMMARY(pmid));

      if (response.ok) {
        const data = await response.json();
        setSummaries((prev) => ({
          ...prev,
          [pmid]: data,
        }));
      } else {
        toast.error("要約の取得に失敗しました");
      }
    } catch (err) {
      toast.error("ネットワークエラーが発生しました");
      console.error("Error:", err);
    } finally {
      setLoadingSummary(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-4">
          <Image src="/vercel.svg" alt="logo" width={150} height={150} />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          研究論文検索
        </h1>

        <div className="mb-4 text-right">
          <Link href="/dashboard">
            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition duration-300">
              ダッシュボードに戻る
            </button>
          </Link>
        </div>

        {/* 検索ボックス */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="研究キーワードを入力（例: タンパク質 筋肥大）"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400 transition duration-300"
            >
              {loading ? "検索中..." : "検索"}
            </button>
          </div>
          {translatedQuery && (
            <p className="mt-2 text-sm text-gray-500">
              検索クエリ: {translatedQuery}
            </p>
          )}
        </div>

        {/* 検索結果 */}
        {loading && (
          <div className="bg-white shadow-lg rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">検索中...</p>
            {translatedQuery && (
              <p className="mt-2 text-sm text-gray-500">
                検索クエリ: {translatedQuery}
              </p>
            )}
          </div>
        )}

        {displayedResults.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                検索結果 ({offset + 1}～{offset + results.length}件 / 全
                {totalCount}件)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSearch(Math.max(0, offset - 10))}
                  disabled={offset === 0 || loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-300 transition duration-300"
                >
                  ← 前へ
                </button>
                <button
                  onClick={() => handleSearch(offset + 10)}
                  disabled={offset + results.length >= totalCount || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-300 transition duration-300"
                >
                  次へ →
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {displayedResults.map((result, index) => (
                <div
                  key={result.pmid}
                  className="border border-gray-200 rounded-lg overflow-hidden animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    onClick={() => handleResultClick(result.pmid)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition duration-200"
                  >
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">
                      {result.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      著者: {result.authors}
                    </p>
                    <p className="text-xs text-gray-500">
                      発行日: {result.date}
                    </p>
                  </div>

                  {/* 展開された要約 */}
                  {expandedPmid === result.pmid && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      {loadingSummary === result.pmid && (
                        <p className="text-center text-gray-500">
                          要約を生成中...
                        </p>
                      )}
                      {summaries[result.pmid] && (
                        <>
                          <h4 className="font-semibold text-gray-800 mb-2">
                            AI要約:
                          </h4>
                          <p className="text-gray-700 mb-4">
                            {summaries[result.pmid].summary}
                          </p>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition duration-300"
                          >
                            PubMedで詳細を見る
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && displayedResults.length === 0 && translatedQuery && (
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <p className="text-gray-500">検索結果が見つかりませんでした</p>
          </div>
        )}
      </div>
    </div>
  );
}
