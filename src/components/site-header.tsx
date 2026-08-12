import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-center py-6">
      {/* ロゴは仮。実データができたら差し替える */}
      <Link
        href="/"
        className="rounded-full bg-brand px-5 py-2 text-lg font-bold text-brand-foreground"
      >
        さんすうチャレンジゲーム
      </Link>
    </header>
  );
}
