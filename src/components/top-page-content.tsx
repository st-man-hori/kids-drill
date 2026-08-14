import type { ReactNode } from "react";
import { CtaButton } from "@/components/cta-button";

// 「機能を3つ並べる」のではなく、報酬ループ（docs/game-design.md）そのものを
// 順番として見せる。中身はアプリの実物と同じ見た目の断片にしてあり、
// 絵文字や汎用アイコンは使わない（docs/design.md「避けること」）。

const Step = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-1 flex-col items-center gap-[clamp(0.25rem,1vh,0.625rem)]">
    <div
      className="flex h-[clamp(3rem,7vh,4.5rem)] w-full items-center justify-center rounded-[20px] bg-white/70 shadow-sm"
      aria-hidden
    >
      {children}
    </div>
    <p className="text-[clamp(0.6875rem,1vh+0.35rem,1rem)] font-bold leading-snug text-foreground">
      {label}
    </p>
  </div>
);

// 3枚のカードではなく「順番」であることを示す連結子。角は丸める
const Arrow = () => (
  <svg
    viewBox="0 0 12 20"
    className="mt-[clamp(1rem,3vh,2rem)] h-[clamp(0.75rem,1.5vh,1.25rem)] w-3 shrink-0 text-foreground/25"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M2 2 L10 10 L2 18" />
  </svg>
);

export const TopPageContent = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <main className="flex flex-1 flex-col items-center justify-center gap-[clamp(1rem,4vh,2.5rem)] px-6 py-[clamp(0.5rem,2vh,1rem)]">
        <section className="flex flex-col items-center gap-[clamp(0.75rem,2vh,1.5rem)] text-center">
          <h1 className="text-[clamp(1.375rem,3vh+1rem,2.25rem)] font-bold leading-tight text-foreground">
            たのしくといて、
            <br />
            キャラクターをそだてよう！
          </h1>
          <p className="max-w-md text-[clamp(0.875rem,1.5vh+0.5rem,1.125rem)] text-foreground/80">
            しょうがく1ねんせいの さんすう（たしざん・ひきざん）から
            はじめられる、けいさんれんしゅうアプリです。
            タブレット・スマホ・パソコンで つかえます。
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {isLoggedIn ? (
              <CtaButton href="/mypage" variant="primary">
                マイページへ
              </CtaButton>
            ) : (
              <>
                <CtaButton href="/signup" variant="primary">
                  はじめる
                </CtaButton>
                <CtaButton href="/login" variant="secondary">
                  ログイン
                </CtaButton>
              </>
            )}
          </div>
        </section>

        <section className="flex w-full max-w-lg flex-col items-center gap-[clamp(0.5rem,1.5vh,1rem)]">
          <h2 className="text-[clamp(0.8125rem,1.2vh+0.45rem,1.125rem)] font-bold text-foreground/70">
            こんなふうに あそぶよ
          </h2>
          <div className="flex w-full items-start justify-center gap-[clamp(0.375rem,1.5vw,1rem)] text-center">
            <Step label="もんだいを といて">
              <span className="text-[clamp(0.9375rem,1.8vh+0.4rem,1.5rem)] font-bold tracking-wide text-foreground">
                8 ＋ 5
              </span>
            </Step>
            <Arrow />
            <Step label="ポイントを ためて">
              <span className="rounded-full bg-success/25 px-[clamp(0.5rem,1.5vw,0.875rem)] py-1 text-[clamp(0.8125rem,1.5vh+0.35rem,1.25rem)] font-bold text-foreground">
                +130
              </span>
            </Step>
            <Arrow />
            <Step label="きせかえアイテムを あつめる">
              {/* アバターの見立て。汎用アイコンではなく、丸と角丸だけで作る */}
              <span className="flex flex-col items-center gap-[2px]">
                <span className="h-[clamp(0.5rem,1.1vh,0.75rem)] w-[clamp(0.5rem,1.1vh,0.75rem)] rounded-full bg-brand" />
                <span className="h-[clamp(0.625rem,1.4vh,1rem)] w-[clamp(1rem,2.2vh,1.5rem)] rounded-t-full rounded-b-[6px] bg-brand/60" />
              </span>
            </Step>
          </div>
        </section>
      </main>
    </div>
  );
};
