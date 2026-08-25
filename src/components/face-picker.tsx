"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/avatar";
import { updateFaceAction } from "@/app/face/actions";
import {
  EYE_STYLE_OPTIONS,
  MOUTH_STYLE_OPTIONS,
  SKIN_TONE_OPTIONS,
  type ChildFace,
  type EyeStyle,
  type MouthStyle,
  type SkinTone,
} from "@/lib/face";

// 顔をえらぶ画面。着せ替え（きせかえ）と違い、ポイントも解放条件も無い
// （docs/game-design.md「顔をえらぶ」）。タップした瞬間にその場で見た目を変え、
// 確認ダイアログは挟まない（きせかえの「着る」と同じ考え方）

type Row<T extends string> = { label: string; options: readonly T[]; value: T; onPick: (v: T) => void };

const SwatchRow = <T extends string>({ label, options, value, onPick, disabled }: Row<T> & { disabled: boolean }) => (
  <div className="flex w-full flex-col items-center gap-2">
    <p className="text-sm font-bold text-foreground/80">{label}</p>
    <ul className="flex flex-wrap justify-center gap-2">
      {options.map((option) => (
        <li key={option}>
          <motion.button
            type="button"
            whileTap={disabled ? undefined : { scale: 0.95 }}
            disabled={disabled}
            onClick={() => onPick(option)}
            aria-pressed={value === option}
            className={`min-h-11 min-w-11 rounded-full p-1 ${
              value === option ? "bg-brand/25 ring-2 ring-brand" : "bg-white/70"
            }`}
          >
            <SwatchPreview part={label} option={option} />
          </motion.button>
        </li>
      ))}
    </ul>
  </div>
);

// 各スワッチの中身。実際に選んだときと同じ<Avatar>を小さく出すことで、
// 見た目とプレビューが必ず一致するようにする（ラベルだけだと未就学〜低学年には
// 伝わらないため。docs/design.md の対象年齢を踏まえた判断）
const SwatchPreview = ({ part, option }: { part: string; option: string }) => {
  const props =
    part === "はだの いろ"
      ? { skinTone: option as SkinTone }
      : part === "め"
        ? { eyeStyle: option as EyeStyle }
        : { mouthStyle: option as MouthStyle };
  return <Avatar equipped={{}} {...props} className="h-9 w-auto" />;
};

export const FacePicker = ({ initialFace }: { initialFace: ChildFace }) => {
  const [face, setFace] = useState<ChildFace>(initialFace);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const pick = <K extends keyof ChildFace>(key: K, value: ChildFace[K]) => {
    if (pending) return;
    const previous = face;
    setMessage(null);
    setFace((current) => ({ ...current, [key]: value }));

    startTransition(async () => {
      const result = await updateFaceAction({ [key]: value });
      if (!result.ok) {
        setFace(previous);
        setMessage("うまく へんこう できなかったよ。もういちど ためしてね");
      }
    });
  };

  return (
    <div className="flex min-h-0 w-full max-w-2xl flex-1 flex-col items-center gap-[clamp(0.5rem,2vh,1.25rem)]">
      <Avatar
        equipped={{}}
        skinTone={face.skinTone}
        eyeStyle={face.eyeStyle}
        mouthStyle={face.mouthStyle}
        className="h-[clamp(5rem,16vh,8rem)] w-auto shrink-0"
      />

      <div
        role="status"
        aria-live="polite"
        className="min-h-6 text-center text-sm font-bold text-foreground/80"
      >
        {message}
      </div>

      <SwatchRow
        label="はだの いろ"
        options={SKIN_TONE_OPTIONS}
        value={face.skinTone}
        onPick={(v) => pick("skinTone", v)}
        disabled={pending}
      />
      <SwatchRow
        label="め"
        options={EYE_STYLE_OPTIONS}
        value={face.eyeStyle}
        onPick={(v) => pick("eyeStyle", v)}
        disabled={pending}
      />
      <SwatchRow
        label="くち"
        options={MOUTH_STYLE_OPTIONS}
        value={face.mouthStyle}
        onPick={(v) => pick("mouthStyle", v)}
        disabled={pending}
      />
    </div>
  );
};
