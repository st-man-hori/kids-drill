import { expect, test } from "vitest";
import { getWeekStart, percentile, rankTier } from "@/lib/ranking";

test.each([
  // 月曜日はその日の0時が週の始まり
  ["2026-08-10T15:30:00", "2026-08-10T00:00:00"],
  // 週の途中の日は直近の月曜まで戻る
  ["2026-08-14T09:00:00", "2026-08-10T00:00:00"],
  // 日曜日は前の月曜まで戻る（月曜始まりの週の最終日）
  ["2026-08-16T23:59:00", "2026-08-10T00:00:00"],
])("getWeekStart(%s) -> %s", (input, expected) => {
  expect(getWeekStart(new Date(input))).toEqual(new Date(expected));
});

test("percentile treats 1st place among many as a small top percentage", () => {
  expect(percentile(1, 100)).toBe(1);
});

test("percentile rounds up so being just outside a bucket doesn't undersell it", () => {
  // 100人中30位 = ちょうど30%
  expect(percentile(30, 100)).toBe(30);
  // 端数は切り上げる（29.x%を29%と過大評価しない）
  expect(percentile(29, 100)).toBe(29);
  expect(percentile(1, 3)).toBe(34);
});

test("percentile never reports less than 1%", () => {
  expect(percentile(1, 1000000)).toBe(1);
});

test("percentile falls back to 100 when nobody has played this week", () => {
  expect(percentile(1, 0)).toBe(100);
});

test.each([
  // 1〜3位は参加人数によらず常にtop(パーセンタイルでは4人中1位=25%でtopの
  // しきい値からこぼれるが、それでも1位はtop扱いにする)
  [1, 4, "top"],
  [3, 4, "top"],
  [1, 1, "top"],
  [1, 100, "top"],
  [20, 100, "top"],
  [25, 100, "middle"],
  [60, 100, "middle"],
  [61, 100, "growing"],
  [100, 100, "growing"],
] as const)("rankTier(%i, %i) -> %s", (rank, total, expected) => {
  expect(rankTier(rank, total)).toBe(expected);
});
