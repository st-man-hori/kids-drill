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
import type { ChildFace } from "@/lib/face";

// きせかえ画面。**持っているアイテムだけ**を並べる。
// まだ持っていないものはおみせ（/shop）側の担当。

export const WardrobeCloset = ({
  pointsBalance,
  items,
  face,
}: {
  pointsBalance: number;
  // 所持済みのアイテムのみ（equipped / owned）
  items: WardrobeItemView[];
  // 顔(肌の色・目・口)。着せ替えとは別画面(/face)で選ぶが、プレビューは
  // 常に本人の見た目に揃える
  face: ChildFace;
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

  // 並び順はこの画面を開いた時点でいったん固定する。着せるとサーバー側の
  // 並び(compareItems、きているものが先頭)に合わせて items が再取得され、
  // そのまま並べ替えるとタップしたアイテムが一覧の中でジャンプして見えて
  // しまう。次にこの画面を開き直したとき(ページ遷移でコンポーネントが
  // 作り直されたとき)にだけ新しい並びに切り替わればよい
  const [initialOrder] = useState(
    () => new Map(items.map((item, index) => [item.id, index])),
  );

  const slotItems = useMemo(() => {
    return items
      .filter((item) => item.slotType === slot)
      .slice()
      .sort((a, b) => (initialOrder.get(a.id) ?? items.length) - (initialOrder.get(b.id) ?? items.length));
  }, [items, slot, initialOrder]);

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
    <div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center gap-[clamp(0.375rem,1.5vh,1.25rem)]">
      <PointsBadge points={pointsBalance} />

      {/* アイテム一覧の取り分を確保するため、着せ替え前後を見比べられる
          範囲でできるだけ小さく抑える（大きすぎるとアイテム一覧が
          画面下に押し出されて何を持っているか分かりづらくなるため） */}
      <Avatar
        equipped={equipped}
        skinTone={face.skinTone}
        eyeStyle={face.eyeStyle}
        mouthStyle={face.mouthStyle}
        className="h-[clamp(3.5rem,10vh,5rem)] w-auto shrink-0 sm:h-[clamp(5rem,14vh,8rem)]"
      />

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
