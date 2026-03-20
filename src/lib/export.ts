import { Account } from "@/types";
import { calculateEngagement } from "./engagement";

export function exportAccountsCsv(accounts: Account[]): string {
  const header = "ランク,ユーザー名,フォロワー,フォロー,ER(%),平均いいね,平均コメント,平均表示数,平均保存数,投稿数,ハッシュタグ,プロフィール";

  const rows = accounts
    .map((a) => {
      const m = calculateEngagement(a);
      return [m, a] as const;
    })
    .sort((a, b) => b[0].engagementRate - a[0].engagementRate)
    .map(([m, a], i) =>
      [
        i + 1,
        `@${a.username}`,
        a.followers,
        a.following,
        m.engagementRate,
        m.avgLikes,
        m.avgComments,
        m.avgViews,
        m.avgSaves,
        m.totalPosts,
        `"${a.hashtags.map((h) => "#" + h).join(", ")}"`,
        `"${(a.bio || "").replace(/"/g, '""')}"`,
      ].join(",")
    );

  return [header, ...rows].join("\n");
}

export function exportPostsCsv(account: Account): string {
  const header = "日付,いいね,コメント,表示数,保存数,キャプション";
  const rows = account.posts.map((p) =>
    [
      p.date,
      p.likes,
      p.comments,
      p.views || 0,
      p.saves || 0,
      `"${(p.caption || "").replace(/"/g, '""')}"`,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export function exportJson(accounts: Account[]): string {
  const data = accounts.map((a) => ({
    ...a,
    metrics: calculateEngagement(a),
  }));
  return JSON.stringify(data, null, 2);
}

export function downloadFile(content: string, filename: string, type: string): void {
  const bom = type.includes("csv") ? "\uFEFF" : "";
  const blob = new Blob([bom + content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
