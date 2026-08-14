import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `X-Powered-By: Next.js` レスポンスヘッダーを送らない。使っている
  // フレームワークをわざわざ知らせる必要がないため（バージョンまでは元々出ない）
  poweredByHeader: false,
};

export default nextConfig;
