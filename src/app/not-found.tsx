import type { Metadata } from "next";
import { LinkButton } from "@/components/link-button";

// Next.jsはnot-found.tsxに対してステータス404と`noindex`のrobotsメタタグを
// 自動で付与するため、ここではtitleだけ指定すればよい
export const metadata: Metadata = {
  title: "ページが みつかりません",
};

const NotFound = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(1rem,4vh,2rem)] overflow-y-auto px-6 text-center">
      <p className="text-[clamp(3rem,8vh,5rem)] font-bold leading-none text-brand">?</p>
      <h1 className="text-[clamp(1.25rem,2.5vh+0.75rem,2rem)] font-bold text-foreground">
        ページが みつからなかったよ
      </h1>
      <p className="max-w-md text-[clamp(0.875rem,1.5vh+0.5rem,1.125rem)] text-foreground/80">
        アドレスが まちがっているか、
        <br />
        ページが なくなってしまったみたい。
      </p>
      <LinkButton href="/" variant="primary">
        トップへ もどる
      </LinkButton>
    </div>
  );
};

export default NotFound;
