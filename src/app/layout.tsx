import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_NAME, SITE_URL, openGraphDefaults } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // ページ側がtitleに文字列だけを指定すると`${その文字列} | キッズドリルゲーム`に
  // なる。トップページのようにブランド名込みの見出しをそのまま出したい場合は
  // title: { absolute: "..." } でこのテンプレートを無効化できる
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "小学生向け学習ドリルアプリ",
  // Google検索結果のサイト名表示はog:site_nameよりJSON-LDのWebSite構造化データが
  // 優先されるため、下のscriptタグと合わせて指定している
  openGraph: {
    ...openGraphDefaults,
    url: SITE_URL,
  },
  // カード画像はapp/opengraph-image.tsxが全ページ共通のデフォルトとして自動で
  // 付与される。titleやdescriptionもopenGraphから自動で継承されるため、
  // ページ側では基本的にurlの上書きだけで足りる
  twitter: {
    card: "summary_large_image",
  },
  // iPadのホーム画面から起動したときにフルスクリーンで開くための指定
  // （メインターゲットがiPadなので、マニフェストだけでなくこちらも要る）。
  // titleはアイコンの下に出る名前で、マニフェストのshort_nameと揃える
  appleWebApp: {
    capable: true,
    title: "キッズドリル",
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

// Google検索結果のサイト名表示で最優先される情報源。titleタグやog:site_nameだけだと
// ドメイン名がそのまま表示されてしまうことがあるための保険
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
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
