"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { NumericKeypad } from "@/components/numeric-keypad";
import { Celebration } from "@/components/celebration";
import { ReactingAvatar, type AvatarMood } from "@/components/reacting-avatar";
import type { AvatarAsset, SlotType } from "@/lib/wardrobe";
import {
  submitPracticeSession,
  type PracticeSessionResult,
} from "@/app/practice/add/actions";
import {
  COMBO_THRESHOLD,
  CORRECT_ADVANCE_DELAY_MS,
  INCORRECT_ADVANCE_DELAY_MS,
  TOTAL_QUESTIONS,
  answerMaxLength,
  celebrationTier,
  generateQuestions,
  type CelebrationTier,
  type LevelConfig,
  type Question,
} from "@/lib/practice";

// 成績に応じた見出し。どの段階でも否定的な言葉は使わない
// （docs/design.md: 恐怖感を与える演出は避ける）
const CELEBRATION_MESSAGE: Record<CelebrationTier, string> = {
  perfect: "ぜんもん せいかい！",
  great: "すごい！ その ちょうし！",
  good: "よく がんばったね！",
  gentle: "さいごまで やりきったね！",
};

// 記録が返ってきたのが今の10問（batch）の分かどうかを見分けるために持つ。
// 「もっとやる」で次の10問に進んだ後に前の結果が届いても表示しないため。
type Summary = PracticeSessionResult & { batch: number };

// 上限をスマホ基準で決めるとタブレットで上限に張り付いて小さく見える。
// 上限はタブレット基準にし、下限と vh 項でスマホ側を守る（docs/design.md）
const buttonClass =
  "rounded-full px-[clamp(2.5rem,6vw,3.5rem)] py-[clamp(0.75rem,1.5vh,1.125rem)] text-[clamp(1.25rem,1.6vh+0.6rem,1.625rem)] font-bold disabled:opacity-40";
const primaryButtonClass = `${buttonClass} bg-brand text-brand-foreground shadow-sm`;
const secondaryButtonClass = `${buttonClass} border-2 border-brand bg-white text-brand`;

