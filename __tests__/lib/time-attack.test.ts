import { expect, test } from "vitest";
import {
  TIME_ATTACK_COMBO_STREAK,
  TIME_ATTACK_MAX_SANE_CORRECT_COUNT,
  isComboMilestone,
  isValidTimeAttackCorrectCount,
} from "@/lib/time-attack";

test.each([
  [0, true],
  [1, true],
  [TIME_ATTACK_MAX_SANE_CORRECT_COUNT, true],
  [TIME_ATTACK_MAX_SANE_CORRECT_COUNT + 1, false],
  [-1, false],
  [1.5, false],
  [NaN, false],
  ["10", false],
  [null, false],
  [undefined, false],
])("isValidTimeAttackCorrectCount(%p) -> %p", (value, expected) => {
  expect(isValidTimeAttackCorrectCount(value)).toBe(expected);
});

test.each([
  [0, false],
  [1, false],
  [TIME_ATTACK_COMBO_STREAK - 1, false],
  [TIME_ATTACK_COMBO_STREAK, true],
  [TIME_ATTACK_COMBO_STREAK + 1, false],
  [TIME_ATTACK_COMBO_STREAK * 2, true],
  [TIME_ATTACK_COMBO_STREAK * 3, true],
])("isComboMilestone(%p) -> %p", (streak, expected) => {
  expect(isComboMilestone(streak)).toBe(expected);
});
