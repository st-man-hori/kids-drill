import { beforeEach, expect, test, vi } from "vitest";

const {
  mockSubjectsFindFirst,
  mockProgressFindFirst,
  mockLevelsFindFirst,
  mockInsert,
  mockValues,
  mockOnConflictDoUpdate,
  mockSelect,
  mockLimit,
} = vi.hoisted(() => {
  const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  // db.select().from().where().orderBy().limit() のチェーン
  const mockLimit = vi.fn().mockResolvedValue([]);
  const mockSelect = vi.fn(() => ({
    from: () => ({
      where: () => ({ orderBy: () => ({ limit: mockLimit }) }),
    }),
  }));
  return {
    mockSubjectsFindFirst: vi.fn(),
    mockProgressFindFirst: vi.fn(),
    mockLevelsFindFirst: vi.fn(),
    mockInsert,
    mockValues,
    mockOnConflictDoUpdate,
    mockSelect,
    mockLimit,
  };
});

vi.mock("@/db", () => ({
  db: {
    query: {
      subjects: { findFirst: mockSubjectsFindFirst },
      childProgress: { findFirst: mockProgressFindFirst },
      difficultyLevels: { findFirst: mockLevelsFindFirst },
    },
    insert: mockInsert,
    select: mockSelect,
  },
}));

vi.mock("@/db/schema", () => ({
  subjects: { slug: "slug-column" },
  childProgress: {
    childId: "child-id-column",
    subjectId: "subject-id-column",
    skillType: "skill-type-column",
  },
  difficultyLevels: {
    id: "id-column",
    subjectId: "subject-id-column",
    skillType: "skill-type-column",
    levelNumber: "level-number-column",
  },
  practiceSessions: {
    childId: "child-id-column",
    levelId: "level-id-column",
    correctCount: "correct-count-column",
    totalQuestions: "total-questions-column",
    startedAt: "started-at-column",
  },
}));

import {
  advanceToNextLevel,
  demoteIfStruggling,
  getCurrentLevel,
} from "@/lib/practice-progress";
import {
  LEVEL_DOWN_CORRECT_COUNT,
  LEVEL_DOWN_STREAK,
  TOTAL_QUESTIONS,
} from "@/lib/practice";

const CONFIG = { minA: 1, maxA: 9, minB: 1, maxB: 9, carry: false };

beforeEach(() => {
  vi.clearAllMocks();
  mockSubjectsFindFirst.mockResolvedValue({ id: "subject-math" });
  mockLimit.mockResolvedValue([]);
});

test("starts at level 1 when the child has no progress row yet", async () => {
  mockProgressFindFirst.mockResolvedValue(undefined);
  mockLevelsFindFirst.mockResolvedValue({ id: "level-1", levelNumber: 1, config: CONFIG });

  const level = await getCurrentLevel("child-1", "add");

  expect(level).toEqual({ id: "level-1", levelNumber: 1, config: CONFIG });
  // 表示のための読み取りでchild_progressに書き込まないこと
  expect(mockInsert).not.toHaveBeenCalled();
});

test("returns the level recorded in child_progress", async () => {
  mockProgressFindFirst.mockResolvedValue({ currentLevelId: "level-3" });
  mockLevelsFindFirst.mockResolvedValue({ id: "level-3", levelNumber: 3, config: CONFIG });

  const level = await getCurrentLevel("child-1", "add");

  expect(level.id).toBe("level-3");
  expect(level.levelNumber).toBe(3);
});

test("asks for migrations to be run when the subject is missing", async () => {
  mockSubjectsFindFirst.mockResolvedValue(undefined);

  await expect(getCurrentLevel("child-1", "add")).rejects.toThrow("db:migrate");
});

test("asks for migrations to be run when no level exists", async () => {
  mockProgressFindFirst.mockResolvedValue(undefined);
  mockLevelsFindFirst.mockResolvedValue(undefined);

  await expect(getCurrentLevel("child-1", "add")).rejects.toThrow("db:migrate");
});

test("advancing writes the next level to child_progress", async () => {
  mockLevelsFindFirst.mockResolvedValue({ id: "level-2", levelNumber: 2, config: CONFIG });

  const level = await advanceToNextLevel("child-1", "add", 1);

  expect(level).toEqual({ id: "level-2", levelNumber: 2, config: CONFIG });
  expect(mockValues).toHaveBeenCalledWith(
    expect.objectContaining({
      childId: "child-1",
      subjectId: "subject-math",
      skillType: "add",
      currentLevelId: "level-2",
    }),
  );
  // 初回はINSERT、2回目以降はUPDATEになる必要がある
  expect(mockOnConflictDoUpdate).toHaveBeenCalledOnce();
});

test("does not advance past the highest level", async () => {
  mockLevelsFindFirst.mockResolvedValue(undefined);

  const level = await advanceToNextLevel("child-1", "add", 5);

  expect(level).toBeNull();
  expect(mockInsert).not.toHaveBeenCalled();
});

const LEVEL_3 = { id: "level-3", levelNumber: 3, config: CONFIG };
const struggling = {
  correctCount: LEVEL_DOWN_CORRECT_COUNT,
  totalQuestions: TOTAL_QUESTIONS,
};
const decent = {
  correctCount: LEVEL_DOWN_CORRECT_COUNT + 1,
  totalQuestions: TOTAL_QUESTIONS,
};

test("demotes after a streak of poor sessions on the current level", async () => {
  mockLimit.mockResolvedValue(Array(LEVEL_DOWN_STREAK).fill(struggling));
  mockLevelsFindFirst.mockResolvedValue({ id: "level-2", levelNumber: 2, config: CONFIG });

  const level = await demoteIfStruggling("child-1", "add", LEVEL_3);

  expect(level).toEqual({ id: "level-2", levelNumber: 2, config: CONFIG });
  expect(mockValues).toHaveBeenCalledWith(
    expect.objectContaining({ childId: "child-1", currentLevelId: "level-2" }),
  );
});

test("does not demote when one session in the streak was good enough", async () => {
  mockLimit.mockResolvedValue([struggling, decent]);

  const level = await demoteIfStruggling("child-1", "add", LEVEL_3);

  expect(level).toBeNull();
  expect(mockInsert).not.toHaveBeenCalled();
});

test("does not demote on a single bad session", async () => {
  mockLimit.mockResolvedValue([struggling]);

  const level = await demoteIfStruggling("child-1", "add", LEVEL_3);

  expect(level).toBeNull();
  expect(mockInsert).not.toHaveBeenCalled();
});

test("does not demote below level 1", async () => {
  const level = await demoteIfStruggling("child-1", "add", {
    id: "level-1",
    levelNumber: 1,
    config: CONFIG,
  });

  expect(level).toBeNull();
  // Lv1なら記録を読みに行く必要すらない
  expect(mockSelect).not.toHaveBeenCalled();
  expect(mockInsert).not.toHaveBeenCalled();
});

test("ignores short sessions when judging a demotion", async () => {
  // 「もっとやる」を途中でやめた10問未満のセッションは判定に含めない
  mockLimit.mockResolvedValue([struggling, { correctCount: 1, totalQuestions: 3 }]);

  const level = await demoteIfStruggling("child-1", "add", LEVEL_3);

  expect(level).toBeNull();
  expect(mockInsert).not.toHaveBeenCalled();
});
