"use client";

import { motion } from "framer-motion";
import { ItemThumb } from "@/components/avatar";
import { SLOT_LABELS, SLOT_TYPES, type SlotType } from "@/lib/wardrobe";
import type { WardrobeItemView } from "@/lib/wardrobe-store";

// きせかえ画面とおみせ画面で共通の部品。同じ見た目・同じ操作感にしておかないと、
// 子どもは「別のアプリ」に見えてしまう

export const PointsBadge = ({ points }: { points: number }) => (
  <p className="rounded-sm bg-brand/15 px-5 py-2 font-bold text-foreground">
    もっている ポイント {points}
  </p>
);

export const SlotTabs = ({
  slot,
  onSelect,
}: {
  slot: SlotType;
  onSelect: (slot: SlotType) => void;
}) => (
  <div className="flex w-full justify-center gap-2">
    {SLOT_TYPES.map((slotType) => (
      <motion.button
        key={slotType}
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect(slotType)}
        aria-pressed={slot === slotType}
        // min-h-11 は 44px。タッチ領域の最小サイズを下回らせない（docs/design.md）
        className={`min-h-11 rounded-full px-[clamp(0.75rem,2.5vw,1.5rem)] py-2 text-[clamp(0.8125rem,1vh+0.4rem,1.125rem)] font-bold ${
          slot === slotType
            ? "bg-brand text-brand-foreground shadow-sm"
            : "border-2 border-brand/40 bg-white text-brand"
        }`}
      >
        {SLOT_LABELS[slotType]}
      </motion.button>
    ))}
  </div>
);

export const ItemTile = ({
  item,
  note,
  disabled,
  highlighted,
  onTap,
}: {
  item: WardrobeItemView;
  note: string;
  disabled: boolean;
  highlighted: boolean;
  onTap: () => void;
}) => {
  // まだ手に入らないものは名前も見た目も伏せる。中身が見えていると
  // 手に入らないことへの不満が先に立つ（docs/game-design.md）
  const hidden = item.status === "locked";

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.95 }}
      onClick={onTap}
      disabled={disabled}
      // min-h-11 は 44px。タッチ領域の最小サイズを下回らせない（docs/design.md）
      className={`flex min-h-11 w-full flex-col items-center gap-1 rounded-[20px] p-[clamp(0.375rem,1.2vh,0.75rem)] text-center shadow-sm ${
        highlighted ? "bg-brand/25 ring-2 ring-brand" : "bg-white/70"
      } ${hidden ? "opacity-50" : ""}`}
    >
      {hidden ? (
        <span
          className="flex h-[clamp(2rem,6vh,4rem)] items-center justify-center text-[clamp(1rem,2.5vh,1.75rem)] font-bold text-foreground/40"
          aria-hidden
        >
          ？
        </span>
      ) : (
        <ItemThumb
          slot={item.slotType}
          asset={item.asset}
          className="h-[clamp(2rem,6vh,4rem)] w-auto"
        />
      )}

      <span className="text-[clamp(0.75rem,1vh+0.4rem,1.0625rem)] font-bold leading-snug text-foreground">
        {hidden ? "？？？" : item.name}
      </span>

      <span className="text-[clamp(0.6875rem,0.9vh+0.35rem,0.9375rem)] leading-snug text-foreground/70">
        {note}
      </span>
    </motion.button>
  );
};

export const ItemGrid = ({
  children,
  emptyMessage,
  isEmpty,
}: {
  children: React.ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}) =>
  isEmpty ? (
    <p className="flex flex-1 items-center justify-center px-4 text-center text-sm font-bold text-foreground/60">
      {emptyMessage}
    </p>
  ) : (
    // 一覧そのものはスクロール領域にしない。ページ全体を1つのスクロールにし、
    // 上に積まれた要素(アバター・タブ等)は各画面側で sticky にして残す。
    // 一覧を入れ子のスクロール領域にしていた頃は、残りの高さしか貰えず
    // スマホで20px程度・iPad横向きでも2行弱しか見えず、指で送るのも
    // 難しかった（issue #12）
    <ul className="grid w-full grid-cols-2 gap-[clamp(0.375rem,1.5vw,0.75rem)] sm:grid-cols-3">
      {children}
    </ul>
  );

// きせかえ・おみせで、一覧をスクロールしても上に残しておく部分。
// 何を着ているか・どのタブを見ているかが一覧を送った途端に見えなくなると、
// 子どもは今どこにいるのか分からなくなる。背景を塗っておかないと、下を
// 流れていくアイテムが透けて見える
export const StickyControls = ({ children }: { children: React.ReactNode }) => (
  <div className="sticky top-0 z-10 flex w-full flex-col items-center gap-[clamp(0.375rem,1.5vh,1rem)] bg-background pb-[clamp(0.375rem,1.5vh,0.75rem)]">
    {children}
  </div>
);

export const StatusMessage = ({ message }: { message: string | null }) => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-6 text-center text-sm font-bold text-foreground/80"
  >
    {message}
  </div>
);
