# AGENTS.md

このリポジトリで作業するAIコーディングツール（Claude Code、Cursor、GitHub Copilot、Codexなど）向けのガイダンスです。

## プロジェクト概要

kids-drillは学習Webアプリ。小学1年生のたし算・ひき算から始め、将来的に学年（小1〜小6）・教科（国語など）を拡張予定。タブレット・スマホファースト（メインターゲットはiPad）、PCにも対応。リポジトリはパブリック公開予定。

設計の詳細・判断理由は`docs/`が一次情報源。**このファイルには詳細を書かない**（`docs/`との二重管理を避けるため）。アーキテクチャに関わる変更をする前に該当するdocsを読み、判断が変わったらdocs側を更新すること。

- `docs/architecture.md` — 技術スタック・ホスティング・認証設計
- `docs/game-design.md` — 難易度カーブ・モード設計・報酬ループ・ランキング設計
- `docs/data-model.md` — DBスキーマとテーブル分割の理由
- `docs/design.md` — デザインの方向性・トークン（色・角丸・フォント・モーション）・AIへのデザイン指示の型

## 現在の状態

アプリケーションコードはまだ存在せず、現時点では`docs/`のみ。プロジェクトがスキャフォールドされたら、このファイルに実際のbuild/lint/test/devコマンドを追記すること。

## 技術スタック（要約。詳細は`docs/architecture.md`）

Next.js (App Router) + TypeScript / Tailwind CSS / Framer Motion / Vercel / Neon Postgres (Drizzle ORM) / NextAuth Credentials Provider

## 導入済みSkills

`skills` CLI（[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)、Claude Code純正のプラグイン機構とは別のサードパーティ製ツール）で取得し、`.claude/skills/`に実体を置いている（現時点でClaude Code以外のツールを併用していないため、ベンダー非依存ディレクトリ経由にはせず直接配置）。

**注意**: `skills-lock.json`（リポジトリ直下）は導入時の取得元の記録として残しているが、この配置に変更したことで`npx skills update`等による自動更新の対象ではなくなった。更新したい場合は該当リポジトリから手動で取得し直すこと。

- `vercel-react-best-practices` — React/Next.jsのパフォーマンス最適化ガイドライン（Vercel Engineering製）
- `ui-ux-pro-max` — UI/UXデザインのスタイル・配色・フォント・アニメーションなどの参照データベース
- `find-skills` — 自然言語でSkillsを検索するためのツール

## 作業時の注意

- 認証・データモデル・ゲーム性まわりで「なぜこうなっているのか」と思う設計（例: 親アカウント層がない、正規化されたテーブル分割になっている、など）は大抵意図的な決定。変更前に該当docsで経緯を確認する
- 対象ユーザー（子ども）を特定できる実在の個人情報や、APIキー等の秘密情報はコード/ドキュメント/コミットに含めない（詳細: `docs/architecture.md`の「公開・プライバシー方針」）
- UI/コンポーネントを実装・生成する際は`docs/design.md`のトークン（色・角丸・フォント・モーション）とプロンプトの型に従う
