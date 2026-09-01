import type { Metadata } from "next";
import { openGraphDefaults } from "@/lib/site";

// page.tsxは"use client"のためmetadataをexportできない。そのため
// サーバーコンポーネントであるこのlayout.tsxに持たせている
export const metadata: Metadata = {
  title: "ログイン",
  description:
    "キッズドリルゲームにログインして、算数のたしざん・ひきざんやかんじの読み方クイズに挑戦しよう。IDとひみつのばんごうでログインできます。",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    ...openGraphDefaults,
    url: "/login",
  },
};

const LoginLayout = ({ children }: LayoutProps<"/login">) => children;

export default LoginLayout;
