"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { percentile } from "@/lib/ranking";
import type { RankingView } from "@/lib/ranking-store";

// docs/game-design.md「ランキング設計」: 見せ方はやさしく。自己ベストとの比較を
// 主役にし、ランキングは「上位◯%」のようなバッジ表示を基本にする。
// 詳細な数値順位は任意で見られる程度に留める（→ボタンで開閉する）

export const RankingBoard = ({ ranking }: { ranking: RankingView }) => {
  const [showList, setShowList] = useState(false);
  const { allTimeBest, weeklyBest, rank, totalParticipants, topRows } = ranking;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-[clamp(0.5rem,2vh,1rem)]">
      <p className="rounded-sm bg-brand/15 px-5 py-2 font-bold text-foreground">
        じこベスト {allTimeBest}てん
      </p>

      {rank === null ? (
        <p className="text-sm font-bold text-foreground/70">
          こんしゅうは まだ ちょうせん していないよ
        </p>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="flex flex-col items-center gap-1 rounded-[20px] bg-brand/20 px-6 py-4"
        >
          <p className="text-sm font-bold text-foreground/70">こんしゅうの あなたは</p>
          <p className="text-[clamp(1.5rem,2.5vh+1rem,2.25rem)] font-bold text-brand">
            じょうい {percentile(rank, totalParticipants)}%
          </p>
          <p className="text-sm font-bold text-foreground/70">
            こんしゅうの ベスト {weeklyBest}てん
          </p>
        </motion.div>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowList((value) => !value)}
        // min-h-11 は 44px。タッチ領域の最小サイズを下回らせない（docs/design.md）
        className="min-h-11 px-2 text-sm font-bold text-brand underline underline-offset-4"
      >
        {showList ? "じゅんいを とじる" : "くわしい じゅんいを みる"}
      </motion.button>

      {showList && (
        <ol className="flex w-full flex-col gap-1 text-left">
          {topRows.length === 0 ? (
            <li className="text-center text-sm font-bold text-foreground/60">
              まだ だれも ちょうせんしていないよ
            </li>
          ) : (
            topRows.map((row, index) => (
              <li
                key={row.childId}
                className={`flex items-center justify-between rounded-sm px-4 py-2 text-sm font-bold ${
                  row.isSelf ? "bg-brand/25 text-foreground" : "bg-white/70 text-foreground/80"
                }`}
              >
                <span>
                  {index + 1}ばん　{row.nickname}
                </span>
                <span>{row.score}てん</span>
              </li>
            ))
          )}
        </ol>
      )}
    </div>
  );
};
