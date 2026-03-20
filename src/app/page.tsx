"use client";

import { useState, useEffect, useCallback } from "react";
import { Account } from "@/types";
import { getAccounts, saveAccounts, addAccount, deleteAccount, updateAccount } from "@/lib/storage";
import { sortByEngagement } from "@/lib/engagement";
import { exportAccountsCsv, exportJson, downloadFile } from "@/lib/export";
import { generateDemoData } from "@/lib/demo-data";
import AccountCard from "@/components/AccountCard";
import AccountDetail from "@/components/AccountDetail";
import AddAccountModal from "@/components/AddAccountModal";
import CsvUpload from "@/components/CsvUpload";
import CompareAccounts from "@/components/CompareAccounts";
import DashboardInsights from "@/components/DashboardInsights";
import BackupRestore from "@/components/BackupRestore";
import { EngagementRankingChart } from "@/components/EngagementChart";

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [filterHashtag, setFilterHashtag] = useState("");
  const [followerRange, setFollowerRange] = useState<"all" | "5k-10k" | "10k-50k" | "50k-100k">("all");
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  const loadAccounts = useCallback(() => {
    setAccounts(getAccounts());
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleAddAccount = (account: Account) => {
    if (editingAccount) {
      updateAccount(account);
    } else {
      addAccount(account);
    }
    loadAccounts();
    setShowAddModal(false);
    setEditingAccount(undefined);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowAddModal(true);
  };

  const handleCsvImport = (imported: Partial<Account>[]) => {
    const current = getAccounts();
    const newAccounts = imported
      .filter((a) => a.username && !current.some((c) => c.username === a.username))
      .map((a) => ({
        id: a.id || Date.now().toString(),
        username: a.username || "",
        hashtags: a.hashtags || [],
        followers: a.followers || 0,
        following: a.following || 0,
        profileUrl: a.profileUrl || "",
        bio: a.bio || "",
        posts: a.posts || [],
        createdAt: a.createdAt || new Date().toISOString(),
      }));
    saveAccounts([...current, ...newAccounts]);
    loadAccounts();
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
    setCompareIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    loadAccounts();
  };

  const handleUpdate = (updated: Account) => {
    updateAccount(updated);
    loadAccounts();
    setSelectedAccount(updated);
  };

  const handleLoadDemo = () => {
    const demo = generateDemoData();
    const current = getAccounts();
    const newOnes = demo.filter((d) => !current.some((c) => c.username === d.username));
    saveAccounts([...current, ...newOnes]);
    loadAccounts();
  };

  const handleExportCsv = () => {
    const csv = exportAccountsCsv(accounts);
    downloadFile(csv, "instagram_analysis.csv", "text/csv");
  };

  const handleExportJson = () => {
    const json = exportJson(accounts);
    downloadFile(json, "instagram_analysis.json", "application/json");
  };

  const toggleCompareId = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAccount = (account: Account) => {
    if (compareMode) {
      toggleCompareId(account.id);
    } else {
      setSelectedAccount(account);
    }
  };

  // フィルタリング
  const filteredAccounts = accounts.filter((a) => {
    if (filterHashtag) {
      const match = a.hashtags.some((h) =>
        h.toLowerCase().includes(filterHashtag.toLowerCase().replace("#", ""))
      );
      if (!match) return false;
    }
    if (followerRange !== "all") {
      const f = a.followers;
      if (followerRange === "5k-10k" && (f < 5000 || f > 10000)) return false;
      if (followerRange === "10k-50k" && (f < 10000 || f > 50000)) return false;
      if (followerRange === "50k-100k" && (f < 50000 || f > 100000)) return false;
    }
    return true;
  });

  const rankedAccounts = sortByEngagement(filteredAccounts);

  // 全ハッシュタグを集計
  const allHashtags = [...new Set(accounts.flatMap((a) => a.hashtags))];

  const compareAccounts = accounts.filter((a) => compareIds.has(a.id));

  if (selectedAccount) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <AccountDetail
          account={selectedAccount}
          onBack={() => setSelectedAccount(null)}
          onUpdate={handleUpdate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Instagram Analyzer
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                ハッシュタグ × エンゲージメント分析
              </p>
            </div>
            <div className="flex gap-2">
              {accounts.length > 0 && (
                <>
                  <BackupRestore onRestore={loadAccounts} />
                  <button
                    onClick={() => {
                      setCompareMode(!compareMode);
                      if (compareMode) setCompareIds(new Set());
                    }}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                      compareMode
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {compareMode ? "比較モード ON" : "比較"}
                  </button>
                  <div className="relative group">
                    <button className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                      エクスポート
                    </button>
                    <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button onClick={handleExportCsv} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg whitespace-nowrap">
                        CSV でエクスポート
                      </button>
                      <button onClick={handleExportJson} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg whitespace-nowrap">
                        JSON でエクスポート
                      </button>
                    </div>
                  </div>
                </>
              )}
              <button
                onClick={() => { setEditingAccount(undefined); setShowAddModal(true); }}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition"
              >
                + アカウント追加
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {accounts.length === 0 ? (
          /* Empty State */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-xl font-bold text-gray-900">Instagramアカウントを分析しよう</h2>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                ハッシュタグで見つけたアカウントの情報を入力して、
                エンゲージメント率の高いアカウントを見つけましょう
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => { setEditingAccount(undefined); setShowAddModal(true); }}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
                >
                  手動で追加
                </button>
                <button
                  onClick={handleLoadDemo}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  デモデータで試す
                </button>
              </div>
              <div className="mt-4">
                <BackupRestore onRestore={loadAccounts} />
              </div>
              <div className="mt-8 max-w-md mx-auto">
                <CsvUpload onImport={handleCsvImport} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">使い方</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                <Step num={1} title="ハッシュタグで検索" desc="Instagramで対象ハッシュタグを検索し、気になるアカウントを見つける" />
                <Step num={2} title="データを入力" desc="アカウントのフォロワー数や投稿のいいね・コメント数を入力" />
                <Step num={3} title="分析 & 提案" desc="エンゲージメント率でランキング、コンテンツ提案を確認" />
              </div>
            </div>
          </div>
        ) : (
          /* Main Content */
          <div className="space-y-6">
            {/* Compare mode banner */}
            {compareMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">
                    比較モード: {compareIds.size}件選択中
                  </p>
                  <p className="text-sm text-blue-600 mt-0.5">
                    カードをクリックして比較したいアカウントを選択してください
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (compareIds.size >= 2) setShowCompare(true);
                    }}
                    disabled={compareIds.size < 2}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      compareIds.size >= 2
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    比較する
                  </button>
                  <button
                    onClick={() => {
                      setCompareMode(false);
                      setCompareIds(new Set());
                    }}
                    className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={filterHashtag}
                    onChange={(e) => setFilterHashtag(e.target.value)}
                    placeholder="ハッシュタグで絞り込み..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  {(["all", "5k-10k", "10k-50k", "50k-100k"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setFollowerRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        followerRange === range
                          ? "bg-purple-100 text-purple-700 font-medium"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {range === "all" ? "全て" : range}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleLoadDemo}
                  className="text-gray-400 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
                >
                  + デモデータ
                </button>
              </div>
              {allHashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                  {allHashtags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setFilterHashtag(filterHashtag === tag ? "" : tag)}
                      className={`text-xs px-2.5 py-1 rounded-full transition ${
                        filterHashtag === tag
                          ? "bg-purple-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-purple-50"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MiniStat label="総アカウント" value={accounts.length} />
              <MiniStat label="表示中" value={filteredAccounts.length} />
              <MiniStat
                label="平均ER"
                value={
                  rankedAccounts.length > 0
                    ? (rankedAccounts.reduce((s, a) => s + a.metrics.engagementRate, 0) / rankedAccounts.length).toFixed(2) + "%"
                    : "-"
                }
              />
              <MiniStat
                label="最高ER"
                value={rankedAccounts.length > 0 ? rankedAccounts[0].metrics.engagementRate + "%" : "-"}
              />
            </div>

            {/* Dashboard Insights */}
            <DashboardInsights accounts={accounts} />

            {/* Engagement Ranking Chart */}
            {rankedAccounts.length >= 2 && (
              <EngagementRankingChart accounts={filteredAccounts} />
            )}

            {/* CSV Import */}
            <CsvUpload onImport={handleCsvImport} />

            {/* Account Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankedAccounts.map((account, i) => (
                <div
                  key={account.id}
                  className={`relative ${
                    compareMode && compareIds.has(account.id) ? "ring-2 ring-blue-500 rounded-xl" : ""
                  }`}
                >
                  {compareMode && compareIds.has(account.id) && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
                      ✓
                    </div>
                  )}
                  <AccountCard
                    account={account}
                    metrics={account.metrics}
                    rank={i + 1}
                    onSelect={handleSelectAccount}
                    onDelete={handleDelete}
                    onEdit={handleEditAccount}
                  />
                </div>
              ))}
            </div>

            {rankedAccounts.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                条件に一致するアカウントがありません
              </p>
            )}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddAccountModal
          onAdd={handleAddAccount}
          onClose={() => { setShowAddModal(false); setEditingAccount(undefined); }}
          editAccount={editingAccount}
        />
      )}

      {showCompare && compareAccounts.length >= 2 && (
        <CompareAccounts
          accounts={compareAccounts}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mx-auto">
        {num}
      </div>
      <h4 className="font-medium text-gray-900 mt-3">{title}</h4>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
