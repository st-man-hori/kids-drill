import { expect, test } from "vitest";
import { getTimeBasedGreeting } from "@/lib/greeting";

test("returns a morning greeting between 5:00 and 9:59", () => {
  expect(getTimeBasedGreeting(new Date(2026, 0, 1, 7, 0))).toBe("おはよう");
});

test("returns an afternoon greeting between 10:00 and 17:59", () => {
  expect(getTimeBasedGreeting(new Date(2026, 0, 1, 13, 0))).toBe("こんにちは");
});

test("returns an evening greeting between 18:00 and 4:59", () => {
  expect(getTimeBasedGreeting(new Date(2026, 0, 1, 20, 0))).toBe("こんばんは");
  expect(getTimeBasedGreeting(new Date(2026, 0, 1, 2, 0))).toBe("こんばんは");
});
