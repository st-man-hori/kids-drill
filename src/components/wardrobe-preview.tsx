"use client";

import { Fragment, useMemo, useState } from "react";
import { Avatar, ItemThumb } from "@/components/avatar";
import { ItemGrid, SlotTabs } from "@/components/wardrobe-parts";
import { SLOT_LABELS, type AvatarAsset, type SlotType } from "@/lib/wardrobe";
import type { CatalogItemView } from "@/lib/wardrobe-store";

// 開発用の試着プレビュー。おみせ・きせかえと違い、解放条件やポイントを一切見ず
// カタログ全件をその場で試着できる（/dev/wardrobe-preview からのみ使う。
// 本番では出さない。src/app/dev/wardrobe-preview/page.tsx参照）

const isSameAsset = (a: AvatarAsset | undefined, b: AvatarAsset) =>
  a !== undefined && a.variant === b.variant && a.color === b.color && a.motif === b.motif;

export const WardrobePreview = ({ catalog }: { catalog: CatalogItemView[] }) => {
  const [slot, setSlot] = useState<SlotType>("hair");
  const [equipped, setEquipped] = useState<Partial<Record<SlotType, AvatarAsset>>>({});

  const items = useMemo(
    () => catalog.filter((item) => item.slotType === slot),
    [catalog, slot],
  );

  const toggle = (item: CatalogItemView) => {
    setEquipped((prev) => {
      if (isSameAsset(prev[item.slotType], item.asset)) {
        const next = { ...prev };
        delete next[item.slotType];
        return next;
      }
      return { ...prev, [item.slotType]: item.asset };
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-hidden px-4 py-3">
      <h1 className="text-lg font-bold text-foreground">
        きせかえ 試着プレビュー（開発用・全{catalog.length}件）
      </h1>

      <Avatar equipped={equipped} className="h-[24vh] w-auto shrink-0" />

      <button
        type="button"
        onClick={() => setEquipped({})}
        className="min-h-11 shrink-0 rounded-full border-2 border-brand/40 bg-white px-4 text-sm font-bold text-brand"
      >
        ぜんぶ ぬがせる
      </button>

      <SlotTabs slot={slot} onSelect={setSlot} />

      <ItemGrid isEmpty={items.length === 0} emptyMessage={`${SLOT_LABELS[slot]}は 0件`}>
        {items.map((item, index) => {
          const equippedHere = isSameAsset(equipped[item.slotType], item.asset);
          // tier(t1〜t6)が切り替わる場所が一覧で分かるよう見出しを挟む。
          // getWardrobeCatalogでtierごとにまとまる並びにしてあるのが前提
          const showTierHeading = item.asset.variant !== items[index - 1]?.asset.variant;
          return (
            // display:contentsのliで見出し(span)とbuttonを束ねる形にしていたが、
            // display:contentsは子孫へのCSSカスタムプロパティの継承を壊す
            // ブラウザがあり、Tailwindのスケール系ユーティリティ(h-12など、
            // 内部でvar(--spacing)を使うcalc())がbutton内のItemThumb(svg)に効かず
            // サムネイルが0x0に潰れる事故が起きた。見出しをliごと独立させ、
            // display:contentsを使わずに済む形にして避けている
            <Fragment key={item.id}>
              {showTierHeading && (
                <li className="col-span-full mt-1 text-xs font-bold text-foreground/50 first:mt-0">
                  {item.asset.variant}
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  className={`flex min-h-11 w-full flex-col items-center gap-1 rounded-[20px] p-2 text-center shadow-sm ${
                    equippedHere ? "bg-brand/25 ring-2 ring-brand" : "bg-white/70"
                  }`}
                >
                  <ItemThumb slot={item.slotType} asset={item.asset} className="h-12 w-auto" />
                  <span className="text-xs font-bold leading-snug text-foreground">{item.name}</span>
                  <span className="text-[11px] leading-snug text-foreground/60">
                    {item.asset.variant}
                    {item.asset.motif ? `/${item.asset.motif}` : ""}
                  </span>
                  <span className="text-[11px] leading-snug text-foreground/60">
                    {item.pricePoints === null ? "むりょう" : `${item.pricePoints}pt`} ・{" "}
                    {item.unlockLabel}
                  </span>
                </button>
              </li>
            </Fragment>
          );
        })}
      </ItemGrid>
    </div>
  );
};
