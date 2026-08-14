import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "さんすうチャレンジゲーム",
  description: "算数ドリルアプリ",
  // iPadのホーム画面から起動したときにフルスクリーンで開くための指定
  // （メインターゲットがiPadなので、マニフェストだけでなくこちらも要る）。
  // titleはアイコンの下に出る名前で、マニフェストのshort_nameと揃える
  appleWebApp: {
    capable: true,
    title: "さんすう",
    // 画面の下地が明るいクリーム色なので、ステータスバーの文字は黒（default）
    statusBarStyle: "default",
  },
};

// スクロールなしで画面に収める設計のため、実ビューポート高さ（アドレスバー分の
// 増減を含む）に追従させる。viewportFitはノッチ端末での余白確保用
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // ブラウザのUI（アドレスバー周り）を画面の下地と同じ色にする
  themeColor: "#fff9f0",
};

const RootLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        {/* next/font/google に日本語サブセットがないため、CDN経由で読み込む */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- ルートlayoutなので全ページ共通。Pages Router向けルールの誤検知 */}
        <link
          href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-dvh flex flex-col overflow-hidden overscroll-none">
        <SiteHeader />
        {children}
        <SiteFooter />
        {/* Vercel Web Analytics。Cookieを使わず訪問者を個人として追跡しない方式のため、
            子どもが対象のサービスでも使える（docs/architecture.md の公開・プライバシー方針） */}
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
