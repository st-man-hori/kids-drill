"use client";

import { useId, type ReactNode } from "react";
import { motion, useReducedMotion, type Transition, type TargetAndTransition } from "framer-motion";
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

// ティア別テンプレ（docs/game-design.md「ティア別SVG制作テンプレート」）のグラデーション・
// ハイライト表現を、asset_ref の色1つ（データ形式は変えない）から導出するための濃淡計算
const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
  const n = Number.parseInt(h.slice(0, 6).padEnd(6, "0"), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, "0")).join("")}`;

const mixToward = (hex: string, target: number, amount: number) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (target - r) * amount, g + (target - g) * amount, b + (target - b) * amount);
};

const lighten = (hex: string, amount: number) => mixToward(hex, 255, amount);
const darken = (hex: string, amount: number) => mixToward(hex, 0, amount);

// T6のパーティクル用、中心cx/cyから半径rの4方向スパークル形状
const sparklePath = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} L${cx + r * 0.3} ${cy - r * 0.3} L${cx + r} ${cy} L${cx + r * 0.3} ${cy + r * 0.3} ` +
  `L${cx} ${cy + r} L${cx - r * 0.3} ${cy + r * 0.3} L${cx - r} ${cy} L${cx - r * 0.3} ${cy - r * 0.3} Z`;

// T5(グロー)・T6(パーティクル)の明滅・浮遊はFramer Motionで駆動する
// （reacting-avatar.tsx の idle 演出と同じ、tween + easeInOut + repeat: Infinity の
// 「待機ループ」の型に揃える。springは正解時のような一発の弾みに使うもので、
// 常時ループするアンビエント演出には使わない）。静止させたいときは
// duration: 0 のtransitionを渡す
const GLOW_PULSE_ANIMATE: TargetAndTransition = { opacity: [0.55, 1, 0.55] };
const GLOW_PULSE_TRANSITION: Transition = { duration: 2.4, repeat: Infinity, ease: "easeInOut" };
const STATIC_TRANSITION: Transition = { duration: 0 };

const particleFloatTransition = (delay: number): Transition => ({
  duration: 2.2,
  repeat: Infinity,
  ease: "easeInOut",
  delay,
});
const PARTICLE_FLOAT_ANIMATE: TargetAndTransition = { opacity: [0.35, 1, 0.35], y: [0, -3, 0] };

