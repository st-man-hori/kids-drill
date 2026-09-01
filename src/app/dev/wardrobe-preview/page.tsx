import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WardrobePreview } from "@/components/wardrobe-preview";
import { getWardrobeCatalog } from "@/lib/wardrobe-store";

// 開発用: 着せ替えカタログ全件をログイン不要・解放条件無視で試着できるページ。
// SVGの見た目を実装しながら確認するためのもので、子ども向けの導線には一切出さない。
// 本番でアクセスされても中身を返さない
export const metadata: Metadata = {
  title: "きせかえプレビュー（開発用）",
  robots: { index: false, follow: false },
};

const WardrobePreviewPage = async () => {
  if (process.env.NODE_ENV === "production") notFound();

  const catalog = await getWardrobeCatalog();
  return <WardrobePreview catalog={catalog} />;
};

export default WardrobePreviewPage;
