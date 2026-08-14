import { beforeEach, expect, test, vi } from "vitest";
import { LEVEL_UP_CORRECT_COUNT, TOTAL_QUESTIONS, calculatePoints } from "@/lib/practice";

const {
  mockInsert,
  mockValues,
  mockUpdate,
  mockSet,
  mockAuth,
  mockGetCurrentLevel,
  mockAdvanceToNextLevel,
  mockDemoteIfStruggling,
} = vi.hoisted(() => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    const mockInsert = vi.fn(() => ({ values: mockValues }));
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn(() => ({ where: mockWhere }));
    const mockUpdate = vi.fn(() => ({ set: mockSet }));
    return {
      mockInsert,
      mockValues,
      mockUpdate,
      mockSet,
      mockAuth: vi.fn(),
      mockGetCurrentLevel: vi.fn(),
      mockAdvanceToNextLevel: vi.fn(),
      mockDemoteIfStruggling: vi.fn(),
    };
});

vi.mock("@/db", () => ({
  db: { insert: mockInsert, update: mockUpdate },
}));

vi.mock("@/db/schema", () => ({
  practiceSessions: { id: "id-column" },
  childProfiles: { id: "id-column", pointsBalance: "points-balance-column" },
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/practice-progress", () => ({
  getCurrentLevel: mockGetCurrentLevel,
  advanceToNextLevel: mockAdvanceToNextLevel,
  demoteIfStruggling: mockDemoteIfStruggling,
}));

import { submitPracticeSession } from "@/app/practice/add/actions";

const LEVEL_1 = {
  id: "level-1",
  levelNumber: 1,
  config: { minA: 1, maxA: 9, minB: 1, maxB: 9, carry: false },
};
const LEVEL_2 = {
  id: "level-2",
  levelNumber: 2,
  config: { minA: 1, maxA: 9, minB: 1, maxB: 9, carry: true },
};

const resultsOf = (correct: number, total = TOTAL_QUESTIONS) =>
  Array.from({ length: total }, (_, i) => i < correct);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "child-1" } });
  mockGetCurrentLevel.mockResolvedValue(LEVEL_1);
  mockAdvanceToNextLevel.mockResolvedValue(null);
  mockDemoteIfStruggling.mockResolvedValue(null);
});

test("records the session against the level held on the server, not one sent by the client", async () => {
  const startedAt = "2026-01-01T00:00:00.000Z";

  await submitPracticeSession({ results: resultsOf(8), startedAt });

  expect(mockGetCurrentLevel).toHaveBeenCalledWith("child-1", "add");
  expect(mockValues).toHaveBeenCalledOnce();
  const inserted = mockValues.mock.calls[0][0];
  expect(inserted.childId).toBe("child-1");
  expect(inserted.levelId).toBe("level-1");
  expect(inserted.totalQuestions).toBe(TOTAL_QUESTIONS);
  expect(inserted.correctCount).toBe(8);
  expect(inserted.startedAt).toEqual(new Date(startedAt));
  expect(inserted.finishedAt).toBeInstanceOf(Date);
});

test("adds the earned points to the child's balance", async () => {
  const results = resultsOf(TOTAL_QUESTIONS);

  const result = await submitPracticeSession({
    results,
    startedAt: new Date().toISOString(),
  });

  expect(mockUpdate).toHaveBeenCalledOnce();
  expect(mockSet).toHaveBeenCalledWith(
    expect.objectContaining({ pointsBalance: expect.anything() }),
  );
  expect(result?.pointsEarned).toBe(calculatePoints(results));
});

test("does not touch the points balance when nothing was correct", async () => {
  const result = await submitPracticeSession({
    results: resultsOf(0),
    startedAt: new Date().toISOString(),
  });

  expect(mockUpdate).not.toHaveBeenCalled();
  expect(result?.pointsEarned).toBe(0);
});

test("levels up and returns the next level once the threshold is reached", async () => {
  mockAdvanceToNextLevel.mockResolvedValue(LEVEL_2);

  const result = await submitPracticeSession({
    results: resultsOf(LEVEL_UP_CORRECT_COUNT),
    startedAt: new Date().toISOString(),
  });

  expect(mockAdvanceToNextLevel).toHaveBeenCalledWith("child-1", "add", 1);
  expect(result).toMatchObject({
    leveledUp: true,
    levelNumber: LEVEL_2.levelNumber,
    config: LEVEL_2.config,
  });
});

