import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LinkButton } from "@/components/link-button";
import { WardrobeCloset } from "@/components/wardrobe-closet";
import { getWardrobe, grantUnlockedFreeItems } from "@/lib/wardrobe-store";
import { isOwnedStatus } from "@/lib/wardrobe";

const WardrobePage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // 練習の結果画面でも配っているが、ここでも配る。まだ一度も練習していない
  // 子どもには結果画面を通っておらず、最初から使えるアイテム（always）すら
  // 手元に無い状態になるため
  await grantUnlockedFreeItems(session.user.id);

  const wardrobe = await getWardrobe(session.user.id);
  // きせかえに並べるのは持っているものだけ。まだ持っていないものはおみせ側
  const owned = wardrobe.items.filter((item) => isOwnedStatus(item.status));

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-[clamp(0.5rem,2vh,1.25rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)]">
      <h1 className="text-[clamp(1.25rem,2.5vh+0.75rem,2rem)] font-bold text-foreground">
        きせかえ
      </h1>

      <WardrobeCloset pointsBalance={wardrobe.pointsBalance} items={owned} />

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <LinkButton href="/shop" variant="primary">
          おみせへ
        </LinkButton>
        <LinkButton href="/mypage" variant="secondary">
          マイページへ もどる
        </LinkButton>
      </div>
    </div>
  );
};

export default WardrobePage;
