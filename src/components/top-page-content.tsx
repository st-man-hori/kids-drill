import type { ReactNode } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/link-button";

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

// 教科・あそびかたの紹介カード。未ログイン時のみ表示するセクションで使う
// （下のFeatureSection参照）。見出し・本文とも通常の漢字混じり文でよい
// （docs/design.md「文言（漢字の扱い）」の例外。検索した保護者が読む文章であり、
// 子どもが直接操作するプレイ画面のUIではないため）
const FeatureCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1.5 rounded-[20px] bg-white/70 p-[clamp(1rem,3vw,1.375rem)] text-left shadow-sm">
    <h3 className="text-[clamp(0.9375rem,1.3vh+0.5rem,1.125rem)] font-bold text-brand">
      {title}
    </h3>
    <p className="text-[clamp(0.8125rem,1.1vh+0.4rem,0.9375rem)] leading-relaxed text-foreground/80">
      {children}
    </p>
  </div>
);

const FeatureSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex w-full max-w-2xl flex-col items-center gap-[clamp(0.75rem,2vh,1.25rem)]">
    <h2 className="text-[clamp(1.0625rem,1.6vh+0.6rem,1.375rem)] font-bold text-foreground">
      {title}
    </h2>
    {children}
  </section>
);

export const TopPageContent = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <main className="flex flex-1 flex-col items-center gap-[clamp(1.5rem,5vh,3rem)] px-6 py-[clamp(0.5rem,2vh,1rem)]">
        <section className="flex flex-col items-center gap-[clamp(0.75rem,2vh,1.5rem)] pt-[clamp(0.5rem,4vh,2rem)] text-center">
          <h1 className="text-[clamp(1.375rem,3vh+1rem,2.25rem)] font-bold leading-tight text-foreground">
            たのしくといて、
            <br />
            キャラクターをそだてよう！
          </h1>
          <p className="max-w-md text-[clamp(0.875rem,1.5vh+0.5rem,1.125rem)] text-foreground/80">
            しょうがく1ねんせいから はじめられる、
            たのしい がくしゅうアプリです。
            タブレット・スマホ・パソコンで つかえます。
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {isLoggedIn ? (
              <LinkButton href="/mypage" variant="primary">
                マイページへ
              </LinkButton>
            ) : (
              <>
                <LinkButton href="/signup" variant="primary">
                  はじめる
                </LinkButton>
                <LinkButton href="/login" variant="secondary">
                  ログイン
                </LinkButton>
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

        {/* 以下は未ログイン時のみ表示する紹介コンテンツ。ログイン後の子どもが
            毎回目にする必要はなく、スクロールなし方針（docs/design.md）で
            守りたいのはプレイ中の画面なので、検索経由の訪問者・検討中の
            保護者に向けたこの範囲だけスクロールを許容する */}
        {!isLoggedIn && (
          <>
            <FeatureSection title="対応している教科・学年">
              <div className="grid w-full gap-3 sm:grid-cols-2">
                <FeatureCard title="算数（たしざん）">
                  小学1年生から始められます。くり上がりの有無を軸にレベルが分かれていて、正答率に応じて自動で難易度が上下するので、レベル選びに悩む必要がありません。
                </FeatureCard>
                <FeatureCard title="かんじの読み方クイズ">
                  小学1年生の配当漢字から、まぎらわしい選択肢を交えた4択クイズを出題します。かな入力が難しい低学年でも答えられます。
                </FeatureCard>
              </div>
            </FeatureSection>

            <FeatureSection title="3つのあそびかた">
              <div className="grid w-full gap-3 sm:grid-cols-3">
                <FeatureCard title="れんしゅうモード">
                  10問1セットで、自分のペースで練習できます。正解するたびにポイントがたまり、着せ替えアイテムと交換できます。
                </FeatureCard>
                <FeatureCard title="タイムアタックモード">
                  制限時間60秒で何問解けるかに挑戦するモードです。ランキングに参加できるのはこのモードのみです。
                </FeatureCard>
                <FeatureCard title="ランキング">
                  学年別・週間リセットなので、あとから始めても上位を狙えます。順位は数値やパーセントではなく、やさしい言葉で表示します。
                </FeatureCard>
              </div>
            </FeatureSection>

            <FeatureSection title="保護者の方へ">
              <ul className="w-full max-w-md list-disc space-y-2 pl-5 text-left text-[clamp(0.8125rem,1.1vh+0.4rem,0.9375rem)] leading-relaxed text-foreground/80">
                <li>完全無料・広告なしで利用できます。</li>
                <li>
                  ログインに名前やメールアドレスは不要です。IDとひみつの6桁の番号だけで始められます。
                </li>
                <li>アクセス解析にCookieを使っておらず、お子さまの行動を個人として追跡しません。</li>
                <li>タブレット・スマートフォン・パソコンに対応しています。</li>
                <li>
                  詳しくは
                  <Link href="/privacy" className="underline underline-offset-2">
                    プライバシーポリシー
                  </Link>
                  をご覧ください。
                </li>
              </ul>
            </FeatureSection>

            <div className="flex flex-col items-center gap-3 pb-[clamp(1rem,3vh,2rem)] sm:flex-row">
              <LinkButton href="/signup" variant="primary">
                はじめる
              </LinkButton>
              <LinkButton href="/login" variant="secondary">
                ログイン
              </LinkButton>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
