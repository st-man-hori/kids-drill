"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChoiceButtons } from "@/components/choice-buttons";
import { Celebration } from "@/components/celebration";
import { ReactingAvatar, type AvatarMood } from "@/components/reacting-avatar";
import type { AvatarAsset, SlotType } from "@/lib/wardrobe";
import {
  submitKokugoSession,
  type KokugoSessionResult,
} from "@/app/practice/kokugo/actions";
import {
  COMBO_THRESHOLD,
  CORRECT_ADVANCE_DELAY_MS,
  INCORRECT_ADVANCE_DELAY_MS,
  TOTAL_QUESTIONS,
  celebrationTier,
  type CelebrationTier,
} from "@/lib/practice";
import {
  pickKanjiQuestions,
  type KanjiQuestion,
  type KanjiQuestionBankEntry,
} from "@/lib/kokugo";

// practice-session.tsxの構造をそのまま踏襲した、よみがなモード（国語スパイク）版。
// 数字パッド＋「こたえる」確認の代わりに、タップ＝回答であるChoiceButtonsを使う。
// コメントの詳細（自動送りの待ち時間の理由・記録タイミングなど）はpractice-session.tsx参照。

const CELEBRATION_MESSAGE: Record<CelebrationTier, string> = {
  perfect: "ぜんもん せいかい！",
  great: "すごい！ その ちょうし！",
  good: "よく がんばったね！",
  gentle: "さいごまで やりきったね！",
};

type Summary = KokugoSessionResult & { batch: number };

const buttonClass =
  "rounded-full px-[clamp(2.5rem,6vw,3.5rem)] py-[clamp(0.75rem,1.5vh,1.125rem)] text-[clamp(1.25rem,1.6vh+0.6rem,1.625rem)] font-bold disabled:opacity-40";
const primaryButtonClass = `${buttonClass} bg-brand text-brand-foreground shadow-sm`;
const secondaryButtonClass = `${buttonClass} border-2 border-brand bg-white text-brand`;

