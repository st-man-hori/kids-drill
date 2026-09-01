import type { Metadata } from "next";
import { openGraphDefaults } from "@/lib/site";

// page.tsxは"use client"のためmetadataをexportできない。そのため
// サーバーコンポーネントであるこのlayout.tsxに持たせている
export const metadata: Metadata = {
  title: "新規登録",
  description:
    "キッズドリルゲームの新規登録はかんたん・無料。IDとひみつのばんごうがその場で発行されるので、親子ですぐに算数やかんじの学習を始められます。",
  alternates: {
    canonical: "/signup",
  },
  openGraph: {
    ...openGraphDefaults,
    url: "/signup",
  },
};

const SignupLayout = ({ children }: LayoutProps<"/signup">) => children;

export default SignupLayout;
