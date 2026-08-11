"use client";

import { motion } from "framer-motion";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

export function NumericKeypad({
  onDigit,
  onBackspace,
  disabled,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
      {KEYS.map((key, i) => {
        if (key === "") return <div key={i} />;

        if (key === "back") {
          return (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.9 }}
              disabled={disabled}
              onClick={onBackspace}
              aria-label="1文字けす"
              className="aspect-square rounded-md bg-black/5 text-2xl font-bold text-foreground disabled:opacity-40"
            >
              ⌫
            </motion.button>
          );
        }

        return (
          <motion.button
            key={i}
            type="button"
            whileTap={{ scale: 0.9 }}
            disabled={disabled}
            onClick={() => onDigit(key)}
            className="aspect-square rounded-md bg-brand text-3xl font-bold text-brand-foreground shadow-sm disabled:opacity-40"
          >
            {key}
          </motion.button>
        );
      })}
    </div>
  );
}
