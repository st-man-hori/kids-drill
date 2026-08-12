import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "新規登録（準備中） | さんすうチャレンジゲーム",
};

// TODO: 本実装。親子一緒に行う登録フロー（ID自動発行・6桁PIN設定・
// display_nicknameの自動生成）を作る。docs/architecture.md, docs/game-design.md参照。
export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-3xl" aria-hidden>
        🚧
      </p>
      <h1 className="text-2xl font-bold text-foreground">
        新規登録は準備中です
      </h1>
      <p className="max-w-sm text-foreground/70">
        もうしばらくお待ちください。
      </p>
      <Link
        href="/"
        className="rounded-full bg-brand px-8 py-3 font-bold text-brand-foreground"
      >
        トップにもどる
      </Link>
    </div>
  );
}
