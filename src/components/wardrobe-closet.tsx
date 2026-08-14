"use client";

import { useMemo, useState, useTransition } from "react";
import { Avatar } from "@/components/avatar";
import {
  ItemGrid,
  ItemTile,
  PointsBadge,
  SlotTabs,
  StatusMessage,
} from "@/components/wardrobe-parts";
import { wearWardrobeItem } from "@/app/wardrobe/actions";
import { SLOT_LABELS, type AvatarAsset, type SlotType } from "@/lib/wardrobe";
import type { WardrobeItemView } from "@/lib/wardrobe-store";

// きせかえ画面。**持っているアイテムだけ**を並べる。
// まだ持っていないものはおみせ（/shop）側の担当。

export const WardrobeCloset = ({
  pointsBalance,
  items,
}: {
  pointsBalance: number;
  // 所持済みのアイテムのみ（equipped / owned）
  items: WardrobeItemView[];
}) => {
  const [slot, setSlot] = useState<SlotType>("hair");
  const [pending, startTransition] = useTransition();
  // サーバーの再取得を待たずに見た目を変えるための、その場の着せ替え状態。
  // 子どもは「押した瞬間に変わる」ことを期待するため
  const [preview, setPreview] = useState<Partial<Record<SlotType, AvatarAsset>>>({});
  const [message, setMessage] = useState<string | null>(null);

  const equipped = useMemo(() => {
    const fromServer: Partial<Record<SlotType, AvatarAsset>> = {};
    for (const item of items) {
      if (item.status === "equipped") fromServer[item.slotType] = item.asset;
    }
    return { ...fromServer, ...preview };
  }, [items, preview]);

  const slotItems = items.filter((item) => item.slotType === slot);

  const handleTap = (item: WardrobeItemView) => {
    if (pending || item.status === "equipped") return;

    setMessage(null);
    setPreview((current) => ({ ...current, [item.slotType]: item.asset }));

    startTransition(async () => {
      const result = await wearWardrobeItem(item.id);
      if (!result.ok) {
        // サーバーが断ったら見た目も戻す
        setPreview((current) => {
          const next = { ...current };
          delete next[item.slotType];
          return next;
        });
        setMessage("うまく きられなかったよ。もういちど ためしてね");
      }
    });
  };

  return (
    <div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center gap-[clamp(0.5rem,2vh,1.25rem)]">
      <PointsBadge points={pointsBalance} />

      <Avatar equipped={equipped} className="h-[clamp(7rem,22vh,12rem)] w-auto shrink-0" />

      <StatusMessage message={message} />

      <SlotTabs slot={slot} onSelect={setSlot} />

      <ItemGrid
        isEmpty={slotItems.length === 0}
        emptyMessage={`まだ ${SLOT_LABELS[slot]}を もっていないよ。おみせを のぞいてみよう`}
      >
        {slotItems.map((item) => (
          <li key={item.id}>
            <ItemTile
              item={item}
              note={item.status === "equipped" ? "きているよ" : "タップで きられるよ"}
              disabled={item.status === "equipped" || pending}
              highlighted={item.status === "equipped"}
              onTap={() => handleTap(item)}
            />
          </li>
        ))}
      </ItemGrid>
    </div>
  );
};
