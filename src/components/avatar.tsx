"use client";

import type { ReactNode } from "react";
import { motion, type Transition, type TargetAndTransition } from "framer-motion";
import { SLOT_DRAW_ORDER, type AvatarAsset, type SlotType } from "@/lib/wardrobe";

// 着せ替えアバターの描画。**実イラストを用意するまでのダミー**で、
// asset_ref から取り出したバリアントと色でSVGの図形を描いている
// （docs/game-design.md では最終的にAI生成イラストを使う想定）。
//
// 実画像に差し替えるときは、このファイルの shape 群を <image> の重ね合わせに
// 置き換えればよい。呼び出し側とデータの形（スロットごとの AvatarAsset）は変わらない。

// はだ・ベースの色。ベースアバターは1体（docs/game-design.md）なので固定
const SKIN = "#f6d5bd";
const SKIN_SHADE = "#e8bfa1";

type Shapes = (color: string) => ReactNode;

// バリアントが増えたら足す。未知のバリアントは各スロットの "a" にフォールバック
// するので、アイテムのレコードを足しただけで画面が壊れることはない
const HAIR: Record<string, Shapes> = {
  a: (c) => (
    <>
      <circle cx="50" cy="24" r="23" fill={c} />
      <circle cx="30" cy="34" r="12" fill={c} />
      <circle cx="70" cy="34" r="12" fill={c} />
    </>
  ),
  b: (c) => (
    <>
      <path d="M27 34 A23 23 0 0 1 73 34 L73 46 L64 46 L64 22 L36 22 L36 46 L27 46 Z" fill={c} />
    </>
  ),
  c: (c) => (
    <>
      <circle cx="50" cy="26" r="23" fill={c} />
      <path d="M27 30 L27 74 A6 6 0 0 0 39 74 L39 30 Z" fill={c} />
      <path d="M61 30 L61 74 A6 6 0 0 0 73 74 L73 30 Z" fill={c} />
    </>
  ),
};

const TOP: Record<string, Shapes> = {
  a: (c) => <rect x="28" y="56" width="44" height="44" rx="14" fill={c} />,
  b: (c) => (
    <>
      <rect x="28" y="56" width="44" height="44" rx="14" fill={c} />
      <rect x="28" y="66" width="44" height="5" fill="#ffffff" opacity="0.75" />
      <rect x="28" y="78" width="44" height="5" fill="#ffffff" opacity="0.75" />
      <rect x="28" y="90" width="44" height="5" fill="#ffffff" opacity="0.75" />
    </>
  ),
  c: (c) => (
    <>
      <rect x="28" y="56" width="44" height="44" rx="14" fill={c} />
      {/* フード */}
      <path d="M34 58 A16 10 0 0 0 66 58 Z" fill={c} opacity="0.75" />
      <rect x="48" y="70" width="4" height="18" rx="2" fill="#ffffff" opacity="0.6" />
    </>
  ),
  d: (c) => (
    <>
      <path d="M32 56 L68 56 L80 114 A4 4 0 0 1 76 118 L24 118 A4 4 0 0 1 20 114 Z" fill={c} />
      <circle cx="40" cy="74" r="2.5" fill="#ffffff" opacity="0.8" />
      <circle cx="58" cy="88" r="2.5" fill="#ffffff" opacity="0.8" />
      <circle cx="46" cy="102" r="2.5" fill="#ffffff" opacity="0.8" />
    </>
  ),
};

const BOTTOM: Record<string, Shapes> = {
  a: (c) => (
    <>
      <rect x="31" y="96" width="16" height="32" rx="7" fill={c} />
      <rect x="53" y="96" width="16" height="32" rx="7" fill={c} />
    </>
  ),
  b: (c) => <path d="M32 96 L68 96 L78 122 A3 3 0 0 1 75 126 L25 126 A3 3 0 0 1 22 122 Z" fill={c} />,
  c: (c) => (
    <>
      <rect x="31" y="96" width="16" height="20" rx="7" fill={c} />
      <rect x="53" y="96" width="16" height="20" rx="7" fill={c} />
    </>
  ),
};

const NECKLACE: Record<string, Shapes> = {
  a: (c) => (
    <>
      <path d="M40 58 A12 10 0 0 0 60 58" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="70" r="4.5" fill={c} />
    </>
  ),
  b: (c) => (
    <>
      <path d="M40 58 A12 10 0 0 0 60 58" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="69" r="3" fill={c} />
      <circle cx="42" cy="65" r="2" fill={c} />
      <circle cx="58" cy="65" r="2" fill={c} />
    </>
  ),
};

const SHAPES: Record<SlotType, Record<string, Shapes>> = {
  hair: HAIR,
  top: TOP,
  bottom: BOTTOM,
  necklace: NECKLACE,
};

const renderSlot = (slot: SlotType, asset: AvatarAsset | undefined): ReactNode => {
  if (!asset) return null;
  const shapes = SHAPES[slot];
  const draw = shapes[asset.variant] ?? shapes.a;
  return draw(asset.color);
};

