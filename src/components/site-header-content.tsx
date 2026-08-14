import Link from "next/link";
import Image from "next/image";

// ヘッダーの右側は「今いける場所」への案内にする。ログアウトは常に出しておく
// ものではなく、マイページに置く（誤って押されると遊びが中断されるため）。

export const SiteHeaderContent = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 px-4 py-[clamp(0.5rem,2vh,1.5rem)]">
      <Link href="/" className="shrink-0">
        <Image
          src="/images/header-logo.png"
          alt="キッズドリルゲーム"
          width={494}
          height={68}
          className="h-8 w-auto sm:h-10"
          priority
        />
      </Link>
      <Link
        href={isLoggedIn ? "/mypage" : "/login"}
        // min-h-11 は 44px。タッチ領域の最小サイズを下回らせない（docs/design.md）
        className="flex min-h-11 shrink-0 items-center rounded-full border-2 border-brand bg-white px-[clamp(0.875rem,3vw,1.5rem)] text-[clamp(0.8125rem,1vh+0.4rem,1.125rem)] font-bold text-brand"
      >
        {isLoggedIn ? "マイページ" : "ログイン"}
      </Link>
    </header>
  );
};
