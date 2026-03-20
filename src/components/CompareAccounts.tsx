"use client";

import { Account } from "@/types";
import { calculateEngagement, getEngagementRating } from "@/lib/engagement";
import { CompareChart } from "./EngagementChart";

interface Props {
  accounts: Account[];
  onClose: () => void;
}

export default function CompareAccounts({ accounts, onClose }: Props) {
  const accountsWithMetrics = accounts.map((a) => ({
    ...a,
    metrics: calculateEngagement(a),
    rating: getEngagementRating(calculateEngagement(a).engagementRate),
  }));

  const best = accountsWithMetrics.reduce((a, b) =>
    a.metrics.engagementRate > b.metrics.engagementRate ? a : b
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">アカウント比較（{accounts.length}件）</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            &times;
          </button>
        </div>

        {/* Chart */}
        <CompareChart accounts={accounts} />

        {/* Comparison Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-500">指標</th>
                {accountsWithMetrics.map((a) => (
                  <th key={a.id} className="text-center py-3 px-2 font-medium text-gray-900">
                    @{a.username}
                    {a.id === best.id && (
                      <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                        TOP
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <CompareRow
                label="フォロワー"
                values={accountsWithMetrics.map((a) => a.followers.toLocaleString())}
                bestIndex={accountsWithMetrics.indexOf(
                  accountsWithMetrics.reduce((a, b) => (a.followers > b.followers ? a : b))
                )}
              />
              <CompareRow
                label="エンゲージメント率"
                values={accountsWithMetrics.map((a) => `${a.metrics.engagementRate}%`)}
                bestIndex={accountsWithMetrics.indexOf(
                  accountsWithMetrics.reduce((a, b) =>
                    a.metrics.engagementRate > b.metrics.engagementRate ? a : b
                  )
                )}
              />
              <CompareRow
                label="評価"
                values={accountsWithMetrics.map((a) => a.rating.label)}
                colors={accountsWithMetrics.map((a) => a.rating.color)}
              />
              <CompareRow
                label="平均いいね"
                values={accountsWithMetrics.map((a) => a.metrics.avgLikes.toLocaleString())}
                bestIndex={accountsWithMetrics.indexOf(
                  accountsWithMetrics.reduce((a, b) =>
                    a.metrics.avgLikes > b.metrics.avgLikes ? a : b
                  )
                )}
              />
              <CompareRow
                label="平均コメント"
                values={accountsWithMetrics.map((a) => a.metrics.avgComments.toLocaleString())}
                bestIndex={accountsWithMetrics.indexOf(
                  accountsWithMetrics.reduce((a, b) =>
                    a.metrics.avgComments > b.metrics.avgComments ? a : b
                  )
                )}
              />
              <CompareRow
                label="平均表示数"
                values={accountsWithMetrics.map((a) =>
                  a.metrics.avgViews > 0 ? a.metrics.avgViews.toLocaleString() : "-"
                )}
              />
              <CompareRow
                label="平均保存数"
                values={accountsWithMetrics.map((a) =>
                  a.metrics.avgSaves > 0 ? a.metrics.avgSaves.toLocaleString() : "-"
                )}
              />
              <CompareRow
                label="分析投稿数"
                values={accountsWithMetrics.map((a) => `${a.metrics.totalPosts}件`)}
              />
              <CompareRow
                label="ハッシュタグ"
                values={accountsWithMetrics.map((a) =>
                  a.hashtags.slice(0, 3).map((h) => "#" + h).join(" ")
                )}
              />
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-purple-50 rounded-xl p-4">
          <h4 className="font-bold text-purple-900 text-sm mb-2">分析サマリー</h4>
          <p className="text-sm text-purple-800">
            比較した{accounts.length}アカウントの中で、
            <strong>@{best.username}</strong> が最もエンゲージメント率が高い（{best.metrics.engagementRate}%）。
            フォロワー{best.followers.toLocaleString()}人に対して平均{best.metrics.avgLikes}いいね・
            {best.metrics.avgComments}コメントを獲得しており、
            コラボレーションやベンチマーク対象として最適です。
          </p>
        </div>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  values,
  bestIndex,
  colors,
}: {
  label: string;
  values: string[];
  bestIndex?: number;
  colors?: string[];
}) {
  return (
    <tr>
      <td className="py-2.5 px-2 text-gray-500 font-medium">{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`py-2.5 px-2 text-center ${
            colors ? colors[i] : i === bestIndex ? "font-bold text-purple-600" : "text-gray-700"
          }`}
        >
          {v}
        </td>
      ))}
    </tr>
  );
}