export const KokugoSession = ({
  pool: initialPool,
  questions: initialQuestions,
  equipped = {},
}: {
  pool: KanjiQuestionBankEntry[];
  questions: KanjiQuestion[];
  equipped?: Partial<Record<SlotType, AvatarAsset>>;
}) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [pool, setPool] = useState(initialPool);
  const [questions, setQuestions] = useState(initialQuestions);
  const [batch, setBatch] = useState(0);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [combo, setCombo] = useState({ current: 0, best: 0 });
  const [summary, setSummary] = useState<Summary | null>(null);

  const finished = currentIndex >= questions.length;
  const current = questions[currentIndex];
  const correctCount = results.filter(Boolean).length;
  const currentSummary = summary?.batch === batch ? summary : null;

  const submittedBatch = useRef(-1);
  useEffect(() => {
    if (!finished || submittedBatch.current === batch) return;
    submittedBatch.current = batch;

    const submittedFor = batch;
    startTransition(async () => {
      try {
        const result = await submitKokugoSession({ results, startedAt });
        if (result) setSummary({ ...result, batch: submittedFor });
      } catch (error) {
        console.error(error);
      }
    });
  }, [finished, batch, results, startedAt, startTransition]);

  const handleSelect = useCallback(
    (choice: string) => {
      if (feedback || !current) return;
      const isCorrect = choice === current.correctReading;
      setSelected(choice);
      setFeedback(isCorrect ? "correct" : "incorrect");
      setResults((prev) => [...prev, isCorrect]);
      setCombo((prev) => {
        const next = isCorrect ? prev.current + 1 : 0;
        return { current: next, best: Math.max(prev.best, next) };
      });
    },
    [feedback, current],
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((index) => index + 1);
    setSelected(null);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const delay =
      feedback === "correct" ? CORRECT_ADVANCE_DELAY_MS : INCORRECT_ADVANCE_DELAY_MS;
    const timer = setTimeout(handleNext, delay);
    return () => clearTimeout(timer);
  }, [feedback, handleNext]);

  const handleMore = () => {
    const nextPool = currentSummary ? currentSummary.pool : pool;

    setPool(nextPool);
    setQuestions(pickKanjiQuestions(nextPool, TOTAL_QUESTIONS));
    setBatch((value) => value + 1);
    setStartedAt(new Date().toISOString());
    setCurrentIndex(0);
    setSelected(null);
    setFeedback(null);
    setResults([]);
    setCombo({ current: 0, best: 0 });
  };

  const handleFinish = () => {
    router.push("/mypage");
    router.refresh();
  };

  if (finished) {
    const tier = celebrationTier(correctCount, questions.length);
    const resultMood: AvatarMood =
      tier === "perfect" || tier === "great" ? "celebrate" : "idle";

    return (
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,3vh,1.75rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)] text-center">
        <Celebration key={batch} tier={tier} />
        <motion.h1
          key={`${batch}-${tier}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: tier === "perfect" ? 9 : 14,
          }}
          className="text-[clamp(1.375rem,3vh+1rem,2.25rem)] font-bold text-foreground"
        >
          {CELEBRATION_MESSAGE[tier]}
        </motion.h1>
        <ReactingAvatar
          equipped={equipped}
          mood={resultMood}
          className="h-[clamp(4.5rem,14vh,7rem)] shrink-0"
        />

        <p className="text-[clamp(1.125rem,2vh+0.75rem,1.5rem)] font-bold text-foreground">
          {questions.length}もんちゅう {correctCount}もん せいかい！
        </p>

        {combo.best >= COMBO_THRESHOLD && (
          <p className="rounded-sm bg-brand/15 px-4 py-2 font-bold text-foreground">
            さいこう {combo.best}れんぞく！
          </p>
        )}

        {currentSummary && (
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="rounded-sm bg-success/20 px-5 py-2 text-xl font-bold text-foreground"
          >
            {currentSummary.pointsEarned} ポイント ゲット！
          </motion.p>
        )}
        {currentSummary?.leveledUp && (
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.2 }}
            className="rounded-sm bg-warning/25 px-5 py-2 text-xl font-bold text-foreground"
          >
            レベルアップ！ つぎは もうすこし むずかしいよ
          </motion.p>
        )}

        {currentSummary && currentSummary.unlockedItems?.length > 0 && (
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.35 }}
            className="rounded-sm bg-brand/20 px-5 py-2 text-lg font-bold text-foreground"
          >
            あたらしい {currentSummary.unlockedItems.join("と")}を てにいれた！
          </motion.p>
        )}

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleMore}
            className={primaryButtonClass}
          >
            もっと やる
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleFinish}
            className={secondaryButtonClass}
          >
            マイページへ もどる
          </motion.button>
        </div>
      </div>
    );
  }

  const segmentClass = (index: number) => {
    if (index < results.length) return results[index] ? "bg-success" : "bg-warning";
    if (index === currentIndex) return "bg-brand/40";
    return "bg-black/10";
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,2rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,2.5rem)]">
      <div className="flex w-full max-w-[min(28rem,85vw,27vh)] flex-col gap-2">
        <div className="flex items-end justify-between text-sm font-bold text-foreground/60">
          <ReactingAvatar
            equipped={equipped}
            mood={feedback ?? "idle"}
            className="h-[clamp(2.25rem,6vh,3.5rem)]"
          />
          <p>
            {currentIndex + 1} もんめ ／ {questions.length}もん
          </p>
        </div>
        <div className="flex gap-1" aria-hidden>
          {questions.map((_, index) => (
            <div key={index} className={`h-2 flex-1 rounded-full ${segmentClass(index)}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-[clamp(1rem,1.6vh+0.4rem,1.375rem)] font-bold text-foreground/70">
          なんて よむ？
        </p>
        {/* 熟語自体が出題内容なので、ふりがなは振らない（振ると答えが見えてしまう）。
            design.mdの「画面の漢字にはふりがなを振る」の意図的な例外。読みの一部
            （対象漢字以外の部分）はreadingTemplateとして下に表示する（○○が対象漢字の
            読みの穴）*/}
        <h1 className="text-[clamp(3rem,8vh+1rem,5.5rem)] font-bold tracking-wide text-foreground">
          {current.exampleWord}
        </h1>
        <p className="text-[clamp(1.25rem,2.6vh+0.5rem,2rem)] font-bold tracking-wide text-foreground/80">
          {current.readingTemplate}
        </p>
      </div>

      <div className="relative flex w-full justify-center">
        <ChoiceButtons
          choices={current.choices}
          onSelect={handleSelect}
          disabled={feedback !== null}
          correctReading={current.correctReading}
          selected={selected}
        />
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute -top-2 left-0 right-0 flex -translate-y-full justify-center px-2"
          >
            {feedback === "correct" ? (
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 12 }}
                className="rounded-sm bg-success/25 px-5 py-3 text-center text-xl font-bold text-foreground"
              >
                {combo.current >= COMBO_THRESHOLD
                  ? `${combo.current}れんぞく せいかい！`
                  : "せいかい！"}
              </motion.p>
            ) : (
              <motion.p
                initial={{ x: 0 }}
                animate={{ x: [0, -8, 8, -8, 8, 0] }}
                transition={{ duration: 0.4 }}
                className="rounded-sm bg-warning/25 px-5 py-3 text-center font-bold text-foreground"
              >
                ざんねん…こたえは {current.correctReading} だよ
              </motion.p>
            )}
          </motion.div>
        )}
      </div>

      {feedback && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className={primaryButtonClass}
        >
          つぎへ
        </motion.button>
      )}
    </div>
  );
};
