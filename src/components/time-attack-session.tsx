"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { NumericKeypad } from "@/components/numeric-keypad";
import { ReactingAvatar } from "@/components/reacting-avatar";
import type { AvatarAsset, SlotType } from "@/lib/wardrobe";
import { submitTimeAttackRun, type TimeAttackResult } from "@/app/time-attack/actions";
import { answerMaxLength, generateQuestion, type LevelConfig, type Question } from "@/lib/practice";
import {
  TIME_ATTACK_DURATION_SECONDS,
  TIME_ATTACK_FLASH_MS,
  TIME_ATTACK_PENALTY_SECONDS,
  TIME_ATTACK_TICK_MS,
} from "@/lib/time-attack";

// docs/game-design.md「タイムアタックモード」: 問題数の上限は無く時間切れまで
// 出題し続け、不正解にはペナルティ、フィードバックは最小限でテンポを止めない。
// 練習モード(PracticeSession)と違って「1問ごとに待つ」設計を持たない。

type Phase = "idle" | "playing" | "finished";
type Flash = { type: "correct" | "incorrect"; key: number };

// 上限をタブレット基準にする(docs/design.md)。practice-session.tsxと同じ値
const buttonClass =
  "rounded-full px-[clamp(2.5rem,6vw,3.5rem)] py-[clamp(0.75rem,1.5vh,1.125rem)] text-[clamp(1.25rem,1.6vh+0.6rem,1.625rem)] font-bold disabled:opacity-40";
const primaryButtonClass = `${buttonClass} bg-brand text-brand-foreground shadow-sm`;
const secondaryButtonClass = `${buttonClass} border-2 border-brand bg-white text-brand`;

const PENALTY_MS = TIME_ATTACK_PENALTY_SECONDS * 1000;
const DURATION_MS = TIME_ATTACK_DURATION_SECONDS * 1000;