// ネックレスのチャーム形。アイテム名が「ほしのペンダント」「ハートペンダント」のように
// 具体的なモチーフを名乗っていても、以前はティア・色にしか形が反応せず全部が丸に
// 見えてしまっていた（asset_ref の motif で選ぶ。docs/data-model.md）。
// 「つきのペンダントなのにstarファミリーに寄せていて星に見える」という指摘を受け、
// 近似でまとめるのをやめ、16種類の名前それぞれに専用の形を用意している
// （データ側の対応表は0011マイグレーションのコメント参照）
const starPath = (cx: number, cy: number, outerR: number, innerR: number) => {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push(`${i === 0 ? "M" : "L"}${(cx + r * Math.cos(angle)).toFixed(1)} ${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return `${points.join(" ")} Z`;
};

const heartPath = (cx: number, cy: number, size: number) =>
  `M${cx} ${cy + size * 0.6} ` +
  `C${cx - size * 1.1} ${cy - size * 0.3} ${cx - size * 0.55} ${cy - size * 1.05} ${cx} ${cy - size * 0.35} ` +
  `C${cx + size * 0.55} ${cy - size * 1.05} ${cx + size * 1.1} ${cy - size * 0.3} ${cx} ${cy + size * 0.6} Z`;

const gemPath = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} L${cx + r * 0.6} ${cy - r * 0.4} L${cx + r} ${cy + r * 0.1} L${cx + r * 0.5} ${cy + r * 0.9} ` +
  `L${cx} ${cy + r * 0.55} L${cx - r * 0.5} ${cy + r * 0.9} L${cx - r} ${cy + r * 0.1} L${cx - r * 0.6} ${cy - r * 0.4} Z`;

// 花びらは円ではなく中心から放射状に伸びる楕円にし、間隔もあけて
// 「丸の集合体」に見えないようにする
const flowerPetals = (cx: number, cy: number, r: number) =>
  Array.from({ length: 5 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const petalCx = cx + r * 0.62 * Math.cos(angle);
    const petalCy = cy + r * 0.62 * Math.sin(angle);
    return { cx: petalCx, cy: petalCy, rotateDeg: (angle * 180) / Math.PI + 90 };
  });

// 三日月。「丸から丸を引く」形をmaskで表現する（弧のpath計算より確実で読みやすい）
const moonMaskCutout = (cx: number, cy: number, r: number) => ({
  cx: cx + r * 0.55,
  cy: cy - r * 0.35,
  r: r * 0.88,
});

// 蝶。羽根4枚は縦長の楕円にして間隔を広くあけ、「丸の集合」に見えないようにする。
// 胴体は太めの縦カプセルで、羽根の間の隙間にはっきり見せる
const butterflyWings = (cx: number, cy: number, r: number) => [
  { cx: cx - r * 0.68, cy: cy - r * 0.32, rx: r * 0.42, ry: r * 0.62, rotate: -28 },
  { cx: cx + r * 0.68, cy: cy - r * 0.32, rx: r * 0.42, ry: r * 0.62, rotate: 28 },
  { cx: cx - r * 0.5, cy: cy + r * 0.4, rx: r * 0.28, ry: r * 0.42, rotate: -18 },
  { cx: cx + r * 0.5, cy: cy + r * 0.4, rx: r * 0.28, ry: r * 0.42, rotate: 18 },
];

// 炎。外側のしずく形+内側にひとまわり小さい炎心（明るい色）を重ね、
// 単なるしずく(gemと紛らわしい)ではなく燃えている感じを出す
const flamePath = (cx: number, cy: number, r: number) =>
  `M${cx + r * 0.08} ${cy - r} ` +
  `C${cx + r * 0.95} ${cy - r * 0.15} ${cx + r * 0.65} ${cy + r * 0.55} ${cx - r * 0.05} ${cy + r} ` +
  `C${cx - r * 0.75} ${cy + r * 0.5} ${cx - r * 0.75} ${cy - r * 0.2} ${cx + r * 0.08} ${cy - r} Z`;
const flameCorePath = (cx: number, cy: number, r: number) =>
  `M${cx + r * 0.05} ${cy - r * 0.35} ` +
  `C${cx + r * 0.5} ${cy + r * 0.05} ${cx + r * 0.35} ${cy + r * 0.45} ${cx} ${cy + r * 0.6} ` +
  `C${cx - r * 0.3} ${cy + r * 0.4} ${cx - r * 0.35} ${cy} ${cx + r * 0.05} ${cy - r * 0.35} Z`;

// どうぶつの肉球。大きい楕円1つ+指の丸4つ
const pawToes = (cx: number, cy: number, r: number) => [
  { x: cx - r * 0.55, y: cy - r * 0.35 },
  { x: cx - r * 0.2, y: cy - r * 0.6 },
  { x: cx + r * 0.2, y: cy - r * 0.6 },
  { x: cx + r * 0.55, y: cy - r * 0.35 },
];

// あめ(キャンディ)。中心でつまんだリボン形。左右2つの四角形+中心の結び目
const candyWrapperPath = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy - r * 0.7} L${cx - r * 0.15} ${cy - r * 0.15} L${cx - r * 0.15} ${cy + r * 0.15} L${cx - r} ${cy + r * 0.7} Z ` +
  `M${cx + r} ${cy - r * 0.7} L${cx + r * 0.15} ${cy - r * 0.15} L${cx + r * 0.15} ${cy + r * 0.15} L${cx + r} ${cy + r * 0.7} Z`;

// ひらいた本。背表紙(cx)を軸に左右へ開くページ2枚
const bookLeftPath = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r * 0.55} L${cx - r} ${cy - r * 0.75} L${cx - r} ${cy + r * 0.65} L${cx} ${cy + r * 0.45} Z`;
const bookRightPath = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r * 0.55} L${cx + r} ${cy - r * 0.75} L${cx + r} ${cy + r * 0.65} L${cx} ${cy + r * 0.45} Z`;

// おんぷ。符頭(だ円)+符幹(縦線)+符尾(旗)
const noteFlagPath = (cx: number, cy: number, r: number) =>
  `M${cx + r * 0.2} ${cy - r * 0.9} Q${cx + r * 0.95} ${cy - r * 0.65} ${cx + r * 0.6} ${cy - r * 0.1} ` +
  `Q${cx + r * 0.85} ${cy - r * 0.45} ${cx + r * 0.2} ${cy - r * 0.55} Z`;

// いかり(マリン)。丸(リング)+縦の軸+横の腕木+左右のツメ。線を太めにして、
// 小さいサイズでも輪郭が潰れず「いかり」と分かるようにする
const anchorParts = (cx: number, cy: number, r: number) => ({
  ringCy: cy - r * 0.72,
  ringR: r * 0.28,
  shaftTop: cy - r * 0.46,
  shaftBottom: cy + r * 0.62,
  armY: cy - r * 0.02,
  armHalf: r * 0.52,
  flukeLeft: `M${cx - r * 0.52} ${cy + r * 0.28} Q${cx - r * 0.62} ${cy + r * 0.85} ${cx - r * 0.08} ${cy + r * 0.72}`,
  flukeRight: `M${cx + r * 0.52} ${cy + r * 0.28} Q${cx + r * 0.62} ${cy + r * 0.85} ${cx + r * 0.08} ${cy + r * 0.72}`,
});

// にじ。単色の濃淡だと色が付いているだけの弧に見えてしまうため、アイテムの色は
// 使わず実際の虹の6色バンドで固定する（「にじ」と分かることを優先する）
const RAINBOW_BANDS = ["#e8685f", "#f2a33c", "#f0d24e", "#6dbf6d", "#4f8ef2", "#9b6fd9"];

// チャーム(ネックレスの主形状)。motifが未指定/未知のときは丸のまま
// （旧アイテムのように色だけで表現していたものと同じ見た目になる）。
// rainbow/planetのように色を分解して塗り分けるモチーフのために、グラデーション
// でも構わないfillとは別にbaseColor(元のhex1色)も受け取る
const Charm = ({
  motif,
  uid,
  cx,
  cy,
  r,
  fill,
  baseColor,
  stroke,
  strokeWidth,
  filter,
}: {
  motif: string | undefined;
  uid: string;
  cx: number;
  cy: number;
  r: number;
  fill: string;
  baseColor: string;
  stroke?: string;
  strokeWidth?: number;
  filter?: string;
}) => {
  switch (motif) {
    case "star":
      return <path d={starPath(cx, cy, r, r * 0.42)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} filter={filter} />;
    case "heart":
      return <path d={heartPath(cx, cy, r * 0.85)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} filter={filter} />;
    case "gem":
      return <path d={gemPath(cx, cy, r)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} filter={filter} />;
    case "flower":
      return (
        <g filter={filter}>
          {flowerPetals(cx, cy, r).map((p, i) => (
            <ellipse
              key={i}
              cx={p.cx}
              cy={p.cy}
              rx={r * 0.3}
              ry={r * 0.46}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              transform={`rotate(${p.rotateDeg} ${p.cx} ${p.cy})`}
            />
          ))}
          <circle cx={cx} cy={cy} r={r * 0.3} fill={lighten(baseColor, 0.45)} stroke={darken(baseColor, 0.3)} strokeWidth={r * 0.05} />
        </g>
      );
    case "moon": {
      const cutout = moonMaskCutout(cx, cy, r);
      const maskId = `${uid}-moon-mask`;
      return (
        <g filter={filter}>
          <mask id={maskId}>
            <circle cx={cx} cy={cy} r={r * 1.4} fill="white" />
            <circle cx={cutout.cx} cy={cutout.cy} r={cutout.r} fill="black" />
          </mask>
          <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} mask={`url(#${maskId})`} />
        </g>
      );
    }
    case "butterfly":
      return (
        <g filter={filter}>
          {butterflyWings(cx, cy, r).map((w, i) => (
            <ellipse
              key={i}
              cx={w.cx}
              cy={w.cy}
              rx={w.rx}
              ry={w.ry}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              transform={`rotate(${w.rotate} ${w.cx} ${w.cy})`}
            />
          ))}
          <rect x={cx - r * 0.09} y={cy - r * 0.68} width={r * 0.18} height={r * 1.36} rx={r * 0.09} fill={darken(baseColor, 0.45)} />
        </g>
      );
    case "rainbow": {
      // 同心の半円として重ねる。弧の両端を常に「その帯自身の半径ぶん」離す
      // （半径を変えつつ端点を固定すると、半径が弦の半分未満になった帯がSVG仕様で
      // 最小半径にクランプされ、全部同じ大きさの弧になってしまう）
      const apexY = cy + r * 0.2;
      return (
        <g filter={filter}>
          {RAINBOW_BANDS.map((col, i) => {
            const bandR = r - i * (r * 0.15);
            return (
              <path
                key={col}
                d={`M${cx - bandR} ${apexY} A${bandR} ${bandR} 0 0 1 ${cx + bandR} ${apexY}`}
                stroke={col}
                strokeWidth={r * 0.17}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      );
    }
    case "flame":
      return (
        <g filter={filter}>
          <path d={flamePath(cx, cy, r)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <path d={flameCorePath(cx, cy, r)} fill={lighten(baseColor, 0.55)} />
        </g>
      );
    case "planet":
      return (
        <g filter={filter}>
          <ellipse
            cx={cx}
            cy={cy}
            rx={r * 1.2}
            ry={r * 0.32}
            fill="none"
            stroke={fill}
            strokeWidth={r * 0.16}
            opacity={0.7}
            transform={`rotate(-18 ${cx} ${cy})`}
          />
          <circle cx={cx} cy={cy} r={r * 0.75} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </g>
      );
    case "paw":
      return (
        <g filter={filter}>
          <ellipse cx={cx} cy={cy + r * 0.35} rx={r * 0.7} ry={r * 0.55} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          {pawToes(cx, cy, r).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={r * 0.28} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ))}
        </g>
      );
    case "candy":
      return (
        <g filter={filter}>
          <path d={candyWrapperPath(cx, cy, r)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx={cx} cy={cy} r={r * 0.22} fill={fill} stroke="#ffffff" strokeWidth={r * 0.06} />
        </g>
      );
    case "book":
      return (
        <g filter={filter}>
          <path d={bookLeftPath(cx, cy, r)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <path d={bookRightPath(cx, cy, r)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          {/* ページの罫線。左右2本ずつ入れて「本」と分かりやすくする */}
          <line x1={cx - r * 0.55} y1={cy - r * 0.15} x2={cx - r * 0.15} y2={cy - r * 0.2} stroke={darken(baseColor, 0.35)} strokeWidth={r * 0.05} opacity="0.7" />
          <line x1={cx - r * 0.55} y1={cy + r * 0.1} x2={cx - r * 0.15} y2={cy + r * 0.05} stroke={darken(baseColor, 0.35)} strokeWidth={r * 0.05} opacity="0.7" />
          <line x1={cx + r * 0.15} y1={cy - r * 0.2} x2={cx + r * 0.55} y2={cy - r * 0.15} stroke={darken(baseColor, 0.35)} strokeWidth={r * 0.05} opacity="0.7" />
          <line x1={cx + r * 0.15} y1={cy + r * 0.05} x2={cx + r * 0.55} y2={cy + r * 0.1} stroke={darken(baseColor, 0.35)} strokeWidth={r * 0.05} opacity="0.7" />
          <line x1={cx} y1={cy - r * 0.55} x2={cx} y2={cy + r * 0.45} stroke={darken(baseColor, 0.4)} strokeWidth={r * 0.09} />
        </g>
      );
    case "note":
      return (
        <g filter={filter}>
          <ellipse
            cx={cx - r * 0.3}
            cy={cy + r * 0.55}
            rx={r * 0.42}
            ry={r * 0.32}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            transform={`rotate(-15 ${cx - r * 0.3} ${cy + r * 0.55})`}
          />
          <rect x={cx + r * 0.05} y={cy - r * 0.9} width={r * 0.15} height={r * 1.5} fill={fill} />
          <path d={noteFlagPath(cx, cy, r)} fill={fill} />
        </g>
      );
    case "anchor": {
      const a = anchorParts(cx, cy, r);
      return (
        <g filter={filter}>
          <circle cx={cx} cy={a.ringCy} r={a.ringR} fill="none" stroke={fill} strokeWidth={r * 0.24} />
          <line x1={cx} y1={a.shaftTop} x2={cx} y2={a.shaftBottom} stroke={fill} strokeWidth={r * 0.24} strokeLinecap="round" />
          <line x1={cx - a.armHalf} y1={a.armY} x2={cx + a.armHalf} y2={a.armY} stroke={fill} strokeWidth={r * 0.2} strokeLinecap="round" />
          <path d={a.flukeLeft} fill="none" stroke={fill} strokeWidth={r * 0.24} strokeLinecap="round" />
          <path d={a.flukeRight} fill="none" stroke={fill} strokeWidth={r * 0.24} strokeLinecap="round" />
        </g>
      );
    }
    default:
      return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} filter={filter} />;
  }
};

// 各shapeは色・uidに加えてreduceMotion、ネックレスのチャーム形を選ぶmotifを受け取る
// （motifは今のところネックレス以外では未使用）。おみせ画面は同じバリアント・違う色の
// アイテムを大量に同時描画するため（wardrobe-parts.tsx の ItemGrid）、グラデーション/
// フィルタの <id> をuidで名前空間化しないと、SVGのidはドキュメント全体で共有される仕様上、
// 後から描画したインスタンスが先のインスタンスの定義を参照してしまい色が反映されない
type Shapes = (color: string, uid: string, reduceMotion: boolean, motif?: string) => ReactNode;

// バリアントはティア(t1〜t6)に1対1対応。t1は現状踏襲のベタ塗り、t2以降は
// docs/game-design.md のティア別テンプレ通りに表現を広げる。未知のバリアントは
// 各スロットの t1 にフォールバックするので、レコードを足しただけで画面が壊れない
const HAIR: Record<string, Shapes> = {
  t1: (c) => (
    <>
      <circle cx="50" cy="24" r="23" fill={c} />
      <circle cx="30" cy="34" r="12" fill={c} />
      <circle cx="70" cy="34" r="12" fill={c} />
    </>
  ),
  t2: (c, uid) => {
    const grad = `${uid}-h2-grad`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.28)} />
            <stop offset="1" stopColor={c} />
          </linearGradient>
        </defs>
        <path
          d="M27 34 A23 23 0 0 1 73 34 L73 46 L64 46 L64 22 L36 22 L36 46 L27 46 Z"
          fill={`url(#${grad})`}
          stroke={darken(c, 0.55)}
          strokeWidth="2.2"
        />
        <path d="M27 40 L73 40 L73 46 L64 46 L64 40 L36 40 L36 46 L27 46 Z" fill={darken(c, 0.35)} opacity="0.5" />
        <path d="M36 22 L36 46 M64 22 L64 46" stroke={darken(c, 0.55)} strokeWidth="1" opacity="0.6" />
        <circle cx="34" cy="30" r="2.2" fill={lighten(c, 0.5)} opacity="0.7" />
        <circle cx="44" cy="26" r="2.2" fill={lighten(c, 0.5)} opacity="0.7" />
        <circle cx="54" cy="29" r="2.2" fill={lighten(c, 0.5)} opacity="0.7" />
        <circle cx="64" cy="27" r="2.2" fill={lighten(c, 0.5)} opacity="0.7" />
      </>
    );
  },
  t3: (c, uid) => {
    const grad = `${uid}-h3-grad`;
    const hi = `${uid}-h3-hi`;
    const clip = `${uid}-h3-clip`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.2)} />
            <stop offset="1" stopColor={darken(c, 0.12)} />
          </linearGradient>
          <radialGradient id={hi} cx="0.3" cy="0.25" r="0.6">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={clip}>
            <path d="M25 33 A25 25 0 0 1 75 33 L75 78 A25 22 0 0 1 25 78 Z" />
          </clipPath>
        </defs>
        <g>
          <path
            d="M25 33 A25 25 0 0 1 75 33 L75 78 A25 22 0 0 1 25 78 Z"
            fill={`url(#${grad})`}
            stroke={darken(c, 0.5)}
            strokeWidth="2"
          />
          <path d="M25 35 A25 25 0 0 1 75 35" fill="none" stroke={darken(c, 0.35)} strokeWidth="1" opacity="0.7" />
        </g>
        <g clipPath={`url(#${clip})`}>
          <circle cx="38" cy="55" r="3" fill={lighten(c, 0.45)} opacity="0.5" />
          <circle cx="58" cy="65" r="3" fill={lighten(c, 0.45)} opacity="0.5" />
          <circle cx="48" cy="45" r="3" fill={lighten(c, 0.45)} opacity="0.5" />
        </g>
        <ellipse cx="42" cy="28" rx="18" ry="12" fill={`url(#${hi})`} />
        <path d="M63 38 L69 41 L63 44 L65 41 Z" fill="#ffe28a" stroke="#dba528" strokeWidth="0.6" />
      </>
    );
  },
  t4: (c, uid) => {
    const grad = `${uid}-h4-grad`;
    const sheen = `${uid}-h4-sheen`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.35)} />
            <stop offset="0.5" stopColor={c} />
            <stop offset="1" stopColor={darken(c, 0.25)} />
          </linearGradient>
          <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M24 34 A26 26 0 0 1 76 34 L76 82 A26 24 0 0 1 24 82 Z"
          fill={`url(#${grad})`}
          stroke={darken(c, 0.5)}
          strokeWidth="2"
        />
        <path d="M28 40 C40 36 60 36 72 40" stroke={`url(#${sheen})`} strokeWidth="2" fill="none" />
        <circle cx="35" cy="58" r="2.4" fill="#fff4c2" stroke="#e8b93a" strokeWidth="0.6" />
        <circle cx="50" cy="66" r="2.4" fill="#fff4c2" stroke="#e8b93a" strokeWidth="0.6" />
        <circle cx="65" cy="58" r="2.4" fill="#fff4c2" stroke="#e8b93a" strokeWidth="0.6" />
        <path d="M38 15 L42 24 L50 12 L58 24 L62 15 L62 22 L38 22 Z" fill="#ffe28a" stroke="#dba528" strokeWidth="1" />
      </>
    );
  },
  t5: (c, uid, reduceMotion) => {
    const grad = `${uid}-h5-grad`;
    const glow = `${uid}-h5-glow`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.4)} />
            <stop offset="1" stopColor={darken(c, 0.2)} />
          </linearGradient>
          <filter id={glow} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M24 34 A26 26 0 0 1 76 34 L76 80 A26 24 0 0 1 24 80 Z"
          fill={`url(#${grad})`}
          stroke={darken(c, 0.45)}
          strokeWidth="2"
        />
        <motion.g
          animate={reduceMotion ? { opacity: 1 } : GLOW_PULSE_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : GLOW_PULSE_TRANSITION}
        >
          <path d="M32 20 L36 32 L28 32 Z" fill="#fff2b0" filter={`url(#${glow})`} />
          <path d="M50 10 L55 26 L45 26 Z" fill="#fff2b0" filter={`url(#${glow})`} />
          <path d="M68 20 L72 32 L64 32 Z" fill="#fff2b0" filter={`url(#${glow})`} />
        </motion.g>
      </>
    );
  },
  t6: (c, uid, reduceMotion) => {
    const grad1 = `${uid}-h6-grad1`;
    const grad2 = `${uid}-h6-grad2`;
    const grad3 = `${uid}-h6-grad3`;
    const glow = `${uid}-h6-glow`;
    return (
      <>
        <defs>
          <linearGradient id={grad1} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.45)} />
            <stop offset="0.5" stopColor={c} />
            <stop offset="1" stopColor={darken(c, 0.3)} />
          </linearGradient>
          <radialGradient id={grad2} cx="0.5" cy="0.3" r="0.7">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={grad3} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="1" stopColor="#e0a83a" />
          </linearGradient>
          <filter id={glow} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
        </defs>
        <path
          d="M24 34 A26 26 0 0 1 76 34 L76 82 A26 24 0 0 1 24 82 Z"
          fill={`url(#${grad1})`}
          stroke="#7a5cff"
          strokeWidth="2"
        />
        <ellipse cx="42" cy="26" rx="20" ry="14" fill={`url(#${grad2})`} />
        <path
          d="M50 8 L54 18 L64 18 L56 24 L59 34 L50 28 L41 34 L44 24 L36 18 L46 18 Z"
          fill={`url(#${grad3})`}
          stroke="#c98a1f"
          strokeWidth="1"
        />
        <motion.g
          animate={reduceMotion ? { opacity: 1, y: 0 } : PARTICLE_FLOAT_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : particleFloatTransition(0)}
        >
          <path d={sparklePath(26, 30, 3)} fill="#fff5c4" filter={`url(#${glow})`} />
        </motion.g>
        <motion.g
          animate={reduceMotion ? { opacity: 1, y: 0 } : PARTICLE_FLOAT_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : particleFloatTransition(0.4)}
        >
          <path d={sparklePath(74, 40, 2.4)} fill="#c9e8ff" filter={`url(#${glow})`} />
        </motion.g>
        <motion.g
          animate={reduceMotion ? { opacity: 1, y: 0 } : PARTICLE_FLOAT_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : particleFloatTransition(0.8)}
        >
          <path d={sparklePath(50, 4, 2)} fill="#ffd6f2" filter={`url(#${glow})`} />
        </motion.g>
      </>
    );
  },
};

