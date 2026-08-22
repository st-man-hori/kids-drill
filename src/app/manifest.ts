import type { MetadataRoute } from "next";

// Webアプリマニフェスト。iPadのホーム画面に追加してフルスクリーンで
// 遊べるようにするためのもの（docs/architecture.md）。
//
// 当初 next-pwa を使う想定だったが、Next.jsの標準機能（app/manifest.ts）で
// 足りるため依存を増やしていない。

const manifest = (): MetadataRoute.Manifest => ({
  name: "キッズドリルゲーム",
  // ホーム画面のアイコン下に出る名前。長いと省略されるので短くする
  short_name: "キッズドリル",
  description: "小学生向け学習ドリルアプリ",
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
      sizes: "512x512",
      type: "image/png",
    },
  ],
});

export default manifest;
