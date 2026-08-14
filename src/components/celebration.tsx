"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CelebrationTier } from "@/lib/practice";

// 結果画面に重ねるクラッカー（パーティーポッパー）の演出。
// レイアウトには一切影響させない（絶対配置＋pointer-events-none）。
// docs/design.md の「スクロールなし方針」があるので、演出のために要素を
// 積んで画面を伸ばすことはしない。

// 色はブランドカラーとアクセント（正解＝グリーン、やさしいオレンジ〜黄）から取る
const PIECE_COLORS = ["bg-brand", "bg-success", "bg-warning"];

// 段階ごとの打ち上げ方。perfectは左右2発、greatは中央1発と、
// 「発数」でも差が分かるようにしている。
// good以下は紙吹雪を出さず、見出しのメッセージだけで差をつける
// （出す/出さないの差がいちばん分かりやすいため）
const BURSTS: Record<CelebrationTier, { origins: number[]; perOrigin: number }> = {
  perfect: { origins: [12, 88], perOrigin: 22 },
  great: { origins: [50], perOrigin: 18 },
  good: { origins: [], perOrigin: 0 },
  gentle: { origins: [], perOrigin: 0 },
};

type Piece = {
  originX: number;
  burstX: number;
  burstY: number;
  driftX: number;
  fallY: number;
  sway: number;
  angle: number;
  spin: number;
  flip: number;
  width: number;
  height: number;
  color: string;
  delay: number;
  duration: number;
  streamer: boolean;
};

const random = (min: number, max: number) => min + Math.random() * (max - min);

// originXの位置から、真上を90度として扇状に飛ばす
const createPieces = (origins: number[], perOrigin: number): Piece[] =>
  origins.flatMap((originX, originIndex) => {
    // 左端の発射口は右上へ、右端は左上へ、中央は真上へ向ける
    const baseAngle = originX < 40 ? 58 : originX > 60 ? 122 : 90;

    return Array.from({ length: perOrigin }, () => {
      const angle = random(baseAngle - 34, baseAngle + 34);
      const radians = (angle * Math.PI) / 180;
      const speed = random(150, 370);
      // リボンは細長く、紙吹雪は正方形に近い形にする
      const streamer = Math.random() < 0.45;
      // 小さめに散らすほど「ひらひら」に見える
      const size = random(4, 8);

      return {
        originX,
        burstX: Math.cos(radians) * speed,
        // 画面座標はy軸が下向きなので、上へ飛ばすには符号を反転する
        burstY: -Math.sin(radians) * speed,
        driftX: random(-50, 50),
        fallY: random(380, 720),
        // 落下中に左右へ流れる幅
        sway: random(20, 55) * (Math.random() < 0.5 ? -1 : 1),
        angle,
        // 軽い紙なので回転はゆっくりめ
        spin: random(-420, 420),
        // 紙が裏返る周期(秒)。1枚ずつバラすと群れがひらひらして見える
        flip: random(0.5, 1.2),
        width: size,
        height: streamer ? size * random(2.5, 4.5) : size,
        color: PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)],
        // 2発目はわずかに遅らせて「パン、パン」と鳴った感じにする
        delay: originIndex * 0.18 + random(0, 0.16),
        // 軽いぶんゆっくり落ちる
        duration: random(2.6, 3.9),
        streamer,
      };
    });
  });

// 「もっと やる」で次の10問に進むたびに演出をやり直したい場合は、
// 呼び出し側で key を変えて再マウントさせる
export const Celebration = ({ tier }: { tier: CelebrationTier }) => {
  const reduceMotion = useReducedMotion();
  const { origins, perOrigin } = BURSTS[tier];

  // 再描画のたびに軌道が変わらないよう、この結果画面のあいだは同じものを使い回す
  const pieces = useMemo(
    () => (reduceMotion ? [] : createPieces(origins, perOrigin)),
    [origins, perOrigin, reduceMotion],
  );

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* 発射口の閃光。クラッカーが「パンッ」と弾けた瞬間を示す */}
      {origins.map((originX, index) => (
        <motion.div
          key={`burst-${originX}`}
          data-burst
          initial={{ scale: 0.2, opacity: 0.7 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.18 }}
          style={{ left: `${originX}%`, bottom: "14%" }}
          className="absolute h-16 w-16 -translate-x-1/2 translate-y-1/2 rounded-full bg-warning/70"
        />
      ))}

      {pieces.map((piece, index) => (
        <motion.div
          key={index}
          data-particle
          initial={{ x: 0, y: 0, rotate: piece.angle, opacity: 1 }}
          animate={{
            // 飛び出し→頂点→そこから左右に揺れながら落ちる。
            // xを一定の傾きで動かすと「まっすぐ落ちる」ので、
            // 折り返しを挟んでひらひらさせる
            x: [
              0,
              piece.burstX,
              piece.burstX + piece.sway,
              piece.burstX - piece.sway * 0.7,
              piece.burstX + piece.sway * 1.25,
              piece.burstX + piece.driftX,
            ],
            // 落下はだんだん速く、ただし紙は軽いので加速しすぎない刻みにする
            y: [
              0,
              piece.burstY,
              piece.burstY + piece.fallY * 0.12,
              piece.burstY + piece.fallY * 0.34,
              piece.burstY + piece.fallY * 0.64,
              piece.burstY + piece.fallY,
            ],
            rotate: [
              piece.angle,
              piece.angle + piece.spin * 0.2,
              piece.angle + piece.spin * 0.42,
              piece.angle + piece.spin * 0.62,
              piece.angle + piece.spin * 0.83,
              piece.angle + piece.spin,
            ],
            // 紙が裏返る動き。ひらひら感はほぼこれが作っている
            rotateY: [0, 360],
            opacity: [1, 1, 1, 1, 0.85, 0],
          }}
          transition={{
            duration: piece.duration,
            times: [0, 0.22, 0.44, 0.62, 0.82, 1],
            // 飛び出しは減速(easeOut)、落下は加速(easeIn)。放物線を描かせるには
            // 区間ごとに向きの違うイージングが要るので、ここだけはspringを使わない
            // （docs/design.md のモーション方針の例外。リニアは使っていない）。
            // 揺れの区間はeaseInOutにして、折り返しで一瞬止まる感じを出す
            ease: ["easeOut", "easeInOut", "easeInOut", "easeInOut", "easeIn"],
            delay: piece.delay,
            // 裏返りだけは落下と独立した周期でループさせる
            rotateY: {
              duration: piece.flip,
              repeat: Infinity,
              ease: "easeInOut",
              delay: piece.delay,
            },
          }}
          style={{
            left: `${piece.originX}%`,
            bottom: "14%",
            width: piece.width,
            height: piece.height,
            // 裏返りに奥行きを与える。無いと単に潰れて見える
            transformPerspective: 500,
          }}
          // 直角は使わない（docs/design.md）
          className={`absolute ${piece.color} ${piece.streamer ? "rounded-full" : "rounded-sm"}`}
        />
      ))}
    </div>
  );
};
