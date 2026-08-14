import { expect, test } from "vitest";
import {
  TIME_ATTACK_MAX_SANE_CORRECT_COUNT,
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
