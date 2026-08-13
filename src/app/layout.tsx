import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "さんすうチャレンジゲーム",
  description: "算数ドリルアプリ",
};

// スクロールなしで画面に収める設計のため、実ビューポート高さ（アドレスバー分の
// 増減を含む）に追従させる。viewportFitはノッチ端末での余白確保用
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      </body>
    </html>
  );
};

export default RootLayout;
