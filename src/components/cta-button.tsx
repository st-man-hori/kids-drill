"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export const CtaButton = ({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}) => {
  const base =
    "flex h-14 items-center justify-center rounded-full px-8 text-xl font-bold w-full sm:w-auto";
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