const TOP: Record<string, Shapes> = {
  t1: (c) => <rect x="28" y="56" width="44" height="44" rx="14" fill={c} />,
  t2: (c, uid) => {
    const grad = `${uid}-t2-grad`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.25)} />
            <stop offset="1" stopColor={c} />
          </linearGradient>
        </defs>
        <rect
          x="28"
          y="56"
          width="44"
          height="44"
          rx="14"
          fill={`url(#${grad})`}
          stroke={darken(c, 0.5)}
          strokeWidth="2"
        />
        <rect x="28" y="90" width="44" height="10" rx="6" fill={darken(c, 0.3)} opacity="0.45" />
        <rect x="28" y="68" width="44" height="5" fill="#ffffff" opacity="0.8" />
        <rect x="28" y="80" width="44" height="5" fill="#ffffff" opacity="0.8" />
      </>
    );
  },
  t3: (c, uid) => {
    const grad = `${uid}-t3-grad`;
    const hi = `${uid}-t3-hi`;
    const clip = `${uid}-t3-clip`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.2)} />
            <stop offset="1" stopColor={darken(c, 0.15)} />
          </linearGradient>
          <radialGradient id={hi} cx="0.3" cy="0.2" r="0.55">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={clip}>
            <rect x="28" y="56" width="44" height="44" rx="14" />
          </clipPath>
        </defs>
        <g>
          <rect
            x="28"
            y="56"
            width="44"
            height="44"
            rx="14"
            fill={`url(#${grad})`}
            stroke={darken(c, 0.5)}
            strokeWidth="2.4"
          />
          <rect
            x="28"
            y="56"
            width="44"
            height="44"
            rx="14"
            fill="none"
            stroke={lighten(c, 0.4)}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.6"
          />
        </g>
        <g clipPath={`url(#${clip})`}>
          <circle cx="38" cy="66" r="2.6" fill={lighten(c, 0.5)} opacity="0.55" />
          <circle cx="54" cy="80" r="2.6" fill={lighten(c, 0.5)} opacity="0.55" />
          <circle cx="64" cy="70" r="2.6" fill={lighten(c, 0.5)} opacity="0.55" />
          <circle cx="46" cy="92" r="2.6" fill={lighten(c, 0.5)} opacity="0.55" />
        </g>
        <ellipse cx="42" cy="62" rx="16" ry="8" fill={`url(#${hi})`} />
        <circle cx="50" cy="64" r="2.2" fill="#fff8dc" stroke="#c9a227" strokeWidth="0.7" />
        <circle cx="50" cy="72" r="2.2" fill="#fff8dc" stroke="#c9a227" strokeWidth="0.7" />
      </>
    );
  },
  t4: (c, uid) => {
    const grad = `${uid}-t4-grad`;
    const sheen = `${uid}-t4-sheen`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.3)} />
            <stop offset="0.5" stopColor={c} />
            <stop offset="1" stopColor={darken(c, 0.3)} />
          </linearGradient>
          <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M30 58 L26 100 A10 10 0 0 0 34 116 L30 60 Z" fill={darken(c, 0.2)} opacity="0.9" />
        <path d="M70 58 L74 100 A10 10 0 0 1 66 116 L70 60 Z" fill={darken(c, 0.2)} opacity="0.9" />
        <rect
          x="28"
          y="56"
          width="44"
          height="44"
          rx="14"
          fill={`url(#${grad})`}
          stroke={darken(c, 0.55)}
          strokeWidth="2.4"
        />
        <path d="M32 64 C42 60 58 60 68 64" stroke={`url(#${sheen})`} strokeWidth="2" fill="none" />
        <circle cx="50" cy="66" r="2.4" fill="#fff4c2" stroke="#dba528" strokeWidth="0.7" />
        <path d="M40 78 L60 78" stroke="#fff4c2" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 86 L60 86" stroke="#fff4c2" strokeWidth="2" strokeLinecap="round" />
      </>
    );
  },
  t5: (c, uid, reduceMotion) => {
    const grad = `${uid}-t5-grad`;
    const glow = `${uid}-t5-glow`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.35)} />
            <stop offset="1" stopColor={darken(c, 0.25)} />
          </linearGradient>
          <filter id={glow} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect
          x="28"
          y="56"
          width="44"
          height="44"
          rx="14"
          fill={`url(#${grad})`}
          stroke={darken(c, 0.5)}
          strokeWidth="2.4"
        />
        <motion.g
          animate={reduceMotion ? { opacity: 1 } : GLOW_PULSE_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : GLOW_PULSE_TRANSITION}
        >
          <path
            d="M50 54 L54 66 L66 66 L56 74 L60 86 L50 78 L40 86 L44 74 L34 66 L46 66 Z"
            fill="#fff2b0"
            filter={`url(#${glow})`}
          />
        </motion.g>
      </>
    );
  },
  t6: (c, uid, reduceMotion) => {
    const grad1 = `${uid}-t6-grad1`;
    const grad2 = `${uid}-t6-grad2`;
    const grad3 = `${uid}-t6-grad3`;
    const glow = `${uid}-t6-glow`;
    return (
      <>
        <defs>
          <linearGradient id={grad1} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.4)} />
            <stop offset="0.5" stopColor={c} />
            <stop offset="1" stopColor={darken(c, 0.3)} />
          </linearGradient>
          <radialGradient id={grad2} cx="0.5" cy="0.25" r="0.6">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={grad3} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="1" stopColor="#e0a83a" />
          </linearGradient>
          <filter id={glow} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
        </defs>
        <rect
          x="28"
          y="56"
          width="44"
          height="44"
          rx="14"
          fill={`url(#${grad1})`}
          stroke="#7a5cff"
          strokeWidth="2.4"
        />
        <ellipse cx="42" cy="62" rx="18" ry="10" fill={`url(#${grad2})`} />
        <path
          d="M50 58 L53 66 L61 66 L54 71 L57 79 L50 74 L43 79 L46 71 L39 66 L47 66 Z"
          fill={`url(#${grad3})`}
          stroke="#c98a1f"
          strokeWidth="1"
        />
        <motion.g
          animate={reduceMotion ? { opacity: 1, y: 0 } : PARTICLE_FLOAT_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : particleFloatTransition(0)}
        >
          <path d={sparklePath(30, 60, 3)} fill="#fff5c4" filter={`url(#${glow})`} />
        </motion.g>
        <motion.g
          animate={reduceMotion ? { opacity: 1, y: 0 } : PARTICLE_FLOAT_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : particleFloatTransition(0.5)}
        >
          <path d={sparklePath(70, 92, 2.6)} fill="#c9e8ff" filter={`url(#${glow})`} />
        </motion.g>
        <motion.g
          animate={reduceMotion ? { opacity: 1, y: 0 } : PARTICLE_FLOAT_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : particleFloatTransition(1)}
        >
          <path d={sparklePath(66, 62, 2.2)} fill="#ffd6f2" filter={`url(#${glow})`} />
        </motion.g>
      </>
    );
  },
};

