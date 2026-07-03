# instagram-analyzer

## 概要
Instagram競合アカウント分析ツール。アカウントデータを手入力/CSVで取り込み、エンゲージメント率ランキング・投稿パターン分析・アカウント比較・ハッシュタグ提案・コンテンツ案をダッシュボード表示する（Instagram API制限のため手入力版）。

## 技術スタック
- Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS 4
- グラフ描画: Recharts
- データ保存: ブラウザ localStorage（DB・外部API・サーバーサイド処理なし）
- CSV入出力・JSONバックアップ/リストア機能あり（`src/lib/`）

## 起動方法
```bash
cd ~/projects/instagram-analyzer
npm run dev   # http://localhost:3000
```

## デプロイ先
なし（ローカル利用のみ）

## 固有の注意
- Next.js 16 は破壊的変更が多い。コーディング前に `AGENTS.md` の指示どおり `node_modules/next/dist/docs/` の該当ガイドを参照すること（AGENTS.md は削除しない）
- データは全て localStorage 保存のため、ブラウザを変えるとデータは引き継がれない（バックアップ機能でJSONエクスポート可）