test("stays on the current level below the threshold", async () => {
  const result = await submitPracticeSession({
    results: resultsOf(LEVEL_UP_CORRECT_COUNT - 1),
    startedAt: new Date().toISOString(),
  });

  expect(mockAdvanceToNextLevel).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    leveledUp: false,
    levelNumber: LEVEL_1.levelNumber,
    config: LEVEL_1.config,
  });
});

test("serves the lower level's questions after a demotion", async () => {
  mockGetCurrentLevel.mockResolvedValue(LEVEL_2);
  mockDemoteIfStruggling.mockResolvedValue(LEVEL_1);

  const result = await submitPracticeSession({
    results: resultsOf(2),
    startedAt: new Date().toISOString(),
  });

  expect(mockDemoteIfStruggling).toHaveBeenCalledWith("child-1", "add", LEVEL_2);
  // 降級は演出しない。次の10問は下のレベルになるが、leveledUpはfalseのまま
  expect(result).toMatchObject({
    leveledUp: false,
    levelNumber: LEVEL_1.levelNumber,
    config: LEVEL_1.config,
  });
});

test("records the session against the pre-demotion level", async () => {
  mockGetCurrentLevel.mockResolvedValue(LEVEL_2);
  mockDemoteIfStruggling.mockResolvedValue(LEVEL_1);

  await submitPracticeSession({
    results: resultsOf(2),
    startedAt: new Date().toISOString(),
  });

  // 降級判定は今回のセッションも含めて数えるため、記録が先でなければならない
  expect(mockValues.mock.calls[0][0].levelId).toBe(LEVEL_2.id);
});

test("does not check for demotion when the child levelled up", async () => {
  mockAdvanceToNextLevel.mockResolvedValue(LEVEL_2);

  await submitPracticeSession({
    results: resultsOf(LEVEL_UP_CORRECT_COUNT),
    startedAt: new Date().toISOString(),
  });

  expect(mockDemoteIfStruggling).not.toHaveBeenCalled();
});

test("reports no level up when the child is already on the last level", async () => {
  mockAdvanceToNextLevel.mockResolvedValue(null);

  const result = await submitPracticeSession({
    results: resultsOf(TOTAL_QUESTIONS),
    startedAt: new Date().toISOString(),
  });

  expect(result).toMatchObject({ leveledUp: false, levelNumber: LEVEL_1.levelNumber });
});

test("does nothing when the user is not logged in", async () => {
  mockAuth.mockResolvedValue(null);

  const result = await submitPracticeSession({
    results: resultsOf(TOTAL_QUESTIONS),
    startedAt: new Date().toISOString(),
  });

  expect(result).toBeNull();
  expect(mockInsert).not.toHaveBeenCalled();
});

// Server Actionは画面を経由せず直接POSTできるため、受け取った配列を検証する
test.each([
  ["empty", []],
  ["longer than one set", resultsOf(TOTAL_QUESTIONS + 1, TOTAL_QUESTIONS + 1)],
  ["not booleans", ["yes", "no"] as unknown as boolean[]],
  ["not an array", "10" as unknown as boolean[]],
])("rejects results that are %s", async (_name, results) => {
  const result = await submitPracticeSession({
    results,
    startedAt: new Date().toISOString(),
  });

  expect(result).toBeNull();
  expect(mockInsert).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
});

test("falls back to the finish time when the start time is unusable", async () => {
  await submitPracticeSession({ results: resultsOf(5), startedAt: "not-a-date" });

  const inserted = mockValues.mock.calls[0][0];
  expect(inserted.startedAt).toEqual(inserted.finishedAt);
});

test("falls back to the finish time when the start time is in the future", async () => {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await submitPracticeSession({ results: resultsOf(5), startedAt: future });

  const inserted = mockValues.mock.calls[0][0];
  expect(inserted.startedAt).toEqual(inserted.finishedAt);
});