const BOTTOM: Record<string, Shapes> = {
  t1: (c) => (
    <>
      <rect x="31" y="96" width="16" height="32" rx="7" fill={c} />
      <rect x="53" y="96" width="16" height="32" rx="7" fill={c} />
    </>
  ),
  t2: (c, uid) => {
    const grad = `${uid}-b2-grad`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.25)} />
            <stop offset="1" stopColor={c} />
          </linearGradient>
        </defs>
        <path
          d="M32 96 L68 96 L78 122 A3 3 0 0 1 75 126 L25 126 A3 3 0 0 1 22 122 Z"
          fill={`url(#${grad})`}
          stroke={darken(c, 0.5)}
          strokeWidth="2"
        />
        <path d="M27 116 L73 116" stroke={darken(c, 0.3)} strokeWidth="4" opacity="0.4" />
        <circle cx="38" cy="106" r="1.8" fill="#ffffff" opacity="0.75" />
        <circle cx="50" cy="110" r="1.8" fill="#ffffff" opacity="0.75" />
        <circle cx="62" cy="106" r="1.8" fill="#ffffff" opacity="0.75" />
      </>
    );
  },
  t3: (c, uid) => {
    const grad = `${uid}-b3-grad`;
    const hi = `${uid}-b3-hi`;
    const clip = `${uid}-b3-clip`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.2)} />
            <stop offset="1" stopColor={darken(c, 0.15)} />
          </linearGradient>
          <radialGradient id={hi} cx="0.35" cy="0.15" r="0.5">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={clip}>
            <path d="M31 96 L69 96 L79 124 A3 3 0 0 1 76 128 L24 128 A3 3 0 0 1 21 124 Z" />
          </clipPath>
        </defs>
        <g>
          <path
            d="M31 96 L69 96 L79 124 A3 3 0 0 1 76 128 L24 128 A3 3 0 0 1 21 124 Z"
            fill={`url(#${grad})`}
            stroke={darken(c, 0.5)}
            strokeWidth="2.2"
          />
          <path d="M31 98 L69 98" stroke={lighten(c, 0.4)} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
        </g>
        <g clipPath={`url(#${clip})`}>
          <path d="M20 110 L80 106" stroke={lighten(c, 0.4)} strokeWidth="6" opacity="0.18" />
          <path d="M20 120 L80 117" stroke={lighten(c, 0.4)} strokeWidth="6" opacity="0.14" />
        </g>
        <ellipse cx="42" cy="100" rx="14" ry="6" fill={`url(#${hi})`} />
        <rect x="40" y="96" width="20" height="7" rx="3" fill={darken(c, 0.4)} />
        <circle cx="50" cy="99.5" r="2.2" fill="#fff4c2" stroke="#c9a227" strokeWidth="0.6" />
      </>
    );
  },
  t4: (c, uid) => {
    const grad = `${uid}-b4-grad`;
    const sheen = `${uid}-b4-sheen`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.3)} />
            <stop offset="0.5" stopColor={c} />
            <stop offset="1" stopColor={darken(c, 0.3)} />
          </linearGradient>
          <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M30 96 H70 L77 126 A3 3 0 0 1 74 130 H26 A3 3 0 0 1 23 126 Z"
          fill={`url(#${grad})`}
          stroke={darken(c, 0.55)}
          strokeWidth="2.2"
        />
        <path d="M64 96 L74 128 L68 130 L58 98 Z" fill={darken(c, 0.25)} opacity="0.85" />
        <path d="M32 102 C42 98 58 98 68 102" stroke={`url(#${sheen})`} strokeWidth="2" fill="none" />
        <circle cx="38" cy="112" r="2.2" fill="#fff4c2" stroke="#dba528" strokeWidth="0.6" />
        <circle cx="50" cy="116" r="2.2" fill="#fff4c2" stroke="#dba528" strokeWidth="0.6" />
        <circle cx="62" cy="112" r="2.2" fill="#fff4c2" stroke="#dba528" strokeWidth="0.6" />
      </>
    );
  },
  t5: (c, uid, reduceMotion) => {
    const grad = `${uid}-b5-grad`;
    const glow = `${uid}-b5-glow`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.35)} />
            <stop offset="1" stopColor={darken(c, 0.25)} />
          </linearGradient>
          <filter id={glow} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M30 96 H70 L78 124 A3 3 0 0 1 75 128 H25 A3 3 0 0 1 22 124 Z"
          fill={`url(#${grad})`}
          stroke={darken(c, 0.5)}
          strokeWidth="2.2"
        />
        <motion.g
          animate={reduceMotion ? { opacity: 1 } : GLOW_PULSE_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : GLOW_PULSE_TRANSITION}
        >
          <path d="M50 108 L54 118 L50 128 L46 118 Z" fill="#c9f0ff" filter={`url(#${glow})`} />
          <path d="M34 112 L37 120 L34 128 L31 120 Z" fill="#c9f0ff" filter={`url(#${glow})`} opacity="0.85" />
          <path d="M66 112 L69 120 L66 128 L63 120 Z" fill="#c9f0ff" filter={`url(#${glow})`} opacity="0.85" />
        </motion.g>
      </>
    );
  },
  t6: (c, uid, reduceMotion) => {
    const grad1 = `${uid}-b6-grad1`;
    const grad2 = `${uid}-b6-grad2`;
    const grad3 = `${uid}-b6-grad3`;
    const glow = `${uid}-b6-glow`;
    return (
      <>
        <defs>
          <linearGradient id={grad1} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.4)} />
            <stop offset="0.5" stopColor={c} />
            <stop offset="1" stopColor={darken(c, 0.3)} />
          </linearGradient>
          <radialGradient id={grad2} cx="0.5" cy="0.2" r="0.6">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={grad3} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="1" stopColor="#e0a83a" />
          </linearGradient>
          <filter id={glow} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
        </defs>
        <path
          d="M30 96 H70 L78 124 A3 3 0 0 1 75 128 H25 A3 3 0 0 1 22 124 Z"
          fill={`url(#${grad1})`}
          stroke="#7a5cff"
          strokeWidth="2.2"
        />
        <ellipse cx="42" cy="100" rx="16" ry="6" fill={`url(#${grad2})`} />
        <path
          d="M50 106 L52 112 L58 112 L53 116 L55 122 L50 118 L45 122 L47 116 L42 112 L48 112 Z"
          fill={`url(#${grad3})`}
          stroke="#c98a1f"
          strokeWidth="1"
        />
        <motion.g
          animate={reduceMotion ? { opacity: 1, y: 0 } : PARTICLE_FLOAT_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : particleFloatTransition(0.2)}
        >
          <path d={sparklePath(28, 118, 2.6)} fill="#fff5c4" filter={`url(#${glow})`} />
        </motion.g>
        <motion.g
          animate={reduceMotion ? { opacity: 1, y: 0 } : PARTICLE_FLOAT_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : particleFloatTransition(0.7)}
        >
          <path d={sparklePath(72, 116, 2.4)} fill="#c9e8ff" filter={`url(#${glow})`} />
        </motion.g>
      </>
    );
  },
};

