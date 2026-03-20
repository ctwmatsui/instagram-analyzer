import { Account, Post } from "@/types";

export interface PostPattern {
  label: string;
  description: string;
  confidence: "high" | "medium" | "low";
  icon: string;
}

export function analyzePostPatterns(account: Account): PostPattern[] {
  const posts = account.posts;
  if (posts.length < 3) return [{ label: "データ不足", description: "パターン分析には最低3投稿のデータが必要です", confidence: "low", icon: "📝" }];

  const patterns: PostPattern[] = [];
  const sorted = [...posts].sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments));
  const top = sorted.slice(0, Math.ceil(sorted.length * 0.3));
  const bottom = sorted.slice(-Math.ceil(sorted.length * 0.3));

  // 1. キャプション長の分析
  const topCaptionLen = avg(top.map((p) => (p.caption || "").length));
  const bottomCaptionLen = avg(bottom.map((p) => (p.caption || "").length));
  if (topCaptionLen > bottomCaptionLen * 1.5) {
    patterns.push({
      label: "長文キャプションが好調",
      description: `人気投稿の平均キャプション長は${Math.round(topCaptionLen)}文字。短い投稿（平均${Math.round(bottomCaptionLen)}文字）より高エンゲージメント`,
      confidence: topCaptionLen > bottomCaptionLen * 2 ? "high" : "medium",
      icon: "📝",
    });
  } else if (bottomCaptionLen > topCaptionLen * 1.5) {
    patterns.push({
      label: "短いキャプションが効果的",
      description: `人気投稿は短めのキャプション（平均${Math.round(topCaptionLen)}文字）。簡潔な投稿が好まれる傾向`,
      confidence: "medium",
      icon: "✂️",
    });
  }

  // 2. まとめ・リスト系の分析
  const listKeywords = ["選", "まとめ", "TOP", "BEST", "ランキング", "おすすめ"];
  const topHasList = top.filter((p) => listKeywords.some((k) => (p.caption || "").includes(k))).length;
  if (topHasList >= top.length * 0.3) {
    patterns.push({
      label: "まとめ・リスト系が人気",
      description: `「○選」「まとめ」「TOP」を含む投稿が上位に多い。保存されやすいフォーマット`,
      confidence: topHasList >= top.length * 0.5 ? "high" : "medium",
      icon: "📋",
    });
  }

  // 3. 保存率の分析
  const postsWithSaves = posts.filter((p) => p.saves && p.saves > 0);
  if (postsWithSaves.length > 0) {
    const avgSaveRate = avg(postsWithSaves.map((p) => (p.saves || 0) / (p.likes || 1)));
    if (avgSaveRate > 0.3) {
      patterns.push({
        label: "保存率が高い",
        description: `いいね数に対する保存率が${Math.round(avgSaveRate * 100)}%。有益なコンテンツとしてフォロワーに認知されている`,
        confidence: "high",
        icon: "🔖",
      });
    } else if (avgSaveRate < 0.1) {
      patterns.push({
        label: "保存率に改善余地あり",
        description: `保存率${Math.round(avgSaveRate * 100)}%。「後で見返したい」と思えるコンテンツ（まとめ、ハウツー等）を増やすと改善できる可能性`,
        confidence: "medium",
        icon: "💡",
      });
    }
  }

  // 4. コメント率の分析
  const avgCommentRate = avg(posts.map((p) => p.comments / (p.likes || 1)));
  if (avgCommentRate > 0.08) {
    patterns.push({
      label: "コメント率が高い",
      description: `いいね数に対するコメント率が${Math.round(avgCommentRate * 100)}%。フォロワーとの対話がしっかりできている`,
      confidence: "high",
      icon: "💬",
    });
  } else if (avgCommentRate < 0.03) {
    patterns.push({
      label: "コメントを促す工夫を",
      description: `コメント率${Math.round(avgCommentRate * 100)}%。「あなたはどう思う？」等の問いかけを入れるとコメントが増える傾向`,
      confidence: "medium",
      icon: "🗣️",
    });
  }

  // 5. 表示数の分析（リール vs フィード推定）
  const postsWithViews = posts.filter((p) => p.views && p.views > 0);
  if (postsWithViews.length > 0) {
    const avgReach = avg(postsWithViews.map((p) => (p.views || 0) / account.followers));
    if (avgReach > 1.5) {
      patterns.push({
        label: "フォロワー外リーチが強い",
        description: `平均表示数がフォロワー数の${Math.round(avgReach * 100)}%。非フォロワーへのリーチが大きい`,
        confidence: "high",
        icon: "🚀",
      });
    } else if (avgReach < 0.5) {
      patterns.push({
        label: "リーチが限定的",
        description: `表示数がフォロワー数の${Math.round(avgReach * 100)}%にとどまっている。リールやトレンドハッシュタグの活用で改善可能`,
        confidence: "medium",
        icon: "📡",
      });
    }
  }

  // 6. エンゲージメントの安定性
  const engagements = posts.map((p) => p.likes + p.comments);
  const engAvg = avg(engagements);
  const engStd = Math.sqrt(avg(engagements.map((e) => Math.pow(e - engAvg, 2))));
  const cv = engStd / engAvg;
  if (cv < 0.3) {
    patterns.push({
      label: "安定したエンゲージメント",
      description: "投稿間のエンゲージメントのばらつきが小さく、安定したパフォーマンスを維持",
      confidence: "high",
      icon: "📈",
    });
  } else if (cv > 0.7) {
    patterns.push({
      label: "エンゲージメントにムラあり",
      description: "投稿によってパフォーマンスの差が大きい。人気投稿の特徴を分析して再現性を高めると良い",
      confidence: "medium",
      icon: "📊",
    });
  }

  // 7. ハウツー・教育系の分析
  const howtoKeywords = ["方法", "やり方", "コツ", "解説", "教え", "初心者", "入門", "基本"];
  const topHasHowto = top.filter((p) => howtoKeywords.some((k) => (p.caption || "").includes(k))).length;
  if (topHasHowto >= top.length * 0.3) {
    patterns.push({
      label: "教育コンテンツが強い",
      description: "「方法」「コツ」「解説」を含む教育的な投稿が上位に多い。フォロワーが学びを求めている",
      confidence: topHasHowto >= top.length * 0.5 ? "high" : "medium",
      icon: "🎓",
    });
  }

  return patterns.length > 0 ? patterns : [{ label: "特筆すべきパターンなし", description: "現在のデータからは明確なパターンは検出されませんでした。投稿数を増やすとより正確な分析ができます", confidence: "low", icon: "🔍" }];
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

export interface PostTiming {
  bestDay?: string;
  bestWeek?: string;
  trend: "up" | "down" | "stable";
  trendDescription: string;
}

export function analyzePostTiming(posts: Post[]): PostTiming {
  if (posts.length < 3) {
    return { trend: "stable", trendDescription: "データ不足のためトレンド分析不可" };
  }

  const sorted = [...posts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const half = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, half);
  const secondHalf = sorted.slice(half);

  const firstAvg = avg(firstHalf.map((p) => p.likes + p.comments));
  const secondAvg = avg(secondHalf.map((p) => p.likes + p.comments));

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  let trend: "up" | "down" | "stable";
  let trendDescription: string;

  if (change > 15) {
    trend = "up";
    trendDescription = `直近の投稿は以前と比べてエンゲージメントが${Math.round(change)}%上昇。成長傾向`;
  } else if (change < -15) {
    trend = "down";
    trendDescription = `直近の投稿は以前と比べてエンゲージメントが${Math.round(Math.abs(change))}%低下。コンテンツの見直しが必要かも`;
  } else {
    trend = "stable";
    trendDescription = "エンゲージメントは安定推移";
  }

  return { trend, trendDescription };
}
