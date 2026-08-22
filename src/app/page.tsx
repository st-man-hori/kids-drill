import type { Metadata } from "next";
import { auth } from "@/auth";
import { TopPageContent } from "@/components/top-page-content";

export const metadata: Metadata = {
  title: "キッズドリルゲーム | 楽しく学べる小学生の学習ドリル",
  description:
    "小学1年生から楽しく学べる無料の学習ドリルアプリ。タイムアタックやキャラクターの着せ替えで、楽しく続けられます。",
};

const TopPage = async () => {
  const session = await auth();
  return <TopPageContent isLoggedIn={Boolean(session?.user)} />;
};

export default TopPage;
