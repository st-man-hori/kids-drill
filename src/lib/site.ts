// サイト全体で共有するSEO関連の定数。robots.ts・sitemap.ts・layout.tsx・
// opengraph-image.tsxなど複数箇所で同じ値（サイト名・URL）を参照するため、
// 値のズレを防ぐ目的で一箇所にまとめている。

export const SITE_NAME = "キッズドリルゲーム";
export const SITE_URL = "https://kids-drill-game.st-man.com";

// openGraphは階層間で継承されず、定義したレベルで丸ごと置き換わる
// （Next.jsのmetadata仕様）ため、ページごとにurlだけ変えてこれを展開する。
// imagesを明示しているのは、ページ側でopenGraphを上書きすると
// app/opengraph-image.tsxの自動付与が効かなくなる（置き換えで消える）ため
export const openGraphDefaults = {
  siteName: SITE_NAME,
  locale: "ja_JP",
  type: "website" as const,
  images: ["/opengraph-image"],
};
