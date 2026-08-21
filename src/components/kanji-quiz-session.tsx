"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Celebration } from "@/components/celebration";
import { ReactingAvatar, type AvatarMood } from "@/components/reacting-avatar";
import type { AvatarAsset, SlotType } from "@/lib/wardrobe";
import {
  CORRECT_ADVANCE_DELAY_MS,
  INCORRECT_ADVANCE_DELAY_MS,
  celebrationTier,
  type CelebrationTier,
} from "@/lib/practice";
import { kanjiOnlyWord, type KanjiQuizQuestionWithChoices } from "@/lib/kanji-quiz";

// たしざん練習（PracticeSession）と見た目・タイミングを揃えつつ、DBへの
// 記録は行わない独立モード（v1）。ポイント・レベル等の報酬経済へつなぐかは
// docs/architecture.md「漢字のよみ」節が未決定としている論点で、ここでは
// 先に遊べる形を作ることを優先している

const CELEBRATION_MESSAGE: Record<CelebrationTier, string> = {
  perfect: "ぜんもん せいかい！",
  great: "すごい！ その ちょうし！",
  good: "よく がんばったね！",
  gentle: "さいごまで やりきったね！",
};

const buttonClass =
  "rounded-full px-[clamp(2.5rem,6vw,3.5rem)] py-[clamp(0.75rem,1.5vh,1.125rem)] text-[clamp(1.25rem,1.6vh+0.6rem,1.625rem)] font-bold disabled:opacity-40";
const primaryButtonClass = `${buttonClass} bg-brand text-brand-foreground shadow-sm`;
const secondaryButtonClass = `${buttonClass} border-2 border-brand bg-white text-brand`;

// 選択肢ボタン。正解/不正解が決まった後だけ色を出す
const choiceClass = (state: "idle" | "correct" | "incorrect" | "faded") => {
  const base =
    "min-h-11 rounded-full border-2 px-[clamp(1.5rem,4vw,2.5rem)] py-[clamp(0.75rem,1.6vh,1.125rem)] text-[clamp(1.375rem,2.2vh+0.8rem,2rem)] font-bold transition-colors";
  switch (state) {
    case "correct":
      return `${base} border-success bg-success/20 text-foreground`;
    case "incorrect":
      return `${base} border-warning bg-warning/20 text-foreground`;
    case "faded":
      return `${base} border-transparent bg-black/5 text-foreground/40`;
    default:
      return `${base} border-brand/30 bg-white text-foreground`;
  }
};

