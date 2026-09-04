import Link from "next/link";

export const SiteFooter = () => {
  return (
    <footer className="flex shrink-0 flex-col items-center gap-1 py-[clamp(0.375rem,1.5vh,1rem)] text-center text-xs text-foreground/50 sm:text-sm">
      <Link href="/privacy" className="underline underline-offset-2">
        プライバシーポリシー
      </Link>
      <p>© 2026 キッズドリルゲーム</p>
    </footer>
  );
};
