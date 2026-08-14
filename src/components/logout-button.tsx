"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";

// 置き場所はマイページのみ。ヘッダーに常設すると、遊んでいる最中に
// 誤って押されて中断される（ヘッダー右はマイページ／ログインへの案内にした）
export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    // ヘッダーはRoot Layout配下のServer Componentなので、pushだけだと
    // キャッシュされた（ログイン中の）レンダリング結果が再利用され、
    // ログアウトボタンが残り続けることがある。refreshで再取得させる。
    router.refresh();
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