const NECKLACE: Record<string, Shapes> = {
  t1: (c, uid, _reduceMotion, motif) => (
    <>
      <path d="M40 58 A12 10 0 0 0 60 58" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Charm motif={motif} uid={uid} baseColor={c} cx={50} cy={70} r={5} fill={c} />
    </>
  ),
  t2: (c, uid, _reduceMotion, motif) => {
    const grad = `${uid}-n2-grad`;
    return (
      <>
        <defs>
          <radialGradient id={grad} cx="0.35" cy="0.3" r="0.7">
            <stop offset="0" stopColor={lighten(c, 0.5)} />
            <stop offset="1" stopColor={darken(c, 0.15)} />
          </radialGradient>
        </defs>
        <path d="M40 58 A12 10 0 0 0 60 58" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Charm motif={motif} uid={uid} baseColor={c} cx={50} cy={70} r={5} fill={`url(#${grad})`} stroke={darken(c, 0.4)} strokeWidth={1} />
        <circle cx="42" cy="65" r="2.2" fill={`url(#${grad})`} />
        <circle cx="58" cy="65" r="2.2" fill={`url(#${grad})`} />
      </>
    );
  },
  t3: (c, uid, _reduceMotion, motif) => {
    const grad = `${uid}-n3-grad`;
    const hi = `${uid}-n3-hi`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.25)} />
            <stop offset="1" stopColor={darken(c, 0.15)} />
          </linearGradient>
          <radialGradient id={hi} cx="0.35" cy="0.3" r="0.6">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M39 58 A13 10 0 0 0 61 58" stroke={c} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <Charm motif={motif} uid={uid} baseColor={c} cx={50} cy={73} r={9} fill={`url(#${grad})`} stroke={darken(c, 0.5)} strokeWidth={1} />
        <g opacity="0.9">
          <Charm motif={motif} uid={uid} baseColor={c} cx={50} cy={71} r={4.5} fill={`url(#${hi})`} />
          <circle cx="42" cy="66" r="1.4" fill={lighten(c, 0.5)} />
          <circle cx="58" cy="66" r="1.4" fill={lighten(c, 0.5)} />
        </g>
      </>
    );
  },
  t4: (c, uid, _reduceMotion, motif) => {
    const grad = `${uid}-n4-grad`;
    const sheen = `${uid}-n4-sheen`;
    return (
      <>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={lighten(c, 0.35)} />
            <stop offset="0.5" stopColor={c} />
            <stop offset="1" stopColor={darken(c, 0.3)} />
          </linearGradient>
          <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M38 58 A14 10 0 0 0 62 58" stroke={c} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d="M34 60 A18 13 0 0 0 66 60" stroke={darken(c, 0.3)} strokeWidth="1.2" fill="none" opacity="0.5" />
        <Charm motif={motif} uid={uid} baseColor={c} cx={50} cy={73} r={7} fill={`url(#${grad})`} stroke={darken(c, 0.5)} strokeWidth={1.2} />
        <circle cx="47.5" cy="70.5" r="2.4" fill={`url(#${sheen})`} />
        <circle cx="41" cy="66" r="2" fill={c} stroke={darken(c, 0.4)} strokeWidth="0.6" />
        <circle cx="59" cy="66" r="2" fill={c} stroke={darken(c, 0.4)} strokeWidth="0.6" />
      </>
    );
  },
  t5: (c, uid, reduceMotion, motif) => {
    const grad = `${uid}-n5-grad`;
    const glow = `${uid}-n5-glow`;
    return (
      <>
        <defs>
          <radialGradient id={grad} cx="0.35" cy="0.3" r="0.7">
            <stop offset="0" stopColor={lighten(c, 0.5)} />
            <stop offset="1" stopColor={darken(c, 0.2)} />
          </radialGradient>
          <filter id={glow} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d="M37 58 A15 11 0 0 0 63 58" stroke={c} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <motion.g
          animate={reduceMotion ? { opacity: 1 } : GLOW_PULSE_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : GLOW_PULSE_TRANSITION}
        >
          <Charm motif={motif} uid={uid} baseColor={c} cx={50} cy={75} r={11} fill={`url(#${grad})`} filter={`url(#${glow})`} />
        </motion.g>
      </>
    );
  },
  t6: (c, uid, reduceMotion, motif) => {
    const grad1 = `${uid}-n6-grad1`;
    const grad2 = `${uid}-n6-grad2`;
    const grad3 = `${uid}-n6-grad3`;
    const glow = `${uid}-n6-glow`;
    return (
      <>
        <defs>
          <radialGradient id={grad1} cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor={lighten(c, 0.5)} />
            <stop offset="0.6" stopColor={c} />
            <stop offset="1" stopColor={darken(c, 0.3)} />
          </radialGradient>
          <linearGradient id={grad2} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={grad3} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="1" stopColor="#e0a83a" />
          </linearGradient>
          <filter id={glow} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        <path d="M36 58 A16 11 0 0 0 64 58" stroke="#7a5cff" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <Charm motif={motif} uid={uid} baseColor={c} cx={50} cy={74} r={8} fill={`url(#${grad1})`} stroke="#7a5cff" strokeWidth={1.2} />
        <ellipse cx="47" cy="71" rx="3" ry="2" fill={`url(#${grad2})`} />
        {/* T6の「アイテム固有のシンボル」は、モチーフと無関係な固定の星バッジだと
            主形状を隠して全部「星の上に何か乗っている」ように見えてしまっていた。
            同じmotifのミニチュアを金色で右肩に添えることで、モチーフ自体を強調する */}
        <Charm
          motif={motif}
          uid={`${uid}-mini`}
          baseColor={c}
          cx={60}
          cy={64}
          r={3.4}
          fill={`url(#${grad3})`}
          stroke="#c98a1f"
          strokeWidth={0.6}
        />
        <motion.g
          animate={reduceMotion ? { opacity: 1, y: 0 } : PARTICLE_FLOAT_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : particleFloatTransition(0.1)}
        >
          <path d={sparklePath(36, 64, 2.2)} fill="#fff5c4" filter={`url(#${glow})`} />
        </motion.g>
        <motion.g
          animate={reduceMotion ? { opacity: 1, y: 0 } : PARTICLE_FLOAT_ANIMATE}
          transition={reduceMotion ? STATIC_TRANSITION : particleFloatTransition(0.6)}
        >
          <path d={sparklePath(64, 64, 2)} fill="#c9e8ff" filter={`url(#${glow})`} />
        </motion.g>
      </>
    );
  },
};

