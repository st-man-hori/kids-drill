"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Transition, type TargetAndTransition } from "framer-motion";
import { Avatar, type ArmPose } from "@/components/avatar";
import type { AvatarGreeting } from "@/lib/avatar-greeting";
import type { AvatarAsset, SlotType } from "@/lib/wardrobe";
import type { EyeStyle, MouthStyle, SkinTone } from "@/lib/face";

// マイページを開いたときに一度だけするあいさつ。どれをするかは
// サーバー側で選んで渡される（src/lib/avatar-greeting.ts）。
//
// 一度やったら待機の揺れに戻す。ずっと動き続けていると、マイページに
// 居るあいだじゅう視界の端がうるさくなるため。

type Move = {
  armPose: ArmPose;
  animate: TargetAndTransition;
  transition: Transition;
  // この時間が過ぎたら待機に戻す
  durationMs: number;
};

const GREETING_MOVE: Record<AvatarGreeting, Move> = {
  // てをふる。うでが主役なので、からだは軽く傾ける程度
  wave: {
    armPose: "wave",
    animate: { y: 0, rotate: [0, -3, 0, -3, 0], scale: 1 },
    transition: { duration: 1.6, ease: "easeInOut" },
    durationMs: 1600,
  },
  // ばんざい
  cheer: {
    armPose: "cheer",
    animate: { y: [0, 3, 0, 3, 0], rotate: 0, scale: 1 },
    transition: { duration: 1.8, ease: "easeInOut" },
    durationMs: 1800,
  },
  // ぴょんぴょん跳ねる
  hop: {
    armPose: "down",
    animate: { y: [0, -16, 0, -11, 0], rotate: 0, scale: 1 },
    transition: { duration: 1.2, ease: "easeOut", times: [0, 0.25, 0.5, 0.72, 1] },
    durationMs: 1200,
  },
  // くるっと1回まわる
  spin: {
    armPose: "down",
    animate: { y: [0, -8, 0], rotate: [0, 360], scale: 1 },
    transition: { duration: 1.1, ease: "easeInOut" },
    durationMs: 1100,
  },
  // ぺこりとおじぎ
  bow: {
    armPose: "down",
    animate: { y: [0, 6, 0], rotate: [0, 10, 0], scale: 1 },
    transition: { duration: 1.2, ease: "easeInOut" },
    durationMs: 1200,
  },
};

// あいさつのあとの待機。ReactingAvatarのidleと同じ揺れ方に揃える
const IDLE: { animate: TargetAndTransition; transition: Transition } = {
  animate: { y: [0, -3, 0], rotate: 0, scale: 1 },
  transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
};

export const GreetingAvatar = ({
  equipped,
  greeting,
  skinTone,
  eyeStyle,
  mouthStyle,
  className = "",
}: {
  equipped: Partial<Record<SlotType, AvatarAsset>>;
  greeting: AvatarGreeting;
  skinTone?: SkinTone;
  eyeStyle?: EyeStyle;
  mouthStyle?: MouthStyle;
  className?: string;
}) => {
  const reduceMotion = useReducedMotion();
  const [done, setDone] = useState(false);
  const move = GREETING_MOVE[greeting];

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => setDone(true), move.durationMs);
    return () => clearTimeout(timer);
  }, [move.durationMs, reduceMotion]);

  if (reduceMotion) {
    return (
      <Avatar
        equipped={equipped}
        skinTone={skinTone}
        eyeStyle={eyeStyle}
        mouthStyle={mouthStyle}
        className={className}
      />
    );
  }

  const current = done ? IDLE : move;

  return (
    <motion.div
      animate={current.animate}
      transition={current.transition}
      className={className}
    >
      <Avatar
        equipped={equipped}
        armPose={done ? "down" : move.armPose}
        skinTone={skinTone}
        eyeStyle={eyeStyle}
        mouthStyle={mouthStyle}
        className="h-full w-auto"
      />
    </motion.div>
  );
};
