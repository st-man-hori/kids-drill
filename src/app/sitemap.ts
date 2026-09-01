import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// ログイン不要で内容が完結する公開ページのみを載せる（robots.tsと対）。
// lastModifiedは実際の更新日を追跡していないため、事実と異なる値を
// 書くくらいなら省略する
const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: SITE_URL,
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    url: `${SITE_URL}/signup`,
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/login`,
    changeFrequency: "monthly",
    priority: 0.5,
  },
];

export default sitemap;