export const PracticeSession = ({
  config,
  questions: initialQuestions,
  equipped = {},
}: {
  config: LevelConfig;
  questions: Question[];
  equipped?: Partial<Record<SlotType, AvatarAsset>>;
}) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // 現在のレベルの設定はレベルが変わると次の10問から切り替わるので状態として持つ。
  // レベル番号は画面に出さない（docs/game-design.md「降級」）ので保持もしない
  const [levelConfig, setLevelConfig] = useState(config);
  const [questions, setQuestions] = useState(initialQuestions);
  const [batch, setBatch] = useState(0);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [combo, setCombo] = useState({ current: 0, best: 0 });
  const [summary, setSummary] = useState<Summary | null>(null);

  // finishedはcurrentIndexで判定する（results.length基準だと最後の設問の
  // フィードバックを表示する前に結果画面へ切り替わってしまうため）
  const finished = currentIndex >= questions.length;
  const current = questions[currentIndex];
  const correctCount = results.filter(Boolean).length;
  const maxLength = answerMaxLength(levelConfig);
  const currentSummary = summary?.batch === batch ? summary : null;

  // 10問終わって結果画面に来た時点で記録する。「マイページへ もどる」を
  // 押すまで待つと、結果画面を見たまま離脱した子どもの10問が丸ごと消える。
  // StrictModeでeffectが2回走っても二重送信しないようbatch番号で見張る。
  const submittedBatch = useRef(-1);
  useEffect(() => {
    if (!finished || submittedBatch.current === batch) return;
    submittedBatch.current = batch;

    const submittedFor = batch;
    startTransition(async () => {
      try {
        const result = await submitPracticeSession({ results, startedAt });
        if (result) setSummary({ ...result, batch: submittedFor });
      } catch (error) {
        // 記録に失敗してもゲーム自体は続けられるようにする。子どもに
        // エラーを見せても対処できないため画面には出さない
        console.error(error);
      }
    });
  }, [finished, batch, results, startedAt, startTransition]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (feedback) return;
      setInput((value) => (value.length >= maxLength ? value : value + digit));
    },
    [feedback, maxLength],
  );

  const handleBackspace = useCallback(() => {
    if (feedback) return;
    setInput((value) => value.slice(0, -1));
  }, [feedback]);

  const handleCheck = useCallback(() => {
    if (feedback || input.length === 0 || !current) return;
    const isCorrect = Number(input) === current.answer;
    setFeedback(isCorrect ? "correct" : "incorrect");
    setResults((prev) => [...prev, isCorrect]);
    setCombo((prev) => {
      const next = isCorrect ? prev.current + 1 : 0;
      return { current: next, best: Math.max(prev.best, next) };
    });
  }, [feedback, input, current]);

  const handleNext = useCallback(() => {
    setCurrentIndex((index) => index + 1);
    setInput("");
    setFeedback(null);
  }, []);

  // 答えたら自動で次の問題へ進む。1問ごとに「つぎへ」を押させるとテンポが悪く、
  // 10問やりきるまでのタップ数も倍になるため。特に不正解のときに押させると、
  // つまずいている子ほど操作量が増える逆向きの設計になってしまう。
  // 待ち時間だけ正解・不正解で変える（docs/game-design.md）。
  useEffect(() => {
    if (!feedback) return;
    const delay =
      feedback === "correct" ? CORRECT_ADVANCE_DELAY_MS : INCORRECT_ADVANCE_DELAY_MS;
    const timer = setTimeout(handleNext, delay);
    // 「つぎへ」を自分で押した場合はfeedbackがnullに戻り、ここで解除される
    return () => clearTimeout(timer);
  }, [feedback, handleNext]);

  // PCでは物理キーボードでも答えられるようにする（メインのiPadでは
  // 画面のキーパッドを使うため、こちらは補助的な入力手段）
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (finished) return;

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
        // ボタンにフォーカスがある間は、同じEnterでブラウザがクリックも
        // 発火させるため二重処理になる。その場合はクリック側に任せる
        if (document.activeElement instanceof HTMLButtonElement) return;
        if (feedback) handleNext();
        else handleCheck();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finished, feedback, handleDigit, handleBackspace, handleCheck, handleNext]);

  const handleMore = () => {
    // レベルが変わっていれば次の10問から新しいレベルの問題になる（降級も同じ）。
    // 記録が返ってきていない場合は今のレベルのまま続ける
    const nextConfig = currentSummary ? currentSummary.config : levelConfig;

    setLevelConfig(nextConfig);
    setQuestions(generateQuestions(nextConfig, TOTAL_QUESTIONS));
    setBatch((value) => value + 1);
    setStartedAt(new Date().toISOString());
    setCurrentIndex(0);
    setInput("");
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
    // よくできたときだけキャラクターも跳ね続ける。振るわなかったときは
    // 静かに待つ（落ち込ませる動きにはしない。docs/design.md）
    const resultMood: AvatarMood =
      tier === "perfect" || tier === "great" ? "celebrate" : "idle";

    return (
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,3vh,1.75rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)] text-center">
        <Celebration key={batch} tier={tier} />
        {/* 見出し自体を成績で出し分ける。行を増やすと画面が伸びてスクロールが
            必要になるため（docs/design.md「スクロールなし方針」）、
            「おつかれさま！」を置き換える形にしている */}
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

        {/* ポイントとレベルアップは記録が返ってきてから出す（サーバー側が
            正としているため）。少し遅れて弾んで出てくるのが演出も兼ねる */}
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

        {/* 着せ替えアイテムの解放は中期の報酬（docs/game-design.md の報酬ループ）。
            ポイント表示より後、ボタンの直前に置いて「見にいける」流れにする */}
        {/* デプロイの入れ替わり中に古いサーバーの応答を受け取る可能性があるため、
            この項目が無くても落ちないようにしておく */}
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
      <div className="flex w-full max-w-[min(28rem,85vw,34vh)] flex-col gap-2">
        {/* レベル番号は表示しない。降級したときに数字が下がるのが見えてしまい、
            「下がったこと」を子どもに突きつける形になるため（docs/game-design.md）。
            空いた左側にキャラクターを置く。行を増やしていないので画面は伸びない */}
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
        {/* 何問目まで来たか・どれが正解だったかを一目で分かるようにする帯 */}
        <div className="flex gap-1" aria-hidden>
          {questions.map((_, index) => (
            <div key={index} className={`h-2 flex-1 rounded-full ${segmentClass(index)}`} />
          ))}
        </div>
      </div>

      <h1 className="text-[clamp(1.75rem,4vh+1rem,3rem)] font-bold tracking-wide text-foreground">
        {current.a} ＋ {current.b} ＝
      </h1>

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

      {/* フィードバックはキーパッドに重ねて出す。キーパッドを消したり
          メッセージ用の余白を空けたりすると画面全体が動いて押し間違いを誘うため */}
      <div className="relative flex w-full justify-center">
        <div className="flex w-full justify-center">
          <NumericKeypad
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            disabled={feedback !== null}
          />
        </div>
        {/* AnimatePresenceは使わない。退場アニメーション中の要素がDOMに残り、
            前の設問のフィードバックが重なって見えてしまうため */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/85 px-2"
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
                ざんねん…こたえは {current.answer} だよ
              </motion.p>
            )}
          </motion.div>
        )}
      </div>

      {feedback ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className={primaryButtonClass}
        >
          つぎへ
        </motion.button>
      ) : (
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          disabled={input.length === 0}
          onClick={handleCheck}
          className={primaryButtonClass}
        >
          こたえる
        </motion.button>
      )}
    </div>
  );
};
