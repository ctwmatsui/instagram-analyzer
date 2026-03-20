import { Account, ContentIdea, Post } from "@/types";
import { calculateEngagement } from "./engagement";

// AI不要のテンプレートベースのコンテンツ提案
export function generateContentIdeas(account: Account): ContentIdea[] {
  const metrics = calculateEngagement(account);
  const topPosts = getTopPosts(account.posts);
  const themes = analyzeThemes(account);

  const ideas: ContentIdea[] = [];

  // トップ投稿のパターンから提案
  if (topPosts.length > 0) {
    ideas.push({
      theme: "人気投稿のリメイク",
      caption: `過去の人気投稿（平均${metrics.avgLikes}いいね）のスタイルを踏襲しつつ、新しい切り口で投稿`,
      hashtags: account.hashtags,
      format: detectBestFormat(topPosts),
      tips: [
        "過去にエンゲージメントが高かった投稿フォーマットを再利用",
        "同じ構図・色味で異なるテーマの写真を使用",
        `投稿時間は過去の人気投稿を参考に`,
      ],
    });
  }

  // カルーセル投稿の提案
  ideas.push({
    theme: "How-to / チュートリアル",
    caption: "フォロワーが知りたい「やり方」を複数画像で解説するカルーセル投稿",
    hashtags: [...account.hashtags, "howto", "解説"],
    format: "カルーセル（複数画像）",
    tips: [
      "1枚目はキャッチーなタイトル画像",
      "2-9枚目はステップバイステップ",
      "最後の画像にCTA（保存してね等）",
      "保存数が伸びやすいフォーマット",
    ],
  });

  // ビフォーアフター
  ideas.push({
    theme: "ビフォーアフター",
    caption: "変化が一目でわかるビフォーアフター形式の投稿",
    hashtags: [...account.hashtags, "beforeafter", "ビフォーアフター"],
    format: "カルーセルまたは1枚画像（分割）",
    tips: [
      "左右分割または1枚目/2枚目で比較",
      "変化が大きいほどエンゲージメント向上",
      "キャプションで具体的な数値やストーリーを記載",
    ],
  });

  // リスト・まとめ系
  ideas.push({
    theme: "まとめ・ランキング",
    caption: "「○○ おすすめ5選」「知らないと損する○○」などのリスト形式",
    hashtags: [...account.hashtags, "まとめ", "おすすめ"],
    format: "カルーセル（複数画像）",
    tips: [
      "奇数のリスト（3選、5選、7選）が効果的",
      "1枚目に「○選」と数字を大きく表示",
      "保存・シェアされやすいフォーマット",
      "具体的な数字やデータを含める",
    ],
  });

  // 共感・あるある系
  ideas.push({
    theme: "共感・あるある",
    caption: "フォロワーが「わかる！」と共感できるあるある投稿",
    hashtags: [...account.hashtags, "あるある", "共感"],
    format: "1枚画像 or リール",
    tips: [
      "コメントを促す問いかけを入れる",
      "「あなたはどっち？」系の選択肢",
      "日常のあるあるシーンを切り取る",
    ],
  });

  // 裏側・プロセス公開
  ideas.push({
    theme: "裏側・制作プロセス",
    caption: "普段見せない裏側や制作過程を公開してフォロワーとの距離を縮める",
    hashtags: [...account.hashtags, "裏側", "behindthescenes"],
    format: "リール or カルーセル",
    tips: [
      "完成品だけでなくプロセスを見せる",
      "失敗談や苦労話も含める",
      "フォロワーからの親近感が上がる",
    ],
  });

  return ideas;
}

function getTopPosts(posts: Post[]): Post[] {
  return [...posts]
    .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
    .slice(0, 3);
}

function detectBestFormat(topPosts: Post[]): string {
  const avgViews =
    topPosts.reduce((sum, p) => sum + (p.views || 0), 0) / topPosts.length;
  if (avgViews > 0) {
    return "リール（動画）- 表示数が多い傾向";
  }
  return "フィード画像";
}

function analyzeThemes(account: Account): string[] {
  const themes: string[] = [];
  const captions = account.posts
    .map((p) => p.caption || "")
    .filter((c) => c.length > 0);

  if (captions.some((c) => c.includes("おすすめ") || c.includes("紹介"))) {
    themes.push("レビュー・紹介系");
  }
  if (captions.some((c) => c.includes("方法") || c.includes("やり方"))) {
    themes.push("ハウツー系");
  }
  if (captions.some((c) => c.includes("日常") || c.includes("vlog"))) {
    themes.push("日常・ライフスタイル系");
  }

  return themes.length > 0 ? themes : ["一般"];
}
