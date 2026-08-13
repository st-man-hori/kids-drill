import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="flex shrink-0 items-center justify-center py-[clamp(0.5rem,2vh,1.5rem)]">
      <Link href="/">
        <Image
          src="/images/header-logo.png"
          alt="さんすうチャレンジゲーム"
          width={494}
          height={68}
          className="h-10 w-auto"
          priority
        />
      </Link>
    </header>
  );
}
