import { Account, Post } from "@/types";
import { generateId } from "./storage";

// CSV format for accounts:
// username, followers, following, hashtags (semicolon separated), bio
export function parseAccountsCsv(csvText: string): Partial<Account>[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const isHeaderRow =
    header.includes("username") || header.includes("followers");
  const dataLines = isHeaderRow ? lines.slice(1) : lines;

  return dataLines
    .filter((line) => line.trim())
    .map((line) => {
      const cols = parseCsvLine(line);
      return {
        id: generateId(),
        username: cols[0]?.trim().replace("@", "") || "",
        followers: parseInt(cols[1]?.trim() || "0", 10) || 0,
        following: parseInt(cols[2]?.trim() || "0", 10) || 0,
        hashtags: cols[3]
          ? cols[3].split(";").map((h) => h.trim().replace("#", ""))
          : [],
        bio: cols[4]?.trim() || "",
        profileUrl: `https://www.instagram.com/${cols[0]?.trim().replace("@", "")}/`,
        posts: [],
        createdAt: new Date().toISOString(),
      };
    })
    .filter((a) => a.username);
}

// CSV format for posts:
// likes, comments, views, saves, caption, date
export function parsePostsCsv(csvText: string): Post[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const isHeaderRow = header.includes("likes") || header.includes("comments");
  const dataLines = isHeaderRow ? lines.slice(1) : lines;

  return dataLines
    .filter((line) => line.trim())
    .map((line) => {
      const cols = parseCsvLine(line);
      return {
        id: generateId(),
        likes: parseInt(cols[0]?.trim() || "0", 10) || 0,
        comments: parseInt(cols[1]?.trim() || "0", 10) || 0,
        views: parseInt(cols[2]?.trim() || "0", 10) || 0,
        saves: parseInt(cols[3]?.trim() || "0", 10) || 0,
        caption: cols[4]?.trim() || "",
        date: cols[5]?.trim() || new Date().toISOString().split("T")[0],
      };
    });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function generateAccountsCsvTemplate(): string {
  return `username,followers,following,hashtags,bio
example_account,15000,500,ハッシュタグ1;ハッシュタグ2,プロフィール説明`;
}

export function generatePostsCsvTemplate(): string {
  return `likes,comments,views,saves,caption,date
250,15,3000,45,投稿のキャプション,2024-01-15`;
}
