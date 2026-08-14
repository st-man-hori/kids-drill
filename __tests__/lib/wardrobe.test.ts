import { expect, test } from "vitest";
import {
  SLOT_DRAW_ORDER,
  SLOT_TYPES,
  isSlotType,
  isUnlocked,
  itemStatus,
  parseAssetRef,
  parseUnlockCondition,
  unlockConditionLabel,
  type ChildAchievement,
} from "@/lib/wardrobe";

const achievement = (over: Partial<ChildAchievement> = {}): ChildAchievement => ({
  totalCorrect: 0,
  reachedLevels: {},
  bestTimeAttackScore: 0,
  ...over,
});

test("every slot is drawn exactly once", () => {
  expect([...SLOT_DRAW_ORDER].sort()).toEqual([...SLOT_TYPES].sort());
});

test.each([
  ["hair", true],
  ["hat", false],
  [42, false],
])("isSlotType(%s) is %s", (value, expected) => {
  expect(isSlotType(value)).toBe(expected);
});

test.each([
  ["always", {}],
  ["total_correct", { count: 100 }],
  ["level_reached", { skillType: "add", levelNumber: 3 }],
  ["time_attack_score", { score: 20 }],
])("parses the %s condition", (type, value) => {
  expect(parseUnlockCondition(type, value)).not.toBeNull();
});

// 壊れたデータで全アイテムが解放されるより、解放されないほうが安全
test.each([
  ["unknown_type", { count: 1 }],
  ["total_correct", {}],
  ["total_correct", { count: "100" }],
  ["level_reached", { levelNumber: 3 }],
  ["time_attack_score", null],
])("refuses to parse a broken condition (%s)", (type, value) => {
  expect(parseUnlockCondition(type, value)).toBeNull();
});

test("an unreadable condition never unlocks", () => {
  expect(isUnlocked(null, achievement({ totalCorrect: 9999 }))).toBe(false);
});

test("always-unlocked items need no achievement", () => {
  expect(isUnlocked({ type: "always" }, achievement())).toBe(true);
});

test.each([
  [99, false],
  [100, true],
  [101, true],
])("total_correct of 100 with %i correct answers is %s", (totalCorrect, expected) => {
  expect(isUnlocked({ type: "total_correct", count: 100 }, achievement({ totalCorrect }))).toBe(
    expected,
  );
});

test("level_reached only counts the matching skill", () => {
  const condition = { type: "level_reached", skillType: "add", levelNumber: 3 } as const;

  expect(isUnlocked(condition, achievement({ reachedLevels: { add: 3 } }))).toBe(true);
  expect(isUnlocked(condition, achievement({ reachedLevels: { add: 2 } }))).toBe(false);
  // ひき算をどれだけ進めても、たし算の条件は満たさない
  expect(isUnlocked(condition, achievement({ reachedLevels: { subtract: 9 } }))).toBe(false);
});

test("time_attack_score compares against the personal best", () => {
  const condition = { type: "time_attack_score", score: 20 } as const;

  expect(isUnlocked(condition, achievement({ bestTimeAttackScore: 20 }))).toBe(true);
  expect(isUnlocked(condition, achievement({ bestTimeAttackScore: 19 }))).toBe(false);
});

const status = (over: Parameters<typeof itemStatus>[0]) => itemStatus(over);

test("equipping wins over merely owning", () => {
  expect(
    status({ owned: true, equipped: true, unlocked: true, pricePoints: 100, pointsBalance: 0 }),
  ).toBe("equipped");
});

test("an owned item is never shown as something to buy again", () => {
  expect(
    status({ owned: true, equipped: false, unlocked: true, pricePoints: 100, pointsBalance: 0 }),
  ).toBe("owned");
});

test("an item stays locked until its condition is met, however rich the child is", () => {
  expect(
    status({
      owned: false,
      equipped: false,
      unlocked: false,
      pricePoints: 10,
      pointsBalance: 99999,
    }),
  ).toBe("locked");
});

test.each([
  [100, "affordable"],
  [99, "tooExpensive"],
])("with %i points a 100 point item is %s", (pointsBalance, expected) => {
  expect(
    status({
      owned: false,
      equipped: false,
      unlocked: true,
      pricePoints: 100,
      pointsBalance,
    }),
  ).toBe(expected);
});

test("a free item costs nothing once unlocked", () => {
  expect(
    status({ owned: false, equipped: false, unlocked: true, pricePoints: null, pointsBalance: 0 }),
  ).toBe("affordable");
});

test("condition labels stay in kana so a first grader can read them", () => {
  const labels = [
    unlockConditionLabel({ type: "always" }),
    unlockConditionLabel({ type: "total_correct", count: 100 }),
    unlockConditionLabel({ type: "level_reached", skillType: "add", levelNumber: 3 }),
    unlockConditionLabel({ type: "time_attack_score", score: 20 }),
    unlockConditionLabel(null),
  ];

  for (const label of labels) {
    expect(label).not.toMatch(/[一-鿿]/);
  }
});

test.each([
  ["a #ffd166", { variant: "a", color: "#ffd166" }],
  ["  b   #FFF  ", { variant: "b", color: "#FFF" }],
])("parses the asset ref %s", (assetRef, expected) => {
  expect(parseAssetRef(assetRef)).toEqual(expected);
});

// 読めないasset_refでも画面が壊れないこと
test.each(["", "a", "a notacolor", "#ffd166"])(
  "falls back to a safe asset for %s",
  (assetRef) => {
    const asset = parseAssetRef(assetRef);
    expect(asset.color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(asset.variant).not.toBe("");
  },
);
