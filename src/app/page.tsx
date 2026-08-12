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
    title: "たし算・ひき算からかけ算・わり算まで",
    body: "学年が上がるにつれて、かけ算・わり算までレベルアップしていくよ",
  },
  {
    emoji: "⏱️",
    title: "タイムアタックにちょうせん",
    body: "60びょうで なんもんとける？じぶんのベストきろくを目指そう",
  },
  {
    emoji: "👕",
    title: "きせかえで キャラをそだてよう",
    body: "もんだいに正解してポイントをためて、アイテムをゲットしよう",
  },
] as const;

export default function TopPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center gap-16 px-6 pb-20">
        <section className="flex flex-col items-center gap-6 text-center pt-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            楽しく解いて、
            <br />
            キャラクターを育てよう！
          </h1>
          <p className="max-w-md text-lg text-foreground/80">
            小学1年生の算数（たし算・ひき算）からはじめる、
            タブレット・スマホ・パソコン対応の計算ドリルアプリです。
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <CtaButton href="/signup" variant="primary">
              はじめる（新規登録）
            </CtaButton>
            <CtaButton href="/login" variant="secondary">
              ログイン
            </CtaButton>
          </div>
        </section>

        <section className="grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-3 rounded-md bg-white/60 p-6 text-center shadow-sm"
            >
              <span className="text-4xl" aria-hidden>
                {f.emoji}
              </span>
              <h2 className="text-lg font-bold text-foreground">{f.title}</h2>
              <p className="text-sm text-foreground/70">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
