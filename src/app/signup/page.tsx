"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { DigitBoxes } from "@/components/digit-boxes";
import { registerChild, type RegisterChildResult } from "@/app/signup/actions";

const CODE_LENGTH = 6;

type Credentials = Extract<RegisterChildResult, { success: true }>;

const SignupPage = () => {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const handleStart = async () => {
    setSubmitting(true);
    setError(false);
    const result = await registerChild();
    setSubmitting(false);

    if (!result.success) {
      setError(true);
      return;
    }
    setCredentials(result);
  };

  const handleConfirm = () => {
    router.push("/login");
  };

  if (credentials) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,1.5rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,2.5rem)] text-center">
        <h1 className="text-[clamp(1.125rem,2vh+0.75rem,1.5rem)] font-bold text-foreground">
          とうろく できたよ！
        </h1>

        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold text-foreground/70">ID（あいでぃー）</p>
          <DigitBoxes length={CODE_LENGTH} value={credentials.loginId} ariaHidden={false} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold text-foreground/70">ひみつのばんごう</p>
          <DigitBoxes length={CODE_LENGTH} value={credentials.pin} ariaHidden={false} />
        </div>

        <p className="text-sm text-foreground/70">
          あなたの なまえは「{credentials.nickname}」だよ
        </p>

        <p className="max-w-sm rounded-md bg-warning/20 px-4 py-3 text-sm font-bold text-foreground">
          だいじな ばんごうだよ！かみに かいて とっておくか、おとうさん・おかあさんに
          おぼえて もらってね。つぎの がめんで じぶんで うちこんで たしかめるよ。
        </p>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handleConfirm}
          className="rounded-full bg-brand px-10 py-3 text-xl font-bold text-brand-foreground"
        >
          かいたよ！つぎへ
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,3vh,1.5rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,2.5rem)] text-center">
      <p className="text-3xl" aria-hidden>
        📝
      </p>
      <h1 className="text-[clamp(1.125rem,2vh+0.75rem,1.5rem)] font-bold text-foreground">
        あたらしく とうろく しよう！
      </h1>
      <p className="max-w-sm text-foreground/70">
        ボタンを おすと、あなただけの「ID（あいでぃー）」と「ひみつのばんごう」が
        できるよ。つぎに ログインする ときに つかうから、かみに かいておくか、
        おとうさん・おかあさんに おぼえて もらってね。
      </p>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ x: 0 }}
            animate={{ x: [0, -8, 8, -8, 8, 0] }}
            transition={{ duration: 0.4 }}
            className="rounded-md bg-warning/20 px-4 py-2 text-center font-bold text-foreground"
          >
            うまく とうろく できなかったよ。もういちど ためしてね
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        disabled={submitting}
        onClick={handleStart}
        className="rounded-full bg-brand px-10 py-3 text-xl font-bold text-brand-foreground disabled:opacity-40"
      >
        {submitting ? "つくっているよ…" : "はじめる"}
      </motion.button>

      <Link href="/" className="text-sm font-bold text-foreground/50 underline">
        とっぷに もどる
      </Link>
    </div>
  );
};

export default SignupPage;
