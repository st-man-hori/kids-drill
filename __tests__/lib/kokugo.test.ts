import { expect, test } from "vitest";
import { pickKanjiQuestions, type KanjiQuestionBankEntry } from "@/lib/kokugo";

const POOL: KanjiQuestionBankEntry[] = [
  { id: "1", kanji: "一", correctReading: "いち", distractorReadings: ["にん", "さつ", "くん"] },
  { id: "2", kanji: "二", correctReading: "に", distractorReadings: ["さん", "よん", "ご"] },
  { id: "3", kanji: "三", correctReading: "さん", distractorReadings: ["みつ", "さお", "みず"] },
];

test("pickKanjiQuestions returns the requested number of questions", () => {
  const questions = pickKanjiQuestions(POOL, 10);

  expect(questions).toHaveLength(10);
});

test("pickKanjiQuestions returns an empty array for an empty pool", () => {
  expect(pickKanjiQuestions([], 10)).toEqual([]);
});

test("pickKanjiQuestions does not repeat the same kanji twice in a row", () => {
  for (let attempt = 0; attempt < 50; attempt++) {
    const questions = pickKanjiQuestions(POOL, 20);

    for (let i = 1; i < questions.length; i++) {
      expect(questions[i - 1].kanji === questions[i].kanji).toBe(false);
    }
  }
});

test("each question's choices contain exactly the correct reading plus its distractors", () => {
  const questions = pickKanjiQuestions(POOL, 30);

  for (const question of questions) {
    const entry = POOL.find((e) => e.kanji === question.kanji);
    expect(entry).toBeDefined();
    expect(question.correctReading).toBe(entry!.correctReading);
    expect(new Set(question.choices)).toEqual(
      new Set([entry!.correctReading, ...entry!.distractorReadings]),
    );
    expect(question.choices).toHaveLength(4);
  }
});

test("a single-entry pool still produces the requested count (repeats allowed)", () => {
  const singleEntryPool = [POOL[0]];

  const questions = pickKanjiQuestions(singleEntryPool, 5);

  expect(questions).toHaveLength(5);
  expect(questions.every((q) => q.kanji === "一")).toBe(true);
});
