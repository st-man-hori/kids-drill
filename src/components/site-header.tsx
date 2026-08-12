import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-center py-6">
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
