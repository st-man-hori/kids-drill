import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/logout-button";

export const SiteHeaderContent = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 px-4 py-[clamp(0.5rem,2vh,1.5rem)]">
      <Link href="/" className="shrink-0">
        <Image
          src="/images/header-logo.png"
          alt="さんすうチャレンジゲーム"
          width={494}
          height={68}
          className="h-8 w-auto sm:h-10"
          priority
        />
      </Link>
      {isLoggedIn && <LogoutButton size="compact" />}
    </header>
  );
};
