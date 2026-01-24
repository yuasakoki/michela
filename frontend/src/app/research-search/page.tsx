"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/constants/api";
import { toast } from "@/utils/toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, FileText } from "lucide-react";

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
      });

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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">研究論文検索</h1>
                <p className="text-sm text-slate-400">PubMed リサーチデータベース</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* 検索ボックス */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex gap-2">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="研究キーワードを入力（例: タンパク質 筋肥大）"
                className="flex-1 bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500"
              />
              <Button
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-6"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? "検索中..." : "検索"}
              </Button>
            </div>
            {translatedQuery && (
              <p className="mt-2 text-sm text-slate-400">
                検索クエリ: {translatedQuery}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 検索結果 */}
        {loading && (
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
            <CardContent className="p-12 text-center">
              <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">検索中...</p>
              {translatedQuery && (
                <p className="mt-2 text-sm text-slate-500">
                  検索クエリ: {translatedQuery}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {displayedResults.length > 0 && (
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
            <CardHeader className="border-b border-slate-800/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-slate-200">
                  検索結果 ({offset + 1}～{offset + results.length}件 / 全{totalCount}件)
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSearch(Math.max(0, offset - 10))}
                    disabled={offset === 0 || loading}
                    variant="secondary"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> 前へ
                  </Button>
                  <Button
                    onClick={() => handleSearch(offset + 10)}
                    disabled={offset + results.length >= totalCount || loading}
                    variant="secondary"
                    size="sm"
                  >
                    次へ <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {displayedResults.map((result, index) => (
                <div
                  key={result.pmid}
                  className="border border-slate-700 rounded-lg overflow-hidden animate-fadeIn hover:border-slate-600 transition-colors"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    onClick={() => handleResultClick(result.pmid)}
                    className="p-4 hover:bg-slate-800/50 cursor-pointer transition duration-200"
                  >
                    <h3 className="text-lg font-semibold text-blue-400 mb-2 flex items-start gap-2">
                      <FileText className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      {result.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-1">
                      著者: {result.authors}
                    </p>
                    <p className="text-xs text-slate-500">
                      発行日: {result.date}
                    </p>
                  </div>

                  {/* 展開された要約 */}
                  {expandedPmid === result.pmid && (
                    <div className="border-t border-slate-700 bg-slate-950/50 p-4">
                      {loadingSummary === result.pmid && (
                        <p className="text-center text-slate-400">
                          要約を生成中...
                        </p>
                      )}
                      {summaries[result.pmid] && (
                        <>
                          <h4 className="font-semibold text-slate-200 mb-2">
                            AI要約:
                          </h4>
                          <p className="text-slate-300 mb-4">
                            {summaries[result.pmid].summary}
                          </p>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="secondary" size="sm" className="bg-green-600 hover:bg-green-500 border-green-500/30">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              PubMedで詳細を見る
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {!loading && displayedResults.length === 0 && translatedQuery && (
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">検索結果が見つかりませんでした</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
