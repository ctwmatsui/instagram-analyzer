"use client";

import { useState } from "react";
import { Account, Post } from "@/types";
import { generateId } from "@/lib/storage";

interface Props {
  onAdd: (account: Account) => void;
  onClose: () => void;
  editAccount?: Account;
}

export default function AddAccountModal({ onAdd, onClose, editAccount }: Props) {
  const [username, setUsername] = useState(editAccount?.username || "");
  const [followers, setFollowers] = useState(editAccount ? String(editAccount.followers) : "");
  const [following, setFollowing] = useState(editAccount ? String(editAccount.following) : "");
  const [hashtags, setHashtags] = useState(editAccount ? editAccount.hashtags.join(", ") : "");
  const [bio, setBio] = useState(editAccount?.bio || "");
  const [postsText, setPostsText] = useState(
    editAccount
      ? editAccount.posts
          .map((p) => [p.likes, p.comments, p.views || 0, p.saves || 0, p.caption || "", p.date].join(","))
          .join("\n")
      : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const posts: Post[] = postsText
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        return {
          id: generateId(),
          likes: parseInt(parts[0] || "0", 10) || 0,
          comments: parseInt(parts[1] || "0", 10) || 0,
          views: parseInt(parts[2] || "0", 10) || 0,
          saves: parseInt(parts[3] || "0", 10) || 0,
          caption: parts[4] || "",
          date: parts[5] || new Date().toISOString().split("T")[0],
        };
      });

    const account: Account = {
      id: editAccount?.id || generateId(),
      username: username.replace("@", ""),
      hashtags: hashtags
        .split(/[,;、]/)
        .map((h) => h.trim().replace("#", ""))
        .filter(Boolean),
      followers: parseInt(followers, 10) || 0,
      following: parseInt(following, 10) || 0,
      profileUrl: `https://www.instagram.com/${username.replace("@", "")}/`,
      bio,
      posts: editAccount ? editAccount.posts : posts,
      notes: editAccount?.notes,
      createdAt: editAccount?.createdAt || new Date().toISOString(),
    };

    onAdd(account);
  };

  const isEditing = !!editAccount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{isEditing ? "アカウント編集" : "アカウント追加"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ユーザー名 *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フォロワー数 *
              </label>
              <input
                type="number"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                placeholder="15000"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フォロー数
              </label>
              <input
                type="number"
                value={following}
                onChange={(e) => setFollowing(e.target.value)}
                placeholder="500"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ハッシュタグ（カンマ区切り）
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="旅行, カフェ巡り, 写真好き"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プロフィール
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="プロフィールの説明"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                投稿データ（1行1投稿: いいね,コメント,表示数,保存数,キャプション,日付）
              </label>
              <textarea
                value={postsText}
                onChange={(e) => setPostsText(e.target.value)}
                placeholder={`250,15,3000,45,旅行の写真,2024-01-15\n180,8,2000,30,カフェのレビュー,2024-01-10`}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                表示数・保存数が不明な場合は0でOK
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition"
            >
              {isEditing ? "更新" : "追加"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
