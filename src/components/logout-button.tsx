"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";

export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={handleLogout}
      className="rounded-full border-2 border-brand bg-white px-8 py-3 text-lg font-bold text-brand"
    >
      ログアウト
    </motion.button>
  );
};
