import { Account, EngagementMetrics } from "@/types";

export function calculateEngagement(account: Account): EngagementMetrics {
  const posts = account.posts;
  const totalPosts = posts.length;

  if (totalPosts === 0) {
    return {
      avgLikes: 0,
      avgComments: 0,
      avgViews: 0,
      avgSaves: 0,
      engagementRate: 0,
      likesPerPost: 0,
      commentsPerPost: 0,
      totalPosts: 0,
    };
  }

  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalSaves = posts.reduce((sum, p) => sum + (p.saves || 0), 0);
  const postsWithViews = posts.filter((p) => p.views && p.views > 0).length;

  const avgLikes = totalLikes / totalPosts;
  const avgComments = totalComments / totalPosts;
  const avgViews = postsWithViews > 0 ? totalViews / postsWithViews : 0;
  const avgSaves = totalSaves / totalPosts;

  // Engagement Rate = (likes + comments) / followers * 100
  const engagementRate =
    account.followers > 0
      ? ((avgLikes + avgComments) / account.followers) * 100
      : 0;

  return {
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    avgViews: Math.round(avgViews),
    avgSaves: Math.round(avgSaves),
    engagementRate: Math.round(engagementRate * 100) / 100,
    likesPerPost: Math.round(avgLikes),
    commentsPerPost: Math.round(avgComments),
    totalPosts,
  };
}

export function getEngagementRating(rate: number): {
  label: string;
  color: string;
} {
  if (rate >= 6) return { label: "非常に高い", color: "text-green-600" };
  if (rate >= 3) return { label: "高い", color: "text-emerald-500" };
  if (rate >= 1.5) return { label: "平均的", color: "text-yellow-500" };
  if (rate >= 0.5) return { label: "低い", color: "text-orange-500" };
  return { label: "非常に低い", color: "text-red-500" };
}

export function sortByEngagement(accounts: Account[]): (Account & { metrics: EngagementMetrics })[] {
  return accounts
    .map((account) => ({
      ...account,
      metrics: calculateEngagement(account),
    }))
    .sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate);
}
