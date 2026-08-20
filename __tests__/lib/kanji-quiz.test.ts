import { expect, test } from "vitest";
import {
  buildKanjiChoices,
  pickKanjiQuestions,
  prepareKanjiQuestions,
  type KanjiQuizQuestion,
} from "@/lib/kanji-quiz";

const question = (over: Partial<KanjiQuizQuestion> = {}): KanjiQuizQuestion => ({
  id: "八-ハチ",
  kanji: "八",
  correctReading: "ハチ",
  readingType: "on",
  distractors: ["バチ", "ハツ", "ハイ"],
  exampleWord: "八月（はちがつ）",
  meaning: "eight",
  ...over,
});

test("buildKanjiChoices returns exactly one correct choice among 4, using all distractors", () => {
  const q = question();
  const choices = buildKanjiChoices(q);

  expect(choices).toHaveLength(4);
  expect(choices.filter((c) => c.correct)).toHaveLength(1);
  expect(choices.find((c) => c.correct)?.text).toBe(q.correctReading);
  expect(new Set(choices.map((c) => c.text)).size).toBe(4);
  expect(choices.map((c) => c.text).sort()).toEqual(
    [q.correctReading, ...q.distractors].sort(),
  );
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

test("the bundled grade1 question bank loads and has 4 distinct choices per question", () => {
  const questions = prepareKanjiQuestions(80);

  expect(questions.length).toBeGreaterThan(0);
  for (const q of questions) {
    expect(q.choices).toHaveLength(4);
    expect(new Set(q.choices.map((c) => c.text)).size).toBe(4);
    expect(q.choices.filter((c) => c.correct)).toHaveLength(1);
  }
});
