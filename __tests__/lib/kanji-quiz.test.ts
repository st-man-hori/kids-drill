import { expect, test } from "vitest";
import {
  buildKanjiChoices,
  kanjiOnlyWord,
  pickKanjiQuestions,
  prepareKanjiQuestions,
  type KanjiQuizQuestion,
} from "@/lib/kanji-quiz";

const question = (over: Partial<KanjiQuizQuestion> = {}): KanjiQuizQuestion => ({
  id: "八-ハチ",
  kanji: "八",
  correctReading: "ハチ",
  readingType: "on",
  distractorPool: ["バチ", "ハツ", "ハイ", "ハン", "パチ", "カチ", "ラチ", "ワチ", "ガチ"],
  exampleWord: "八月（はちがつ）",
  maskedReading: "○○がつ",
  meaning: "eight",
  ...over,
});

test("buildKanjiChoices returns exactly one correct choice among 4, sampled from the pool", () => {
  const q = question();
  const choices = buildKanjiChoices(q);

  expect(choices).toHaveLength(4);
  expect(choices.filter((c) => c.correct)).toHaveLength(1);
  expect(choices.find((c) => c.correct)?.text).toBe(q.correctReading);
  expect(new Set(choices.map((c) => c.text)).size).toBe(4);
  for (const choice of choices.filter((c) => !c.correct)) {
    expect(q.distractorPool).toContain(choice.text);
  }
});

test("buildKanjiChoices samples different distractors across calls (given a large enough pool)", () => {
  const q = question();
  const seenSets = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const distractorText = buildKanjiChoices(q)
      .filter((c) => !c.correct)
      .map((c) => c.text)
      .sort()
      .join(",");
    seenSets.add(distractorText);
  }
  // 9択中3件のサンプリングを30回やって毎回まったく同じ組み合わせにはならないはず
  expect(seenSets.size).toBeGreaterThan(1);
});

test("buildKanjiChoices degrades gracefully when the pool has fewer than 3 distractors", () => {
  const q = question({ distractorPool: ["バチ"] });
  const choices = buildKanjiChoices(q);

  expect(choices).toHaveLength(2);
  expect(choices.filter((c) => c.correct)).toHaveLength(1);
});

test("pickKanjiQuestions never returns more than the bank size and never duplicates", () => {
  const bank = Array.from({ length: 5 }, (_, i) => question({ id: `q${i}`, kanji: `${i}` }));

  const picked = pickKanjiQuestions(10, bank);

  expect(picked).toHaveLength(5);
  expect(new Set(picked.map((q) => q.id)).size).toBe(5);
});

test("pickKanjiQuestions respects a count smaller than the bank", () => {
  const bank = Array.from({ length: 20 }, (_, i) => question({ id: `q${i}`, kanji: `${i}` }));

  const picked = pickKanjiQuestions(10, bank);

  expect(picked).toHaveLength(10);
});

test("prepareKanjiQuestions attaches ready-to-render choices to each question", () => {
  const bank = [question()];

  const [prepared] = prepareKanjiQuestions(1, bank);

  expect(prepared.choices).toHaveLength(4);
  expect(prepared.choices.some((c) => c.correct && c.text === prepared.correctReading)).toBe(
    true,
  );
});

test("kanjiOnlyWord strips the furigana without revealing the masked reading", () => {
  expect(kanjiOnlyWord("七時（しちじ）")).toBe("七時");
  expect(kanjiOnlyWord("大学（だいがく）")).toBe("大学");
  expect(kanjiOnlyWord("八")).toBe("八");
});

test("the bundled grade1 question bank loads and has 4 distinct choices per question", () => {
  const questions = prepareKanjiQuestions(80);

  expect(questions.length).toBeGreaterThan(0);
  for (const q of questions) {
    expect(q.choices).toHaveLength(4);
    expect(new Set(q.choices.map((c) => c.text)).size).toBe(4);
    expect(q.choices.filter((c) => c.correct)).toHaveLength(1);
  }
});
