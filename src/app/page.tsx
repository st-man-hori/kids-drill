import type { Metadata } from "next";
import { CtaButton } from "@/components/cta-button";

export const metadata: Metadata = {
  title: "さんすうチャレンジゲーム | 楽しく学べる算数ドリル",
  description:
    "小学1年生から算数の計算練習ができる無料ドリルアプリ。タイムアタックやキャラクターの着せ替えで、楽しく続けられます。",
};

const FEATURES = [
  {
    emoji: "🔢",
    title: "たしざん・ひきざんから かけざん・わりざんまで",
    body: "がくねんが あがるにつれて、かけざん・わりざんまで レベルアップしていくよ",
  },
  {
    emoji: "⏱️",
    title: "タイムアタックにちょうせん",
    body: "60びょうで なんもんとける？じぶんのベストきろくを めざそう",
  },
  {
    emoji: "👕",
    title: "きせかえで キャラをそだてよう",
    body: "もんだいに せいかいして ポイントをためて、アイテムをゲットしよう",
  },
] as const;

export default function TopPage() {
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
            <CtaButton href="/signup" variant="primary">
              はじめる
            </CtaButton>
            <CtaButton href="/login" variant="secondary">
              ログイン
            </CtaButton>
          </div>
        </section>

        <section className="grid w-full max-w-4xl grid-cols-3 gap-[clamp(0.5rem,1.5vw,1.5rem)]">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-[clamp(0.25rem,1vh,0.75rem)] rounded-md bg-white/60 p-[clamp(0.5rem,1.5vh,1.5rem)] text-center shadow-sm"
            >
              <span className="text-[clamp(1.25rem,2.5vh+0.5rem,2.25rem)]" aria-hidden>
                {f.emoji}
              </span>
              <h2 className="text-[clamp(0.6875rem,1vh+0.4rem,1.125rem)] font-bold leading-snug text-foreground">
                {f.title}
              </h2>
              <p className="hidden text-sm text-foreground/70 sm:block">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
