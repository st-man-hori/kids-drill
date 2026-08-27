// 顔（肌の色・目・口）まわりの純粋な定義。DBアクセスは持ち込まないこと
// （Client Componentからも読み込むため）。DBを触る処理は face-store.ts 側。
// 実際の描画（色・形）は src/components/avatar.tsx が持つ。ここはidの一覧だけを
// 公開し、avatar.tsx側はこのidに対して型で描画が漏れなく揃っているかを保証する
// （docs/game-design.md「顔をえらぶ」参照）。

export const SKIN_TONE_OPTIONS = ["light", "beige", "tan", "brown", "deep"] as const;
export type SkinTone = (typeof SKIN_TONE_OPTIONS)[number];

export const EYE_STYLE_OPTIONS = ["dot", "round", "happy", "star", "sleepy", "wink", "cat"] as const;
export type EyeStyle = (typeof EYE_STYLE_OPTIONS)[number];

export const MOUTH_STYLE_OPTIONS = ["smile", "grin", "small", "surprised", "giggle", "tongue", "cat"] as const;
export type MouthStyle = (typeof MOUTH_STYLE_OPTIONS)[number];

export const DEFAULT_SKIN_TONE: SkinTone = "light";
export const DEFAULT_EYE_STYLE: EyeStyle = "dot";
export const DEFAULT_MOUTH_STYLE: MouthStyle = "smile";

export const isSkinTone = (value: unknown): value is SkinTone =>
  typeof value === "string" && (SKIN_TONE_OPTIONS as readonly string[]).includes(value);

export const isEyeStyle = (value: unknown): value is EyeStyle =>
  typeof value === "string" && (EYE_STYLE_OPTIONS as readonly string[]).includes(value);

export const isMouthStyle = (value: unknown): value is MouthStyle =>
  typeof value === "string" && (MOUTH_STYLE_OPTIONS as readonly string[]).includes(value);

export type ChildFace = {
  skinTone: SkinTone;
  eyeStyle: EyeStyle;
  mouthStyle: MouthStyle;
};
