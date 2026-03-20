"use client";

import { Account } from "@/types";
import { calculateEngagement } from "@/lib/engagement";
import { analyzeHashtags } from "@/lib/hashtag-suggestions";

interface Props {
  accounts: Account[];
}

export default function DashboardInsights({ accounts }: Props) {
  if (accounts.length === 0) return null;

  const accountsWithMetrics = accounts.map((a) => ({
    account: a,
    metrics: calculateEngagement(a),
  }));

  const avgFollowers = Math.round(
    accounts.reduce((s, a) => s + a.followers, 0) / accounts.length
  );

  const bestAccount = accountsWithMetrics.reduce((best, cur) =>
    cur.metrics.engagementRate > best.metrics.engagementRate ? cur : best
  );

  const hashtagAnalysis = analyzeHashtags(accounts);

  // Find common patterns among top performers
  const topPerformers = [...accountsWithMetrics]
    .sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate)
    .slice(0, Math.max(1, Math.floor(accounts.length * 0.3)));

  const topAvgPosts = topPerformers.length > 0
    ? Math.round(topPerformers.reduce((s, a) => s + a.metrics.totalPosts, 0) / topPerformers.length)
    : 0;

  const topAvgFollowers = topPerformers.length > 0
    ? Math.round(topPerformers.reduce((s, a) => s + a.account.followers, 0) / topPerformers.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Smart Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">スマートインサイト</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <InsightCard
            icon="🏆"
            title="ベストパフォーマー"
            value={`@${bestAccount.account.username}`}
            sub={`ER: ${bestAccount.metrics.engagementRate}%`}
          />
          <InsightCard
            icon="👥"
            title="平均フォロワー数"
            value={avgFollowers.toLocaleString()}
            sub={`${accounts.length}アカウント平均`}
          />
          <InsightCard
            icon="📊"
            title="トップパフォーマーの傾向"
            value={`平均${topAvgPosts}投稿`}
            sub={`平均フォロワー: ${topAvgFollowers.toLocaleString()}`}
          />
          <InsightCard
            icon="#️⃣"
            title="最適ハッシュタグ数"
            value={`${hashtagAnalysis.optimalCount}個`}
            sub="最もER が高い数"
          />
        </div>
      </div>

      {/* Hashtag Analysis */}
      {hashtagAnalysis.topHashtags.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">ハッシュタグ分析</h3>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Popular Hashtags */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">人気ハッシュタグ（使用数順）</h4>
              <div className="space-y-1.5">
                {hashtagAnalysis.topHashtags.slice(0, 5).map((h) => (
                  <div key={h.tag} className="flex items-center justify-between text-sm">
                    <span className="text-purple-600">#{h.tag}</span>
                    <span className="text-gray-400">{h.count}アカウント</span>
                  </div>
                ))}
              </div>
            </div>

            {/* High ER Hashtags */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">高ER ハッシュタグ</h4>
              <div className="space-y-1.5">
                {hashtagAnalysis.bestERHashtags.slice(0, 5).map((h) => (
                  <div key={h.tag} className="flex items-center justify-between text-sm">
                    <span className="text-purple-600">#{h.tag}</span>
                    <span className="text-gray-400">平均ER {h.avgER}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Combos */}
          {hashtagAnalysis.suggestedCombos.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">おすすめハッシュタグ組み合わせ</h4>
              <div className="space-y-2">
                {hashtagAnalysis.suggestedCombos.slice(0, 3).map((combo, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {combo.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">ER {combo.avgER}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InsightCard({ icon, title, value, sub }: { icon: string; title: string; value: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}
