"use client";

import { useState, useEffect, useCallback } from "react";
import { Account, Post } from "@/types";
import { calculateEngagement, getEngagementRating } from "@/lib/engagement";
import { generateContentIdeas } from "@/lib/content-ideas";
import { generateId } from "@/lib/storage";
import { parsePostsCsv, generatePostsCsvTemplate } from "@/lib/csv";
import { exportPostsCsv, downloadFile } from "@/lib/export";
import { analyzePostPatterns, analyzePostTiming } from "@/lib/pattern-analysis";
import { PostEngagementChart } from "./EngagementChart";

interface Props {
  account: Account;
  onBack: () => void;
  onUpdate: (account: Account) => void;
}

type SortKey = "likes" | "comments" | "views" | "date";
type SortDir = "asc" | "desc";

export default function AccountDetail({ account, onBack, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "patterns" | "ideas">("overview");
  const [showAddPost, setShowAddPost] = useState(false);
  const [postLine, setPostLine] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [notes, setNotes] = useState(account.notes || "");

  const metrics = calculateEngagement(account);
  const rating = getEngagementRating(metrics.engagementRate);
  const contentIdeas = generateContentIdeas(account);
  const patterns = analyzePostPatterns(account);
  const timing = analyzePostTiming(account.posts);

  const topPosts = [...account.posts]
    .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
    .slice(0, 5);

  // Sort posts
  const sortedPosts = [...account.posts].sort((a, b) => {
    let aVal: number, bVal: number;
    switch (sortKey) {
      case "likes":
        aVal = a.likes; bVal = b.likes; break;
      case "comments":
        aVal = a.comments; bVal = b.comments; break;
      case "views":
        aVal = a.views || 0; bVal = b.views || 0; break;
      case "date":
      default:
        aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); break;
    }
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const addPost = () => {
    if (!postLine.trim()) return;
    const parts = postLine.split(",").map((s) => s.trim());
    const newPost: Post = {
      id: generateId(),
      likes: parseInt(parts[0] || "0", 10) || 0,
      comments: parseInt(parts[1] || "0", 10) || 0,
      views: parseInt(parts[2] || "0", 10) || 0,
      saves: parseInt(parts[3] || "0", 10) || 0,
      caption: parts[4] || "",
      date: parts[5] || new Date().toISOString().split("T")[0],
    };
    onUpdate({ ...account, posts: [...account.posts, newPost] });
    setPostLine("");
    setShowAddPost(false);
  };

  const addBulkPosts = () => {
    if (!bulkText.trim()) return;
    const newPosts: Post[] = bulkText
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        return {
          id: generateId(),
          likes: parseInt(parts[0] || "0", 10) || 0,
          comments: parseInt(parts[1] || "0", 10) || 0,
          views: parseInt(parts[2] || "0", 10) || 0,
          saves: parseInt(parts[3] || "0", 10) || 0,
          caption: parts[4] || "",
          date: parts[5] || new Date().toISOString().split("T")[0],
        };
      });
    onUpdate({ ...account, posts: [...account.posts, ...newPosts] });
    setBulkText("");
    setShowBulkInput(false);
  };

  const handlePostsCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const posts = parsePostsCsv(text);
      onUpdate({ ...account, posts: [...account.posts, ...posts] });
    };
    reader.readAsText(file);
  };

  const deletePost = (postId: string) => {
    onUpdate({ ...account, posts: account.posts.filter((p) => p.id !== postId) });
  };

  const downloadPostsTemplate = () => {
    const csv = generatePostsCsvTemplate();
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "posts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPosts = () => {
    const csv = exportPostsCsv(account);
    downloadFile(csv, `${account.username}_posts.csv`, "text/csv");
  };

  // Auto-save notes with debounce
  const saveNotes = useCallback((value: string) => {
    onUpdate({ ...account, notes: value });
  }, [account, onUpdate]);

  useEffect(() => {
    if (notes === (account.notes || "")) return;
    const timer = setTimeout(() => {
      saveNotes(notes);
    }, 800);
    return () => clearTimeout(timer);
  }, [notes, account.notes, saveNotes]);

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        ← 一覧に戻る
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {account.username[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">@{account.username}</h1>
            {account.bio && <p className="text-gray-500 mt-1">{account.bio}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {account.hashtags.map((tag) => (
                <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <a
            href={account.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 hover:text-purple-700 text-sm"
          >
            Instagramで見る ↗
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-100">
          <StatBox label="フォロワー" value={account.followers.toLocaleString()} />
          <StatBox label="ER" value={`${metrics.engagementRate}%`} sub={rating.label} color={rating.color} />
          <StatBox label="平均いいね" value={metrics.avgLikes.toLocaleString()} />
          <StatBox label="平均コメント" value={metrics.avgComments.toLocaleString()} />
          <StatBox label="平均表示数" value={metrics.avgViews > 0 ? metrics.avgViews.toLocaleString() : "-"} />
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="アカウントに関するメモを入力..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
        />
        <p className="text-xs text-gray-400 mt-1">自動保存されます</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        {(["overview", "posts", "patterns", "ideas"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "overview"
              ? "概要"
              : tab === "posts"
              ? `投稿 (${account.posts.length})`
              : tab === "patterns"
              ? "パターン分析"
              : "コンテンツ提案"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {account.posts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-lg">投稿データがありません</p>
              <p className="text-gray-400 text-sm mt-2">「投稿」タブから投稿データを追加してください</p>
            </div>
          ) : (
            <>
              {/* Chart */}
              <PostEngagementChart account={account} />

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">トップ投稿</h3>
                <div className="space-y-3">
                  {topPosts.map((post, i) => (
                    <div key={post.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{post.caption || "（キャプションなし）"}</p>
                        <p className="text-xs text-gray-400">{post.date}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span>❤️ {post.likes}</span>
                        <span>💬 {post.comments}</span>
                        {post.views ? <span>👁 {post.views}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trend */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">トレンド</h3>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${timing.trend === "up" ? "" : timing.trend === "down" ? "" : ""}`}>
                    {timing.trend === "up" ? "📈" : timing.trend === "down" ? "📉" : "➡️"}
                  </span>
                  <p className="text-sm text-gray-700">{timing.trendDescription}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">分析サマリー</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">エンゲージメント率:</span>{" "}
                    <span className={rating.color}>{metrics.engagementRate}% ({rating.label})</span>
                  </p>
                  <p>
                    フォロワー {account.followers.toLocaleString()} 人に対して、
                    平均 {metrics.avgLikes} いいね・{metrics.avgComments} コメントを獲得。
                    {metrics.engagementRate >= 3
                      ? "フォロワーとのエンゲージメントが高く、影響力のあるアカウントです。"
                      : metrics.engagementRate >= 1.5
                      ? "平均的なエンゲージメントです。コンテンツの工夫で改善の余地があります。"
                      : "エンゲージメントが低めです。コンテンツ戦略の見直しを推奨します。"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setShowAddPost(!showAddPost); setShowBulkInput(false); }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
            >
              + 投稿を追加
            </button>
            <button
              onClick={() => { setShowBulkInput(!showBulkInput); setShowAddPost(false); }}
              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
            >
              一括入力
            </button>
            <label className="cursor-pointer bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition">
              CSV インポート
              <input type="file" accept=".csv" onChange={handlePostsCsv} className="hidden" />
            </label>
            <button
              onClick={downloadPostsTemplate}
              className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
            >
              テンプレートDL
            </button>
            {account.posts.length > 0 && (
              <button
                onClick={handleExportPosts}
                className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition ml-auto"
              >
                CSVエクスポート
              </button>
            )}
          </div>

          {showAddPost && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-2">形式: いいね,コメント,表示数,保存数,キャプション,日付</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={postLine}
                  onChange={(e) => setPostLine(e.target.value)}
                  placeholder="250,15,3000,45,投稿の内容,2024-01-15"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button onClick={addPost} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
                  追加
                </button>
              </div>
            </div>
          )}

          {/* Bulk Input */}
          {showBulkInput && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-2">
                1行1投稿: いいね,コメント,表示数,保存数,キャプション,日付
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`250,15,3000,45,旅行の写真,2024-01-15\n180,8,2000,30,カフェのレビュー,2024-01-10\n320,22,5000,60,夕焼けの風景,2024-01-05`}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowBulkInput(false)}
                  className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
                >
                  キャンセル
                </button>
                <button
                  onClick={addBulkPosts}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                >
                  一括追加
                </button>
              </div>
            </div>
          )}

          {/* Sort Controls */}
          {account.posts.length > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">並び替え:</span>
              {([
                { key: "date" as SortKey, label: "日付" },
                { key: "likes" as SortKey, label: "いいね" },
                { key: "comments" as SortKey, label: "コメント" },
                { key: "views" as SortKey, label: "表示数" },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`px-3 py-1 rounded-lg transition ${
                    sortKey === key
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {label} {sortKey === key ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </button>
              ))}
            </div>
          )}

          {account.posts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              投稿データなし — 上のボタンから追加してください
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {sortedPosts.map((post) => (
                <div key={post.id} className="p-4 flex items-center gap-4 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{post.caption || "（キャプションなし）"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{post.date}</p>
                  </div>
                  <div className="flex gap-3 text-sm text-gray-600">
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                    {post.views ? <span>👁 {post.views}</span> : null}
                    {post.saves ? <span>🔖 {post.saves}</span> : null}
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === "patterns" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">投稿データから検出されたパターンと傾向</p>

          {patterns.map((pattern, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{pattern.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">{pattern.label}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        pattern.confidence === "high"
                          ? "bg-green-100 text-green-700"
                          : pattern.confidence === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {pattern.confidence === "high" ? "確度: 高" : pattern.confidence === "medium" ? "確度: 中" : "確度: 低"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Timing analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">
                {timing.trend === "up" ? "📈" : timing.trend === "down" ? "📉" : "➡️"}
              </span>
              <div>
                <h4 className="font-bold text-gray-900">エンゲージメント推移</h4>
                <p className="text-sm text-gray-600 mt-1">{timing.trendDescription}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Ideas Tab */}
      {activeTab === "ideas" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            @{account.username} のデータを基にしたコンテンツ提案
          </p>
          {contentIdeas.map((idea, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <span className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{idea.theme}</h4>
                  <p className="text-sm text-gray-600 mt-1">{idea.caption}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {idea.hashtags.slice(0, 6).map((tag, j) => (
                      <span key={`${tag}-${j}`} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-purple-600 mt-2 font-medium">📸 {idea.format}</p>
                  <ul className="mt-3 space-y-1">
                    {idea.tips.map((tip, j) => (
                      <li key={j} className="text-xs text-gray-500 flex items-start gap-1.5">
                        <span className="text-purple-400 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 rounded-xl p-5 border border-dashed border-gray-300">
            <p className="text-sm text-gray-500 text-center">
              💡 AIによるカスタム提案は今後追加予定（Anthropic API連携）
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${color || "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {sub && <p className={`text-xs ${color || ""}`}>{sub}</p>}
    </div>
  );
}
