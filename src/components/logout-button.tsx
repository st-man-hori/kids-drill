"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";

export const LogoutButton = ({ size = "default" }: { size?: "default" | "compact" }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const sizeStyles = size === "compact" ? "px-4 py-1.5 text-sm" : "px-8 py-3 text-lg";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={handleLogout}
      className={`rounded-full border-2 border-brand bg-white font-bold text-brand ${sizeStyles}`}
    >
      ログアウト
    </motion.button>
  );
};
