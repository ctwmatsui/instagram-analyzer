"use client";

import { useRef } from "react";
import { Account } from "@/types";
import { getAccounts, saveAccounts } from "@/lib/storage";

interface Props {
  onRestore: () => void;
}

export default function BackupRestore({ onRestore }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const accounts = getAccounts();
    const data = JSON.stringify(accounts, null, 2);
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `instagram-analyzer-backup-${timestamp}.json`;
    const blob = new Blob([data], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as Account[];
        if (!Array.isArray(data)) {
          alert("無効なバックアップファイルです");
          return;
        }
        // Validate basic structure
        const valid = data.every(
          (a) => typeof a.id === "string" && typeof a.username === "string"
        );
        if (!valid) {
          alert("無効なバックアップファイルです");
          return;
        }
        saveAccounts(data);
        onRestore();
        alert(`${data.length}件のアカウントを復元しました`);
      } catch {
        alert("バックアップファイルの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleBackup}
        className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
      >
        バックアップ
      </button>
      <label className="cursor-pointer bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
        復元
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleRestore}
          className="hidden"
        />
      </label>
    </div>
  );
}
