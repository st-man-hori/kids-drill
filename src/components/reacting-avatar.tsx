"use client";

import { motion, useReducedMotion, type Transition, type TargetAndTransition } from "framer-motion";
import { Avatar, type ArmPose } from "@/components/avatar";
import type { AvatarAsset, SlotType } from "@/lib/wardrobe";

// 答えに反応するアバター。docs/game-design.md が練習モードのフィードバックとして
// 「正解モーション・キャラ反応・獲得ポイント表示」を挙げているうちの「キャラ反応」。
//
// 不正解の反応は**恐怖感を与えない**こと（docs/design.md）。落ち込ませたり
// 責めたりする動きにはせず、軽く首をかしげる程度に留める。

export type AvatarMood = "idle" | "correct" | "incorrect" | "celebrate";

const MOTION: Record<AvatarMood, { animate: TargetAndTransition; transition: Transition }> = {
  // 待機中はゆっくり上下に揺れるだけ。問題を解いている邪魔をしない
  idle: {
    animate: { y: [0, -3, 0], rotate: 0, scale: 1 },
    transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
  },
  // 正解: ぴょんと跳ねる。
  // springは2つのキーフレームしか扱えない（3つ以上を渡すと実行時に例外になる）ため、
  // 「跳ね上がる」1手だけを指定し、戻りは repeatType: "reverse" に任せる
  correct: {
    animate: { y: -14, scale: 1.12, rotate: -6 },
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 11,
      repeat: 1,
      repeatType: "reverse",
    },
  },
  // 不正解: 小さく首をかしげる。責める動きにはしない
  incorrect: {
    animate: { y: 0, rotate: [0, -7, 5, 0], scale: 1 },
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  // 結果画面でのお祝い。跳ぶのではなく「ばんざい」で喜ぶ（うでの動きはAvatar側）。
  // からだは踏み込む程度に留めて、うでの動きを主役にする
  celebrate: {
    animate: { y: [0, 3, 0], rotate: 0, scale: 1 },
    transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" },
  },
};

// うでを上げるのはお祝いのときだけ
const ARM_POSE: Record<AvatarMood, ArmPose> = {
  idle: "down",
  correct: "down",
  incorrect: "down",
  celebrate: "cheer",
};

export const ReactingAvatar = ({
  equipped,
  mood,
  skinTone,
  eyeStyle,
  mouthStyle,
  className = "",
}: {
  equipped: Partial<Record<SlotType, AvatarAsset>>;
  mood: AvatarMood;
  skinTone?: string;
  eyeStyle?: string;
  mouthStyle?: string;
  className?: string;
}) => {
  const reduceMotion = useReducedMotion();
  const { animate, transition } = MOTION[mood];

  return (
    <motion.div
      // 動きを減らす設定の人には位置だけ保って動かさない
      animate={reduceMotion ? { y: 0, rotate: 0, scale: 1 } : animate}
      transition={reduceMotion ? { duration: 0 } : transition}
      className={className}
    >
      <Avatar
        equipped={equipped}
        armPose={reduceMotion ? "down" : ARM_POSE[mood]}
        skinTone={skinTone}
        eyeStyle={eyeStyle}
        mouthStyle={mouthStyle}
        className="h-full w-auto"
      />
    </motion.div>
  );
};
