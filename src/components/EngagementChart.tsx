"use client";

import { Account } from "@/types";
import { calculateEngagement } from "@/lib/engagement";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface RankingChartProps {
  accounts: Account[];
}

export function EngagementRankingChart({ accounts }: RankingChartProps) {
  const data = accounts
    .map((a) => {
      const m = calculateEngagement(a);
      return { name: `@${a.username}`, ER: m.engagementRate, followers: a.followers };
    })
    .sort((a, b) => b.ER - a.ER)
    .slice(0, 10);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-bold text-gray-900 mb-4">エンゲージメント率ランキング</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" unit="%" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [`${value}%`, "ER"]}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
          />
          <Bar dataKey="ER" fill="url(#gradient)" radius={[0, 4, 4, 0]} />
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PostChartProps {
  account: Account;
}

export function PostEngagementChart({ account }: PostChartProps) {
  const data = [...account.posts]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p) => ({
      date: p.date.slice(5), // MM-DD
      likes: p.likes,
      comments: p.comments,
      views: p.views || 0,
    }));

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-bold text-gray-900 mb-4">投稿別エンゲージメント推移</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
          <Legend />
          <Line type="monotone" dataKey="likes" stroke="#9333ea" strokeWidth={2} name="いいね" dot={{ r: 4 }} />
          <Line type="monotone" dataKey="comments" stroke="#ec4899" strokeWidth={2} name="コメント" dot={{ r: 4 }} />
          {data.some((d) => d.views > 0) && (
            <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} name="表示数" dot={{ r: 4 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CompareChartProps {
  accounts: Account[];
}

export function CompareChart({ accounts }: CompareChartProps) {
  const data = accounts.map((a) => {
    const m = calculateEngagement(a);
    return {
      name: `@${a.username}`,
      ER: m.engagementRate,
      avgLikes: m.avgLikes,
      avgComments: m.avgComments,
      followers: a.followers,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-bold text-gray-900 mb-4">アカウント比較</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
          <Legend />
          <Bar dataKey="avgLikes" fill="#9333ea" name="平均いいね" radius={[4, 4, 0, 0]} />
          <Bar dataKey="avgComments" fill="#ec4899" name="平均コメント" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
