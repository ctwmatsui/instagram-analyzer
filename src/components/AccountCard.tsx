"use client";

import { Account, EngagementMetrics } from "@/types";
import { getEngagementRating } from "@/lib/engagement";

interface Props {
  account: Account;
  metrics: EngagementMetrics;
  rank: number;
  onSelect: (account: Account) => void;
  onDelete: (id: string) => void;
  onEdit?: (account: Account) => void;
}

export default function AccountCard({ account, metrics, rank, onSelect, onDelete, onEdit }: Props) {
  const rating = getEngagementRating(metrics.engagementRate);

  const formatNumber = (n: number): string => {
    if (n >= 10000) return (n / 10000).toFixed(1) + "万";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {rank}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">@{account.username}</h3>
            <p className="text-sm text-gray-500">
              {formatNumber(account.followers)} フォロワー
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(account); }}
              className="text-gray-300 hover:text-purple-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(account.id)}
            className="text-gray-300 hover:text-red-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {account.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {account.hashtags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
          {account.hashtags.length > 4 && (
            <span className="text-xs text-gray-400">+{account.hashtags.length - 4}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{metrics.avgLikes}</p>
          <p className="text-xs text-gray-500">平均いいね</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{metrics.avgComments}</p>
          <p className="text-xs text-gray-500">平均コメント</p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold ${rating.color}`}>
            {metrics.engagementRate}%
          </p>
          <p className="text-xs text-gray-500">ER</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={`text-xs font-medium ${rating.color} bg-gray-50 px-2 py-1 rounded-full`}>
          {rating.label}
        </span>
        <span className="text-xs text-gray-400">{metrics.totalPosts}投稿分析</span>
      </div>

      <button
        onClick={() => onSelect(account)}
        className="mt-4 w-full py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-purple-50 hover:text-purple-700 transition"
      >
        詳細 &amp; コンテンツ提案 →
      </button>
    </div>
  );
}
