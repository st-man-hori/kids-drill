"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ItemThumb } from "@/components/avatar";
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
//
// タップ即購入だとポイントが意図せず減ってしまう（issue #7）ため、
// affordableなアイテムは確認ダイアログを挟んでから購入する

const NOTE: Record<string, string> = {
  tooExpensive: "ポイントが たりないよ",
};

// ポイント帯(300まで/301から700...)で絞り込んでいたが、価格はティア内でも
// 段階的に上げている(docs/game-design.md「アイテムの階層」)ため、価格帯と
// ティアの境目が一致せず1つの帯に複数ティアが混ざって分かりにくかった。
// 見た目の作り込み度(docs/game-design.md「ティア別SVG制作テンプレート」)と
// 直結するティア(T1〜T6)そのもので絞り込む方が、子どもにも「つぎのランク」
// として分かりやすい
type TierFilter = "all" | "t1" | "t2" | "t3" | "t4" | "t5" | "t6";

const TIER_FILTERS: { key: TierFilter; label: string }[] = [
  { key: "all", label: "ぜんぶ" },
  { key: "t1", label: "T1" },
  { key: "t2", label: "T2" },
  { key: "t3", label: "T3" },
  { key: "t4", label: "T4" },
  { key: "t5", label: "T5" },
  { key: "t6", label: "T6" },
];

const matchesTierFilter = (variant: string, tier: TierFilter): boolean =>
  tier === "all" || variant === tier;

// おみせ専用の確認ダイアログ。きせかえ画面の「着る」はポイントを使わず
// 何度でも着せ直せる操作なので確認を挟まない（→wardrobe-closet.tsx）が、
// 購入はポイントを失う・元に戻せない操作なので必ず一段挟む
const PurchaseConfirmDialog = ({
  item,
  onConfirm,
  onCancel,
}: {
  item: WardrobeItemView;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-6"
      onClick={onCancel}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="こうかんの かくにん"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-xs flex-col items-center gap-3 rounded-[20px] bg-white p-6 text-center shadow-sm"
      >
        <ItemThumb
          slot={item.slotType}
          asset={item.asset}
          className="h-[clamp(3rem,10vh,5rem)] w-auto"
        />
        <p className="text-lg font-bold text-foreground">{item.name}</p>
        <p className="font-bold text-foreground/80">
          {item.pricePoints} ポイントで こうかんするよ。いい？
        </p>
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            className="min-h-11 flex-1 rounded-full bg-brand px-4 py-2 font-bold text-brand-foreground shadow-sm"
          >
            こうかんする
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="min-h-11 flex-1 rounded-full border-2 border-brand bg-white px-4 py-2 font-bold text-brand"
          >
            やめる
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
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
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  // 買えたものはその場で一覧から消す。サーバーの再取得を待つと
  // 買ったのに残っているように見えてしまう
  const [bought, setBought] = useState<string[]>([]);
  // 確認待ちのアイテム。ここにある間はまだ購入されていない
  const [confirming, setConfirming] = useState<WardrobeItemView | null>(null);

  const slotItemsBeforeFilter = items.filter(
    (item) => item.slotType === slot && !bought.includes(item.id),
  );
  const slotItems = slotItemsBeforeFilter.filter((item) =>
    matchesTierFilter(item.asset.variant, tierFilter),
  );

  const handleTap = (item: WardrobeItemView) => {
    if (pending || item.status === "locked") return;

    if (item.status === "tooExpensive") {
      setMessage("ポイントを ためてから また きてね");
      return;
    }

    setMessage(null);
    setConfirming(item);
  };

  const handleConfirm = () => {
    const item = confirming;
    if (!item) return;
    setConfirming(null);

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

      <div
        className="flex w-full flex-wrap justify-center gap-2"
        role="group"
        aria-label="ランクで しぼりこみ"
      >
        {TIER_FILTERS.map((tier) => (
          <motion.button
            key={tier.key}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setTierFilter(tier.key)}
            aria-pressed={tierFilter === tier.key}
            className={`min-h-11 rounded-full px-4 py-2 text-sm font-bold ${
              tierFilter === tier.key
                ? "bg-brand text-brand-foreground shadow-sm"
                : "border-2 border-brand/40 bg-white text-brand"
            }`}
          >
            {tier.label}
          </motion.button>
        ))}
      </div>

      <ItemGrid
        isEmpty={slotItems.length === 0}
        emptyMessage={
          slotItemsBeforeFilter.length === 0
            ? `${SLOT_LABELS[slot]}は ぜんぶ てにいれたよ！`
            : "この ランクには まだ ないよ"
        }
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

      {confirming && (
        <PurchaseConfirmDialog
          item={confirming}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
};
