"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Avatar, ItemThumb } from "@/components/avatar";
import { buyWardrobeItem, wearWardrobeItem } from "@/app/wardrobe/actions";
import { SLOT_LABELS, SLOT_TYPES, type AvatarAsset, type SlotType } from "@/lib/wardrobe";
import type { WardrobeItemView } from "@/lib/wardrobe-store";

// 状態ごとの見え方。子どもが読む文言は平仮名/カタカナのみ（docs/design.md）
const STATUS_NOTE: Record<WardrobeItemView["status"], string> = {
  equipped: "きているよ",
  owned: "タップで きられるよ",
  affordable: "こうかんできるよ",
  tooExpensive: "ポイントが たりないよ",
  locked: "",
};

export const WardrobeCloset = ({
  pointsBalance,
  items,
}: {
  pointsBalance: number;
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
    if (pending || item.status === "equipped" || item.status === "locked") return;

    if (item.status === "tooExpensive") {
      setMessage("ポイントを ためてから また きてね");
      return;
    }

    setMessage(null);

    if (item.status === "owned") {
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
      return;
    }

    // affordable: ポイントと交換する。交換できたらそのまま着る
    startTransition(async () => {
      const result = await buyWardrobeItem(item.id);
      if (result.ok) {
        setPreview((current) => ({ ...current, [item.slotType]: item.asset }));
        setMessage(`${item.name}を てにいれた！`);
      } else if (result.reason === "notEnoughPoints") {
        setMessage("ポイントが たりなかったよ");
      } else {
        setMessage("うまく こうかんできなかったよ。もういちど ためしてね");
      }
    });
  };

  return (
    <div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center gap-[clamp(0.5rem,2vh,1.25rem)]">
      <p className="rounded-sm bg-brand/15 px-5 py-2 font-bold text-foreground">
        もっている ポイント {pointsBalance}
      </p>

      <Avatar
        equipped={equipped}
        className="h-[clamp(7rem,22vh,12rem)] w-auto shrink-0"
      />

      <div
        role="status"
        aria-live="polite"
        className="min-h-6 text-center text-sm font-bold text-foreground/80"
      >
        {message}
      </div>

      {/* スロットの切り替え */}
      <div className="flex w-full justify-center gap-2">
        {SLOT_TYPES.map((slotType) => (
          <motion.button
            key={slotType}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setSlot(slotType)}
            aria-pressed={slot === slotType}
            className={`rounded-full px-[clamp(0.625rem,2vw,1.25rem)] py-2 text-[clamp(0.75rem,1vh+0.4rem,1rem)] font-bold ${
              slot === slotType
                ? "bg-brand text-brand-foreground shadow-sm"
                : "border-2 border-brand/40 bg-white text-brand"
            }`}
          >
            {SLOT_LABELS[slotType]}
          </motion.button>
        ))}
      </div>

      {/* アイテム一覧 */}
      <ul className="grid w-full min-h-0 grid-cols-2 gap-[clamp(0.375rem,1.5vw,0.75rem)] overflow-y-auto sm:grid-cols-3">
        {slotItems.map((item) => {
          const locked = item.status === "locked";
          const disabled = locked || item.status === "equipped" || pending;

          return (
            <li key={item.id}>
              <motion.button
                type="button"
                whileTap={disabled ? undefined : { scale: 0.95 }}
                onClick={() => handleTap(item)}
                disabled={disabled}
                className={`flex w-full flex-col items-center gap-1 rounded-[20px] p-[clamp(0.375rem,1.2vh,0.75rem)] text-center shadow-sm ${
                  item.status === "equipped"
                    ? "bg-brand/25 ring-2 ring-brand"
                    : "bg-white/70"
                } ${locked ? "opacity-50" : ""} ${pending ? "cursor-wait" : ""}`}
              >
                {locked ? (
                  // まだ手に入らないものは中身を見せない。何がもらえるか分かって
                  // しまうより、「なにをすれば もらえるか」だけを伝える
                  <span
                    className="flex h-[clamp(2rem,6vh,3.25rem)] items-center justify-center text-[clamp(1rem,2.5vh,1.75rem)] font-bold text-foreground/40"
                    aria-hidden
                  >
                    ？
                  </span>
                ) : (
                  <ItemThumb
                    slot={item.slotType}
                    asset={item.asset}
                    className="h-[clamp(2rem,6vh,3.25rem)] w-auto"
                  />
                )}

                <span className="text-[clamp(0.6875rem,0.9vh+0.35rem,0.875rem)] font-bold leading-snug text-foreground">
                  {locked ? "？？？" : item.name}
                </span>

                <span className="text-[clamp(0.625rem,0.8vh+0.3rem,0.75rem)] leading-snug text-foreground/70">
                  {locked
                    ? item.unlockLabel
                    : item.status === "affordable" && item.pricePoints !== null
                      ? `${item.pricePoints} ポイント`
                      : STATUS_NOTE[item.status]}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