// うでの構え。うでは肩を軸に回すので、rectの上端中央を回転の中心にする
export type ArmPose = "down" | "cheer" | "wave";

// 下ろした状態(0度)から回す角度。SVGは時計回りが正なので、
// 左うでは+150で左上、右うでは-150で右上を向く
const RAISED = 150;

const ARM_MOTION: Record<
  ArmPose,
  { left: TargetAndTransition; right: TargetAndTransition; transition: Transition }
> = {
  down: {
    left: { rotate: 0 },
    right: { rotate: 0 },
    transition: { type: "spring", stiffness: 200, damping: 16 },
  },
  // ばんざい。上げっぱなしにせず、間を置いて繰り返す
  cheer: {
    left: { rotate: RAISED },
    right: { rotate: -RAISED },
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 12,
      repeat: Infinity,
      repeatType: "reverse",
      repeatDelay: 0.35,
    },
  },
  // 片手を上げて振る。springは2キーフレームまでなので、
  // 振る動き（3点以上）はtweenで書く
  wave: {
    left: { rotate: 0 },
    right: { rotate: [0, -RAISED, -RAISED + 22, -RAISED, -RAISED + 22, -RAISED] },
    transition: { duration: 1.6, ease: "easeInOut", times: [0, 0.28, 0.46, 0.64, 0.82, 1] },
  },
};

// 肩（rectの上端中央）を回転の軸にする。fill-boxで要素自身の
// バウンディングボックス基準になる
const ARM_PIVOT = { transformBox: "fill-box", transformOrigin: "50% 8%" } as const;

// 素体。着ているものが何も無くても、これだけで人の形に見えるようにしておく
const BaseBody = ({ armPose }: { armPose: ArmPose }) => (
  <>
    {/* あし */}
    <rect x="33" y="96" width="12" height="34" rx="6" fill={SKIN} />
    <rect x="55" y="96" width="12" height="34" rx="6" fill={SKIN} />
    {/* うで */}
    <motion.rect
      data-arm="left"
      x="20"
      y="60"
      width="11"
      height="34"
      rx="5.5"
      fill={SKIN}
      style={ARM_PIVOT}
      animate={ARM_MOTION[armPose].left}
      transition={ARM_MOTION[armPose].transition}
    />
    <motion.rect
      data-arm="right"
      x="69"
      y="60"
      width="11"
      height="34"
      rx="5.5"
      fill={SKIN}
      style={ARM_PIVOT}
      animate={ARM_MOTION[armPose].right}
      transition={ARM_MOTION[armPose].transition}
    />
    {/* からだ */}
    <rect x="30" y="56" width="40" height="46" rx="14" fill={SKIN_SHADE} />
    {/* くび・あたま */}
    <rect x="45" y="46" width="10" height="12" rx="4" fill={SKIN_SHADE} />
    <circle cx="50" cy="32" r="20" fill={SKIN} />
    {/* かお */}
    <circle cx="43" cy="31" r="2.4" fill="#3f3a36" />
    <circle cx="57" cy="31" r="2.4" fill="#3f3a36" />
    <path
      d="M45 39 A5 4 0 0 0 55 39"
      stroke="#3f3a36"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="36" cy="37" r="3" fill="#f4a6a0" opacity="0.55" />
    <circle cx="64" cy="37" r="3" fill="#f4a6a0" opacity="0.55" />
  </>
);

// アイテム一覧に出す小さな見本。アバターと同じ図形を、そのスロットの
// あたりだけ切り出して使い回す（別に見本用の絵を持たなくて済む）
const THUMB_VIEWBOX: Record<SlotType, string> = {
  hair: "18 0 64 56",
  top: "16 50 68 64",
  bottom: "16 92 68 40",
  necklace: "33 52 34 26",
};

export const ItemThumb = ({
  slot,
  asset,
  className = "",
}: {
  slot: SlotType;
  asset: AvatarAsset;
  className?: string;
}) => (
  <svg viewBox={THUMB_VIEWBOX[slot]} className={className} aria-hidden>
    {renderSlot(slot, asset)}
  </svg>
);

export const Avatar = ({
  equipped,
  armPose = "down",
  className = "",
}: {
  equipped: Partial<Record<SlotType, AvatarAsset>>;
  armPose?: ArmPose;
  className?: string;
}) => (
  <svg viewBox="0 0 100 140" className={className} role="img" aria-label="じぶんの キャラクター">
    {/* かみは からだより後ろに描く。それ以外は SLOT_DRAW_ORDER の順で重ねる */}
    {renderSlot("hair", equipped.hair)}
    <BaseBody armPose={armPose} />
    {SLOT_DRAW_ORDER.filter((slot) => slot !== "hair").map((slot) => (
      <g key={slot}>{renderSlot(slot, equipped[slot])}</g>
    ))}
  </svg>
);