const SHAPES: Record<SlotType, Record<string, Shapes>> = {
  hair: HAIR,
  top: TOP,
  bottom: BOTTOM,
  necklace: NECKLACE,
};

const renderSlot = (
  slot: SlotType,
  asset: AvatarAsset | undefined,
  uid: string,
  reduceMotion: boolean,
): ReactNode => {
  if (!asset) return null;
  const shapes = SHAPES[slot];
  const draw = shapes[asset.variant] ?? shapes.t1;
  return draw(asset.color, uid, reduceMotion, asset.motif);
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

// 肩（rectの上端中央）を回転の軸にする。
//
// **CSSの transform-origin では効かない**。Framer MotionはSVG要素にtransformを
// 書き込むとき、transform-origin を自前で組み立て直し、originX/originY を
// 渡していないと "50% 50%" で上書きしてしまう
// （motion-dom の render/svg/utils/build-attrs.mjs）。初期描画では指定が残るが、
// アニメーションが走った瞬間に中心回転に化ける。
// Motion自身の originX / originY（0〜1の割合）で渡すこと。
const ARM_PIVOT = { originX: 0.5, originY: 0.08 } as const;

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

// useIdはコロンを含む("«r1»"等)。SVGのid属性値としては動作するが、
// url(#...)参照の可読性・安全性のため取り除いておく
const sanitizeId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, "");

