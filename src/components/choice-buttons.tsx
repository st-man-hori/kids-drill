"use client";

import { motion } from "framer-motion";

// よみがなモード（国語スパイク）の4択回答ボタン。NumericKeypadの代わりに使う。
// タップ＝回答そのものなので、数字パッドと違って「こたえる」の確認ボタンは無い。
export const ChoiceButtons = ({
  choices,
  onSelect,
  disabled,
  correctReading,
  selected,
}: {
  choices: string[];
  onSelect: (choice: string) => void;
  disabled?: boolean;
  // 答え合わせ後だけ渡す。正解を緑、選んでしまった誤答をオレンジで示す
  correctReading?: string;
  selected?: string | null;
}) => {
  const toneClass = (choice: string) => {
    if (disabled && choice === correctReading) return "bg-success text-brand-foreground";
    if (disabled && choice === selected) return "bg-warning text-foreground";
    if (disabled) return "bg-brand/30 text-brand-foreground/60";
    return "bg-brand text-brand-foreground shadow-sm";
  };

  return (
    <div className="grid w-full max-w-[min(28rem,85vw,34vh)] grid-cols-2 gap-[min(0.75rem,1.5vh)]">
      {choices.map((choice) => (
        <motion.button
          key={choice}
          type="button"
          whileTap={{ scale: 0.95 }}
          disabled={disabled}
          onClick={() => onSelect(choice)}
          className={`rounded-full px-4 py-[clamp(0.875rem,2vh,1.25rem)] text-[clamp(1.375rem,2vh+0.75rem,1.875rem)] font-bold ${toneClass(choice)}`}
        >
          {choice}
        </motion.button>
      ))}
    </div>
  );
};
