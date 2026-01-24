"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/constants/api";
import { toast } from "@/utils/toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Bot, ArrowLeft, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChat() {
  useAuth(); // 認証チェック

  useEffect(() => {
    document.title = "AI相談 | MII Fit";
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      console.log("Sending request to:", API_ENDPOINTS.AI_CHAT);
      console.log("Message:", input);

      const response = await fetch(API_ENDPOINTS.AI_CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("Success response:", data);
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const error = await response.json();
        console.error("Error response:", error);
        toast.error(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error("Network error details:", error);
      toast.error("ネットワークエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
              <div className="h-10 w-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-600/20">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">AI コーチ</h1>
                <p className="text-sm text-slate-400">筋トレ・ダイエット専門家</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-slate-800/50">
            <CardTitle className="text-slate-200">最新の科学的根拠に基づいた情報を提供します</CardTitle>
          </CardHeader>

          <div className="h-96 md:h-[500px] overflow-y-auto p-6 space-y-4 bg-slate-950/50">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-20">
                <Bot className="h-16 w-16 mx-auto mb-4 text-green-500/30" />
                <p className="text-lg mb-4 text-slate-300">何でも質問してください！</p>
                <div className="text-sm space-y-2">
                  <p>例: 筋肥大に最適なタンパク質摂取量は？</p>
                  <p>例: HIITと有酸素運動の違いは？</p>
                  <p>例: 減量中のカロリー設定方法は？</p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 border border-slate-700 text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm md:text-base">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
                  <p className="text-slate-400">考え中...</p>
                </div>
              </div>
            )}
          </div>

          <CardContent className="border-t border-slate-800/50 p-4 bg-slate-900/50">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="質問を入力してください..."
                className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-500"
                rows={2}
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-2"
              >
                <Send className="h-4 w-4 mr-2" />
                送信
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