export const KanjiQuizSession = ({
  questions,
  equipped = {},
}: {
  questions: KanjiQuizQuestionWithChoices[];
  equipped?: Partial<Record<SlotType, AvatarAsset>>;
}) => {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [missed, setMissed] = useState<{ kanji: string; correctReading: string }[]>([]);

  const finished = currentIndex >= questions.length;
  const current = questions[currentIndex];
  const correctCount = results.filter(Boolean).length;
  const answered = selected !== null;

  const handleSelect = useCallback(
    (index: number) => {
      if (answered || !current) return;
      const isCorrect = current.choices[index].correct;
      setSelected(index);
      setResults((prev) => [...prev, isCorrect]);
      if (!isCorrect) {
        setMissed((prev) => [
          ...prev,
          { kanji: current.kanji, correctReading: current.correctReading },
        ]);
      }
    },
    [answered, current],
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((index) => index + 1);
    setSelected(null);
  }, []);

  // 答えたら自動で次の問題へ。待ち時間は正解・不正解で変える
  // （PracticeSessionと同じ理由。docs/game-design.md）
  useEffect(() => {
    if (selected === null) return;
    const isCorrect = current?.choices[selected]?.correct;
    const delay = isCorrect ? CORRECT_ADVANCE_DELAY_MS : INCORRECT_ADVANCE_DELAY_MS;
    const timer = setTimeout(handleNext, delay);
    return () => clearTimeout(timer);
  }, [selected, current, handleNext]);

  const handleRetry = () => {
    router.push("/practice/kanji");
    router.refresh();
  };

  const handleFinish = () => {
    router.push("/mypage");
    router.refresh();
  };

  if (questions.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-bold text-foreground">もんだいが まだ ないみたい</p>
        <button type="button" onClick={handleFinish} className={primaryButtonClass}>
          マイページへ もどる
        </button>
      </div>
    );
  }

  if (finished) {
    const tier = celebrationTier(correctCount, questions.length);
    const resultMood: AvatarMood = tier === "perfect" || tier === "great" ? "celebrate" : "idle";

    return (
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,3vh,1.75rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)] text-center">
        <Celebration tier={tier} />
        <motion.h1
          key={tier}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: tier === "perfect" ? 9 : 14 }}
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

        {missed.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-md bg-black/5 px-4 py-3">
            <p className="w-full text-sm font-bold text-foreground/60">
              つぎは よめるように なろうね
            </p>
            {missed.map((item, index) => (
              <span
                key={`${item.kanji}-${index}`}
                className="rounded-sm bg-white px-3 py-1 text-lg font-bold text-foreground"
              >
                {item.kanji}（{item.correctReading}）
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className={primaryButtonClass}
          >
            もういちど
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

  const avatarMood: AvatarMood =
    selected === null ? "idle" : current.choices[selected].correct ? "correct" : "incorrect";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,1.75rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,2.5rem)]">
      <div className="flex w-full max-w-[min(28rem,85vw,27vh)] flex-col gap-2">
        <div className="flex items-end justify-between text-sm font-bold text-foreground/60">
          <ReactingAvatar equipped={equipped} mood={avatarMood} className="h-[clamp(2.25rem,6vh,3.5rem)]" />
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

      <p className="text-lg font-bold text-foreground/70">◯の ぶぶんの よみは どれ？</p>

      <h1 className="text-[clamp(3rem,8vh+1rem,6rem)] font-bold tracking-wide text-foreground">
        {current.kanji}
      </h1>

      {/* 熟語そのものも小さく見せる。ふりがなを与えていないので答えは漏れないが、
          「実際はこう書く」という見た目のイメージは持たせられる */}
      <p className="text-base font-bold text-foreground/40">{kanjiOnlyWord(current.exampleWord)}</p>

      {/* 熟語の中でどう読むかを示すヒント。「この字単体の読みは？」だと大のように
          複数の読みを持つ字で問いが一意に決まらないため、文脈を出題に含めている
          （docs/architecture.md「かんじよみクイズ」） */}
      <p className="rounded-sm bg-brand/15 px-4 py-1.5 text-2xl font-bold tracking-widest text-foreground">
        {current.maskedReading}
      </p>

      <div
        role="status"
        aria-live="polite"
        className="grid min-h-[clamp(6.5rem,16vh,9rem)] w-full max-w-[min(28rem,90vw)] grid-cols-2 gap-3"
      >
        {current.choices.map((choice, index) => {
          const state =
            selected === null
              ? "idle"
              : choice.correct
                ? "correct"
                : index === selected
                  ? "incorrect"
                  : "faded";

          return (
            <motion.button
              key={choice.text}
              type="button"
              whileTap={answered ? undefined : { scale: 0.95 }}
              disabled={answered}
              onClick={() => handleSelect(index)}
              className={choiceClass(state)}
            >
              {choice.text}
            </motion.button>
          );
        })}
      </div>

      {/* 例で使われる単語をヒントとして出す。読めない漢字を含むが、ふりがな
          付きの用例をそのまま見せるのは学習コンテンツの一部として自然
          （design.mdのかな限定ルールは案内・UI文言向けであり、出題対象の
          漢字そのものやその用例には適用しない） */}
      <div className="min-h-6 text-center text-sm font-bold text-foreground/50">
        {answered && current.exampleWord && `つかいかた: ${current.exampleWord}`}
      </div>
    </div>
  );
};
