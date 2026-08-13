import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/logout-button";

export const SiteHeaderContent = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  return (
    <header className="relative flex shrink-0 items-center justify-center px-4 py-[clamp(0.5rem,2vh,1.5rem)]">
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
      {isLoggedIn && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <LogoutButton size="compact" />
        </div>
      )}
    </header>
  );
};
