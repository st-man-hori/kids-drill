import { beforeEach, expect, test, vi } from "vitest";

const {
  mockSubjectsFindFirst,
  mockProgressFindFirst,
  mockLevelsFindFirst,
  mockKanjiQuestionsFindMany,
  mockInsert,
  mockValues,
  mockOnConflictDoUpdate,
  mockSelect,
  mockLimit,
} = vi.hoisted(() => {
  const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
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
    mockKanjiQuestionsFindMany: vi.fn(),
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
      kanjiQuestions: { findMany: mockKanjiQuestionsFindMany },
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
  kanjiQuestions: {
    levelId: "level-id-column",
  },
}));

import {
  advanceToNextLevel,
  demoteIfStruggling,
  getCurrentLevel,
  getKanjiQuestionPool,
} from "@/lib/kokugo-progress";
import { LEVEL_DOWN_CORRECT_COUNT, LEVEL_DOWN_STREAK, TOTAL_QUESTIONS } from "@/lib/practice";
import { KANJI_YOMI_SKILL_TYPE } from "@/lib/kokugo";

beforeEach(() => {
  vi.clearAllMocks();
  mockSubjectsFindFirst.mockResolvedValue({ id: "subject-kokugo" });
  mockLimit.mockResolvedValue([]);
});

test("starts at level 1 when the child has no progress row yet", async () => {
  mockProgressFindFirst.mockResolvedValue(undefined);
  mockLevelsFindFirst.mockResolvedValue({ id: "level-1", levelNumber: 1 });

  const level = await getCurrentLevel("child-1", KANJI_YOMI_SKILL_TYPE);

  expect(level).toEqual({ id: "level-1", levelNumber: 1 });
  expect(mockInsert).not.toHaveBeenCalled();
});

test("asks for migrations to be run when the subject is missing", async () => {
  mockSubjectsFindFirst.mockResolvedValue(undefined);

  await expect(getCurrentLevel("child-1", KANJI_YOMI_SKILL_TYPE)).rejects.toThrow("db:migrate");
});

test("advancing writes the next level to child_progress", async () => {
  mockLevelsFindFirst.mockResolvedValue({ id: "level-2", levelNumber: 2 });

  const level = await advanceToNextLevel("child-1", KANJI_YOMI_SKILL_TYPE, 1);

  expect(level).toEqual({ id: "level-2", levelNumber: 2 });
  expect(mockValues).toHaveBeenCalledWith(
    expect.objectContaining({
      childId: "child-1",
      subjectId: "subject-kokugo",
      skillType: KANJI_YOMI_SKILL_TYPE,
      currentLevelId: "level-2",
    }),
  );
  expect(mockOnConflictDoUpdate).toHaveBeenCalledOnce();
});

test("does not advance past the highest level", async () => {
  mockLevelsFindFirst.mockResolvedValue(undefined);

  const level = await advanceToNextLevel("child-1", KANJI_YOMI_SKILL_TYPE, 3);

  expect(level).toBeNull();
  expect(mockInsert).not.toHaveBeenCalled();
});

const LEVEL_2 = { id: "level-2", levelNumber: 2 };
const struggling = { correctCount: LEVEL_DOWN_CORRECT_COUNT, totalQuestions: TOTAL_QUESTIONS };

test("demotes after a streak of poor sessions on the current level", async () => {
  mockLimit.mockResolvedValue(Array(LEVEL_DOWN_STREAK).fill(struggling));
  mockLevelsFindFirst.mockResolvedValue({ id: "level-1", levelNumber: 1 });

  const level = await demoteIfStruggling("child-1", KANJI_YOMI_SKILL_TYPE, LEVEL_2);

  expect(level).toEqual({ id: "level-1", levelNumber: 1 });
});

test("does not demote below level 1", async () => {
  const level = await demoteIfStruggling("child-1", KANJI_YOMI_SKILL_TYPE, {
    id: "level-1",
    levelNumber: 1,
  });

  expect(level).toBeNull();
  expect(mockSelect).not.toHaveBeenCalled();
});

test("getKanjiQuestionPool maps DB rows into bank entries", async () => {
  mockKanjiQuestionsFindMany.mockResolvedValue([
    {
      id: "q1",
      kanji: "一",
      correctReading: "いち",
      distractorReadings: ["にん", "さつ", "くん"],
      exampleWord: "一番",
      readingTemplate: "○○ばん",
    },
  ]);

  const pool = await getKanjiQuestionPool("level-1");

  expect(pool).toEqual([
    {
      id: "q1",
      kanji: "一",
      correctReading: "いち",
      distractorReadings: ["にん", "さつ", "くん"],
      exampleWord: "一番",
      readingTemplate: "○○ばん",
    },
  ]);
});
