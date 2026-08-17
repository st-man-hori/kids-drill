import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LinkButton } from "@/components/link-button";
import { WardrobeShop } from "@/components/wardrobe-shop";
import { getWardrobe, grantUnlockedFreeItems } from "@/lib/wardrobe-store";
import { isOwnedStatus } from "@/lib/wardrobe";

const ShopPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // 条件を満たした無料アイテムは先に配ってしまう。おみせに「タダでもらえる
  // もの」が並んでいると、交換の場としての意味がぼやけるため
  await grantUnlockedFreeItems(session.user.id);

  const wardrobe = await getWardrobe(session.user.id);
  const forSale = wardrobe.items.filter((item) => !isOwnedStatus(item.status));

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-[clamp(0.5rem,2vh,1.25rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)]">
      <h1 className="text-[clamp(1.25rem,2.5vh+0.75rem,2rem)] font-bold text-foreground">
        おみせ
      </h1>

      <WardrobeShop pointsBalance={wardrobe.pointsBalance} items={forSale} />

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <LinkButton href="/wardrobe" variant="primary">
          きせかえへ
        </LinkButton>
        <LinkButton href="/mypage" variant="secondary">
          マイページへ もどる
        </LinkButton>
      </div>
    </div>
  );
};

export default ShopPage;
