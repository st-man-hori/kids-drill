import { beforeEach, expect, test, vi } from "vitest";

const {
  mockSubjectsFindFirst,
  mockProgressFindFirst,
  mockLevelsFindFirst,
  mockInsert,
  mockValues,
  mockOnConflictDoUpdate,
} = vi.hoisted(() => {
  const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  return {
    mockSubjectsFindFirst: vi.fn(),
    mockProgressFindFirst: vi.fn(),
    mockLevelsFindFirst: vi.fn(),
    mockInsert,
    mockValues,
    mockOnConflictDoUpdate,
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
}));

import { advanceToNextLevel, getCurrentLevel } from "@/lib/practice-progress";

const CONFIG = { minA: 1, maxA: 9, minB: 1, maxB: 9, carry: false };

beforeEach(() => {
  vi.clearAllMocks();
  mockSubjectsFindFirst.mockResolvedValue({ id: "subject-math" });
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
