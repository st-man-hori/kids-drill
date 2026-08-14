import type { MetadataRoute } from "next";

// Webアプリマニフェスト。iPadのホーム画面に追加してフルスクリーンで
// 遊べるようにするためのもの（docs/architecture.md）。
//
// 当初 next-pwa を使う想定だったが、Next.jsの標準機能（app/manifest.ts）で
// 足りるため依存を増やしていない。

const manifest = (): MetadataRoute.Manifest => ({
  name: "さんすうチャレンジゲーム",
  // ホーム画面のアイコン下に出る名前。長いと省略されるので短くする
  short_name: "さんすう",
  description: "算数ドリルアプリ",
  // ホーム画面から起動したときは、案内ページではなく自分のページへ直行させる。
  // ログインが切れていれば /mypage 側がログイン画面へ送るので、
  // ログアウト状態でも破綻しない
  start_url: "/mypage",
  display: "standalone",
  // 画面全体の下地（--color-base）に合わせる。起動時のスプラッシュや
  // ステータスバー周りが本体と地続きに見えるようにするため
  background_color: "#fff9f0",
  theme_color: "#fff9f0",
  // 縦横どちらでも遊べる設計なので固定しない（docs/design.md）
  icons: [
    {
      src: "/images/logo_512_512.png",
      // ファイル名は512だが実体は152x152。実寸を書いておく
      sizes: "152x152",
      type: "image/png",
    },
  ],
});

export default manifest;
