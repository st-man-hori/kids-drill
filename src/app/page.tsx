import type { Metadata } from "next";
import { auth } from "@/auth";
import { TopPageContent } from "@/components/top-page-content";
import { SITE_NAME, SITE_URL, openGraphDefaults } from "@/lib/site";

const title = "キッズドリルゲーム | 楽しく学べる小学生の学習ドリル";
const description =
  "小学1年生から楽しく学べる無料の学習ドリルアプリ。算数のたしざん、かんじの読み方クイズ、タイムアタックやキャラクターの着せ替えで、楽しく続けられます。";

export const metadata: Metadata = {
  // すでにブランド名を含む見出しなので、テンプレート（`%s | ...`）は使わず
  // absoluteでそのまま出す
  title: { absolute: title },
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    ...openGraphDefaults,
    url: "/",
  },
};

// アプリの内容を検索エンジンに構造化データとして伝えるための補足。
// サイト名自体の構造化データ（WebSite）はlayout.tsxで全ページ共通に出しているため、
// こちらはアプリの説明にあたるWebApplicationを最も関連の深いトップページにのみ置く
const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  inLanguage: "ja",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
};

const TopPage = async () => {
  const session = await auth();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
      />
      <TopPageContent isLoggedIn={Boolean(session?.user)} />
    </>
  );
};

export default TopPage;
