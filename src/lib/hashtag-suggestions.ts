import { Account } from "@/types";
import { calculateEngagement } from "./engagement";

export interface HashtagStat {
  tag: string;
  count: number; // how many accounts use it
  avgER: number;
  accounts: string[];
}

export interface HashtagCombo {
  tags: string[];
  avgER: number;
}

export interface HashtagAnalysis {
  topHashtags: HashtagStat[];
  bestERHashtags: HashtagStat[];
  suggestedCombos: HashtagCombo[];
  optimalCount: number;
  popularityRanking: HashtagStat[];
}

export function analyzeHashtags(accounts: Account[]): HashtagAnalysis {
  const tagMap = new Map<string, { totalER: number; count: number; accounts: string[] }>();

  for (const account of accounts) {
    const metrics = calculateEngagement(account);
    for (const tag of account.hashtags) {
      const existing = tagMap.get(tag) || { totalER: 0, count: 0, accounts: [] };
      existing.totalER += metrics.engagementRate;
      existing.count += 1;
      existing.accounts.push(account.username);
      tagMap.set(tag, existing);
    }
  }

  const allStats: HashtagStat[] = Array.from(tagMap.entries()).map(([tag, data]) => ({
    tag,
    count: data.count,
    avgER: Math.round((data.totalER / data.count) * 100) / 100,
    accounts: data.accounts,
  }));

  // Sort by popularity (count)
  const popularityRanking = [...allStats].sort((a, b) => b.count - a.count);

  // Top hashtags by count
  const topHashtags = popularityRanking.slice(0, 10);

  // Best ER hashtags (at least used by 1 account)
  const bestERHashtags = [...allStats]
    .sort((a, b) => b.avgER - a.avgER)
    .slice(0, 10);

  // Find hashtag combinations from high-ER accounts
  const highERAccounts = accounts
    .map((a) => ({ account: a, metrics: calculateEngagement(a) }))
    .filter((a) => a.metrics.engagementRate > 0)
    .sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate)
    .slice(0, 5);

  const suggestedCombos: HashtagCombo[] = highERAccounts
    .filter((a) => a.account.hashtags.length >= 2)
    .map((a) => ({
      tags: a.account.hashtags.slice(0, 5),
      avgER: a.metrics.engagementRate,
    }));

  // Determine optimal hashtag count
  const countERMap = new Map<number, { totalER: number; count: number }>();
  for (const account of accounts) {
    const metrics = calculateEngagement(account);
    const tagCount = account.hashtags.length;
    if (tagCount === 0) continue;
    const existing = countERMap.get(tagCount) || { totalER: 0, count: 0 };
    existing.totalER += metrics.engagementRate;
    existing.count += 1;
    countERMap.set(tagCount, existing);
  }

  let optimalCount = 5; // default
  let bestAvgER = 0;
  for (const [count, data] of countERMap.entries()) {
    const avg = data.totalER / data.count;
    if (avg > bestAvgER) {
      bestAvgER = avg;
      optimalCount = count;
    }
  }

  return {
    topHashtags,
    bestERHashtags,
    suggestedCombos,
    optimalCount,
    popularityRanking,
  };
}
