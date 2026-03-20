"use client";

import { useRef } from "react";
import { Account } from "@/types";
import { parseAccountsCsv, generateAccountsCsvTemplate } from "@/lib/csv";

interface Props {
  onImport: (accounts: Partial<Account>[]) => void;
}

export default function CsvUpload({ onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const accounts = parseAccountsCsv(text);
      onImport(accounts);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csv = generateAccountsCsvTemplate();
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "instagram_accounts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition">
      <div className="space-y-3">
        <div className="text-4xl">📄</div>
        <div>
          <p className="font-medium text-gray-700">CSVファイルで一括インポート</p>
          <p className="text-sm text-gray-500 mt-1">
            username, followers, following, hashtags, bio
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <label className="cursor-pointer bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition">
            ファイルを選択
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
          <button
            onClick={downloadTemplate}
            className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            テンプレートDL
          </button>
        </div>
      </div>
    </div>
  );
}