export const TimeAttackSession = ({
  config,
  equipped = {},
}: {
  config: LevelConfig;
  equipped?: Partial<Record<SlotType, AvatarAsset>>;
}) => {
  const [, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [current, setCurrent] = useState<Question | null>(null);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [summary, setSummary] = useState<TimeAttackResult | null>(null);
  const maxLength = answerMaxLength(config);
  const flashKey = useRef(0);
  const submittedRef = useRef(false);

  const handleStart = useCallback(() => {
    submittedRef.current = false;
    setSummary(null);
    setScore(0);
    setInput("");
    setFlash(null);
    setRemainingMs(DURATION_MS);
    setCurrent(generateQuestion(config));
    setPhase("playing");
  }, [config]);

  // 60秒のカウントダウン。不正解のペナルティはhandleCheck側でremainingMsを
  // 直接減らす(タイマーの外で処理する)。0になったらそのままこのタイマーの
  // コールバック内でphaseも終了に切り替える
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setRemainingMs((ms) => {
        const next = Math.max(ms - TIME_ATTACK_TICK_MS, 0);
        if (next <= 0) setPhase("finished");
        return next;
      });
    }, TIME_ATTACK_TICK_MS);
    return () => clearInterval(id);
  }, [phase]);

  // フラッシュは自動で消える。次の問題の表示や入力は止めない
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), TIME_ATTACK_FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  // 終了したこの回の記録を送る。StrictModeでeffectが2回走っても
  // 二重送信しないようsubmittedRefで見張る(practice-session.tsxと同じ理由)
  useEffect(() => {
    if (phase !== "finished" || submittedRef.current) return;
    submittedRef.current = true;

    startTransition(async () => {
      try {
        const result = await submitTimeAttackRun({ correctCount: score });
        if (result) setSummary(result);
      } catch (error) {
        console.error(error);
      }
    });
  }, [phase, score, startTransition]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (phase !== "playing") return;
      setInput((value) => (value.length >= maxLength ? value : value + digit));
    },
    [phase, maxLength],
  );

  const handleBackspace = useCallback(() => {
    if (phase !== "playing") return;
    setInput((value) => value.slice(0, -1));
  }, [phase]);

  // 正誤の判定・次の問題への切り替えを1手で行う。練習モードと違い
  // 「つぎへ」を待たせない(テンポを止めない)
  const handleCheck = useCallback(() => {
    if (phase !== "playing" || input.length === 0 || !current) return;

    const isCorrect = Number(input) === current.answer;
    setScore((value) => (isCorrect ? value + 1 : value));
    if (!isCorrect) {
      setRemainingMs((ms) => Math.max(ms - PENALTY_MS, 0));
    }
    setFlash({ type: isCorrect ? "correct" : "incorrect", key: flashKey.current++ });
    setCurrent(generateQuestion(config));
    setInput("");
  }, [phase, input, current, config]);

  // PCでは物理キーボードでも答えられるようにする(practice-session.tsxと同じ)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (phase !== "playing") return;

      if (event.key.length === 1 && event.key >= "0" && event.key <= "9") {
        handleDigit(event.key);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        handleBackspace();
        return;
      }
      if (event.key === "Enter") {
        if (document.activeElement instanceof HTMLButtonElement) return;
        handleCheck();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, handleDigit, handleBackspace, handleCheck]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  if (phase === "idle") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,3vh,1.75rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)] text-center">
        <h1 className="text-[clamp(1.375rem,3vh+1rem,2.25rem)] font-bold text-foreground">
          たいむあたっく
        </h1>
        <ReactingAvatar equipped={equipped} mood="idle" className="h-[clamp(4.5rem,14vh,7rem)]" />
        <p className="text-[clamp(1rem,1.6vh+0.5rem,1.375rem)] font-bold text-foreground">
          {TIME_ATTACK_DURATION_SECONDS}びょうで なんもん とけるかな？
        </p>
        <p className="text-sm font-bold text-foreground/70">
          まちがえると {TIME_ATTACK_PENALTY_SECONDS}びょう へっちゃうよ
        </p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          className={primaryButtonClass}
        >
          スタート！
        </motion.button>
        <Link href="/mypage" className="text-sm font-bold text-brand underline">
          マイページへ もどる
        </Link>
      </div>
    );
  }

  if (phase === "finished") {
    const resultMood = summary?.isNewBest ? "celebrate" : "idle";

    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,3vh,1.75rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)] text-center">
        <h1 className="text-[clamp(1.375rem,3vh+1rem,2.25rem)] font-bold text-foreground">
          タイムアップ！
        </h1>
        <ReactingAvatar
          equipped={equipped}
          mood={resultMood}
          className="h-[clamp(4.5rem,14vh,7rem)]"
        />
        <p className="text-[clamp(1.125rem,2vh+0.75rem,1.5rem)] font-bold text-foreground">
          {score}もん せいかい できたよ！
        </p>

        {/* 自己ベストは記録が返ってきてから出す(サーバー側が正のため) */}
        {summary && (
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="rounded-sm bg-success/20 px-5 py-2 text-xl font-bold text-foreground"
          >
            {summary.isNewBest
              ? `あたらしい じこベスト！ ${summary.allTimeBest}てん`
              : `じこベスト ${summary.allTimeBest}てん`}
          </motion.p>
        )}

        {summary && summary.unlockedItems.length > 0 && (
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.2 }}
            className="rounded-sm bg-brand/20 px-5 py-2 text-lg font-bold text-foreground"
          >
            あたらしい {summary.unlockedItems.join("と")}を てにいれた！
          </motion.p>
        )}

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className={primaryButtonClass}
          >
            もういちど
          </motion.button>
          <Link href="/ranking" className={`${secondaryButtonClass} inline-flex items-center`}>
            ランキングを みる
          </Link>
          <Link href="/mypage" className={`${secondaryButtonClass} inline-flex items-center`}>
            マイページへ もどる
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,2rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,2.5rem)]">
      <div className="flex w-full max-w-[min(28rem,85vw,27vh)] items-end justify-between text-sm font-bold text-foreground/60">
        <ReactingAvatar
          equipped={equipped}
          mood={flash?.type ?? "idle"}
          className="h-[clamp(2.25rem,6vh,3.5rem)]"
        />
        <div className="text-right">
          <p>のこり {remainingSeconds}びょう</p>
          <p>せいかい {score}もん</p>
        </div>
      </div>

      <h1 className="text-[clamp(1.75rem,4vh+1rem,3rem)] font-bold tracking-wide text-foreground">
        {current?.a} ＋ {current?.b} ＝
      </h1>

      {/* 正誤は答えを打ち込んでいたその場所で分かるようにする。
          キーパッドを隠さないので視線を動かさず、テンポも止めない */}
      <div className="relative flex items-center justify-center">
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-12 min-w-24 items-center justify-center border-b-4 border-foreground/15 px-4 text-3xl font-bold tracking-widest text-foreground"
        >
          {input || (
            <span className="text-foreground/20" aria-hidden>
              ?
            </span>
          )}
        </div>
        {flash && (
          <motion.div
            key={flash.key}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-0 flex items-center justify-center whitespace-nowrap bg-background"
          >
            <span
              aria-hidden
              className={`text-3xl font-bold ${flash.type === "correct" ? "text-success" : "text-warning"}`}
            >
              {flash.type === "correct" ? "○" : "✕"}
            </span>
            {flash.type === "incorrect" && (
              <span className="ml-1 text-xs font-bold text-warning">
                -{TIME_ATTACK_PENALTY_SECONDS}びょう
              </span>
            )}
          </motion.div>
        )}
      </div>

      <NumericKeypad onDigit={handleDigit} onBackspace={handleBackspace} />

      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        disabled={input.length === 0}
        onClick={handleCheck}
        className={primaryButtonClass}
      >
        こたえる
      </motion.button>
    </div>
  );
};
