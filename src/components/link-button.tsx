"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export const LinkButton = ({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}) => {
  // 高さ・文字とも、上限をタブレット基準にする。スマホ側は下限が守る
  // （docs/design.md「タッチ領域とサイズ」）
  const base =
    "flex h-[clamp(3.5rem,7vh,4.5rem)] items-center justify-center rounded-full px-[clamp(2rem,5vw,3rem)] text-[clamp(1.25rem,1.6vh+0.6rem,1.625rem)] font-bold w-full sm:w-auto";
  const styles =
    variant === "primary"
      ? "bg-brand text-brand-foreground shadow-sm"
      : "bg-white text-brand border-2 border-brand";

  return (
    <motion.div whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
      <Link href={href} className={`${base} ${styles}`}>
        {children}
      </Link>
    </motion.div>
  );
};
