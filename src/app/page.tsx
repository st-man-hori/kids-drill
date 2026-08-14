import type { Metadata } from "next";
import { auth } from "@/auth";
import { TopPageContent } from "@/components/top-page-content";

export const metadata: Metadata = {
  title: "キッズドリルゲーム | 楽しく学べる算数ドリル",
  description:
    "小学1年生から算数の計算練習ができる無料ドリルアプリ。タイムアタックやキャラクターの着せ替えで、楽しく続けられます。",
};

const TopPage = async () => {
  const session = await auth();
  return <TopPageContent isLoggedIn={Boolean(session?.user)} />;
};

export default TopPage;
