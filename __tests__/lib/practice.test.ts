import { expect, test } from "vitest";
import {
  ADD_LEVELS,
  LEVEL_UP_CORRECT_COUNT,
  PERFECT_BONUS_POINTS,
  POINTS_PER_CORRECT,
  TOTAL_QUESTIONS,
  answerMaxLength,
  calculatePoints,
  generateQuestion,
  generateQuestions,
  shouldLevelUp,
} from "@/lib/practice";

const SAMPLES = 200;

const resultsOf = (correct: number, total = TOTAL_QUESTIONS) =>
  Array.from({ length: total }, (_, i) => i < correct);

test.each(ADD_LEVELS.map((config, i) => [i + 1, config] as const))(
  "Lv%i generates questions within range that match the carry condition",
  (_levelNumber, config) => {
    for (let i = 0; i < SAMPLES; i++) {
      const { a, b, answer } = generateQuestion(config);

      expect(a).toBeGreaterThanOrEqual(config.minA);
      expect(a).toBeLessThanOrEqual(config.maxA);
      expect(b).toBeGreaterThanOrEqual(config.minB);
      expect(b).toBeLessThanOrEqual(config.maxB);
      expect(answer).toBe(a + b);
      expect((a % 10) + b >= 10).toBe(config.carry);
    }
  },
);

test("generateQuestions returns the requested number of questions", () => {
  const questions = generateQuestions(ADD_LEVELS[0], TOTAL_QUESTIONS);

  expect(questions).toHaveLength(TOTAL_QUESTIONS);
});

test("generateQuestions does not repeat the same question twice in a row", () => {
  // Lv3は「10 + 1桁」の9通りしかなく、引き直しが効いていないと連続しやすい
  for (let attempt = 0; attempt < 50; attempt++) {
    const questions = generateQuestions(ADD_LEVELS[2], TOTAL_QUESTIONS);

    for (let i = 1; i < questions.length; i++) {
      const previous = questions[i - 1];
      const question = questions[i];
      expect(previous.a === question.a && previous.b === question.b).toBe(false);
    }
  }
});

test("answerMaxLength allows the largest answer of the level", () => {
  expect(answerMaxLength({ minA: 1, maxA: 9, minB: 1, maxB: 9, carry: false })).toBe(2); // 最大18
  expect(answerMaxLength({ minA: 11, maxA: 19, minB: 1, maxB: 9, carry: true })).toBe(2); // 最大28
  expect(answerMaxLength({ minA: 50, maxA: 99, minB: 1, maxB: 99, carry: true })).toBe(3); // 最大198
});

test("shouldLevelUp requires the level-up threshold within the last 10 answers", () => {
  expect(shouldLevelUp(resultsOf(LEVEL_UP_CORRECT_COUNT))).toBe(true);
  expect(shouldLevelUp(resultsOf(TOTAL_QUESTIONS))).toBe(true);
  expect(shouldLevelUp(resultsOf(LEVEL_UP_CORRECT_COUNT - 1))).toBe(false);
});

test("shouldLevelUp does not level up on an unfinished set", () => {
  expect(shouldLevelUp(resultsOf(9, 9))).toBe(false);
  expect(shouldLevelUp([])).toBe(false);
});

test("shouldLevelUp only looks at the most recent 10 answers", () => {
  // 前半を全問落としていても、直近10問が基準を満たしていればレベルアップする
  const results = [...resultsOf(0, 10), ...resultsOf(TOTAL_QUESTIONS)];

  expect(shouldLevelUp(results)).toBe(true);
});

test("calculatePoints pays per correct answer and adds a bonus for a perfect set", () => {
  expect(calculatePoints(resultsOf(0))).toBe(0);
  expect(calculatePoints(resultsOf(7))).toBe(7 * POINTS_PER_CORRECT);
  expect(calculatePoints(resultsOf(TOTAL_QUESTIONS))).toBe(
    TOTAL_QUESTIONS * POINTS_PER_CORRECT + PERFECT_BONUS_POINTS,
  );
});

test("calculatePoints does not pay a perfect bonus for an empty set", () => {
  expect(calculatePoints([])).toBe(0);
});