export const ItemThumb = ({
  slot,
  asset,
  className = "",
}: {
  slot: SlotType;
  asset: AvatarAsset;
  className?: string;
}) => {
  const uid = sanitizeId(useId());
  const reduceMotion = !!useReducedMotion();
  return (
    <svg viewBox={THUMB_VIEWBOX[slot]} className={className} aria-hidden>
      {renderSlot(slot, asset, uid, reduceMotion)}
    </svg>
  );
};

export const Avatar = ({
  equipped,
  armPose = "down",
  className = "",
}: {
  equipped: Partial<Record<SlotType, AvatarAsset>>;
  armPose?: ArmPose;
  className?: string;
}) => {
  const uid = sanitizeId(useId());
  const reduceMotion = !!useReducedMotion();
  return (
    <svg viewBox="0 0 100 140" className={className} role="img" aria-label="じぶんの キャラクター">
      {/* かみは からだより後ろに描く。それ以外は SLOT_DRAW_ORDER の順で重ねる */}
      {renderSlot("hair", equipped.hair, uid, reduceMotion)}
      <BaseBody armPose={armPose} />
      {SLOT_DRAW_ORDER.filter((slot) => slot !== "hair").map((slot) => (
        <g key={slot}>{renderSlot(slot, equipped[slot], uid, reduceMotion)}</g>
      ))}
    </svg>
  );
};
