"use client";

import { useState, useTransition } from "react";
import {
  ItemGrid,
  ItemTile,
  PointsBadge,
  SlotTabs,
  StatusMessage,
} from "@/components/wardrobe-parts";
import { buyWardrobeItem } from "@/app/wardrobe/actions";
import { SLOT_LABELS, type SlotType } from "@/lib/wardrobe";
import type { WardrobeItemView } from "@/lib/wardrobe-store";

// おみせ。**まだ持っていないアイテムだけ**を並べる。
// 買ったものはきせかえ（/wardrobe）側に移る。

const NOTE: Record<string, string> = {
  tooExpensive: "ポイントが たりないよ",
};

export const WardrobeShop = ({
  pointsBalance,
  items,
}: {
  pointsBalance: number;
  // 未所持のアイテムのみ（affordable / tooExpensive / locked）
  items: WardrobeItemView[];
}) => {
  const [slot, setSlot] = useState<SlotType>("hair");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  // 買えたものはその場で一覧から消す。サーバーの再取得を待つと
  // 買ったのに残っているように見えてしまう
  const [bought, setBought] = useState<string[]>([]);

  const slotItems = items.filter(
    (item) => item.slotType === slot && !bought.includes(item.id),
  );

  const handleTap = (item: WardrobeItemView) => {
    if (pending || item.status === "locked") return;

    if (item.status === "tooExpensive") {
      setMessage("ポイントを ためてから また きてね");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await buyWardrobeItem(item.id);
      if (result.ok) {
        setBought((current) => [...current, item.id]);
        setMessage(`${item.name}を てにいれた！ きせかえで きてみよう`);
      } else if (result.reason === "notEnoughPoints") {
        setMessage("ポイントが たりなかったよ");
      } else {
        setMessage("うまく こうかんできなかったよ。もういちど ためしてね");
      }
    });
  };

  return (
    <div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center gap-[clamp(0.5rem,2vh,1.25rem)]">
      <PointsBadge points={pointsBalance} />

      <StatusMessage message={message} />

      <SlotTabs slot={slot} onSelect={setSlot} />

      <ItemGrid
        isEmpty={slotItems.length === 0}
        emptyMessage={`${SLOT_LABELS[slot]}は ぜんぶ てにいれたよ！`}
      >
        {slotItems.map((item) => (
          <li key={item.id}>
            <ItemTile
              item={item}
              note={
                item.status === "locked"
                  ? item.unlockLabel
                  : item.status === "affordable" && item.pricePoints !== null
                    ? `${item.pricePoints} ポイント`
                    : (NOTE[item.status] ?? "")
              }
              disabled={item.status === "locked" || pending}
              highlighted={false}
              onTap={() => handleTap(item)}
            />
          </li>
        ))}
      </ItemGrid>
    </div>
  );
};
