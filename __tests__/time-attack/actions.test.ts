import { beforeEach, expect, test, vi } from "vitest";
import { TIME_ATTACK_MAX_SANE_CORRECT_COUNT } from "@/lib/time-attack";

const {
  mockValues,
  mockInsert,
  mockWhere,
  mockSelect,
  mockAuth,
  mockGetMathSubjectId,
  mockGrantUnlockedFreeItems,
} = vi.hoisted(() => {
  const mockValues = vi.fn().mockResolvedValue(undefined);
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  const mockWhere = vi.fn();
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  return {
    mockValues,
    mockInsert,
    mockWhere,
    mockSelect,
    mockAuth: vi.fn(),
    mockGetMathSubjectId: vi.fn(),
    mockGrantUnlockedFreeItems: vi.fn(),
  };
});

vi.mock("@/db", () => ({
  db: { select: mockSelect, insert: mockInsert },
}));

vi.mock("@/db/schema", () => ({
  timeAttackRuns: { childId: "child_id", correctCount: "correct_count" },
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/practice-progress", () => ({
  getMathSubjectId: mockGetMathSubjectId,
}));

vi.mock("@/lib/wardrobe-store", () => ({
  grantUnlockedFreeItems: mockGrantUnlockedFreeItems,
}));

import { submitTimeAttackRun } from "@/app/time-attack/actions";

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "child-1" } });
  mockGetMathSubjectId.mockResolvedValue("subject-math");
  mockWhere.mockResolvedValue([{ best: 5 }]);
  mockGrantUnlockedFreeItems.mockResolvedValue([]);
});

test("records the run against the child's id and the math subject", async () => {
  await submitTimeAttackRun({ correctCount: 8 });

  expect(mockValues).toHaveBeenCalledOnce();
  const inserted = mockValues.mock.calls[0][0];
  expect(inserted).toMatchObject({
    childId: "child-1",
    subjectId: "subject-math",
    skillType: "add",
    correctCount: 8,
  });
});

test("reports a new best when the score beats the previous best", async () => {
  mockWhere.mockResolvedValue([{ best: 5 }]);

  const result = await submitTimeAttackRun({ correctCount: 8 });

  expect(result).toMatchObject({ correctCount: 8, isNewBest: true, allTimeBest: 8 });
});

test("does not report a new best when the score ties the previous best", async () => {
  mockWhere.mockResolvedValue([{ best: 8 }]);

  const result = await submitTimeAttackRun({ correctCount: 8 });

  expect(result).toMatchObject({ isNewBest: false, allTimeBest: 8 });
});

test("treats no prior runs as a previous best of zero", async () => {
  mockWhere.mockResolvedValue([{ best: null }]);

  const result = await submitTimeAttackRun({ correctCount: 3 });

  expect(result).toMatchObject({ isNewBest: true, allTimeBest: 3 });
});

test("passes through newly unlocked wardrobe items", async () => {
  mockGrantUnlockedFreeItems.mockResolvedValue([{ id: "item-1", name: "にじの ネックレス" }]);

  const result = await submitTimeAttackRun({ correctCount: 20 });

  expect(result?.unlockedItems).toEqual(["にじの ネックレス"]);
});

test("still returns a result when unlocking items fails", async () => {
  mockGrantUnlockedFreeItems.mockRejectedValue(new Error("boom"));
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});

  const result = await submitTimeAttackRun({ correctCount: 4 });

  expect(result).toMatchObject({ correctCount: 4 });
  expect(result?.unlockedItems).toEqual([]);
  spy.mockRestore();
});

test("does nothing when the user is not logged in", async () => {
  mockAuth.mockResolvedValue(null);

  const result = await submitTimeAttackRun({ correctCount: 10 });

  expect(result).toBeNull();
  expect(mockInsert).not.toHaveBeenCalled();
});

// Server Actionは画面を経由せず直接POSTできるため、受け取った値を検証する
test.each([
  ["negative", -1],
  ["not an integer", 1.5],
  ["too large", TIME_ATTACK_MAX_SANE_CORRECT_COUNT + 1],
  ["not a number", "10" as unknown as number],
])("rejects correctCount that is %s", async (_name, correctCount) => {
  const result = await submitTimeAttackRun({ correctCount });

  expect(result).toBeNull();
  expect(mockInsert).not.toHaveBeenCalled();
});
