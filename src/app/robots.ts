import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// 検索エンジンにクロールさせてよいのはログイン不要で内容が完結する
// 公開ページ（トップ・ログイン・新規登録）のみ。それ以外は未ログイン時
// /loginへredirectするだけの画面か、ログイン後の個人向け画面なので、
// クローラーにとって意味のあるコンテンツが無い（sitemap.tsにも含めていない）
const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    allow: ["/", "/login", "/signup"],
    disallow: [
      "/mypage",
      "/ranking",
      "/shop",
      "/wardrobe",
      "/face",
      "/practice/",
      "/time-attack",
      "/dev/",
      "/api/",
    ],
  },
  sitemap: `${SITE_URL}/sitemap.xml`,
});

export default robots;
