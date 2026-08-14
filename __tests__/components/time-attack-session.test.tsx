import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { submitTimeAttackRun } from "@/app/time-attack/actions";
import { TimeAttackSession } from "@/components/time-attack-session";
import {
  TIME_ATTACK_DURATION_SECONDS,
  TIME_ATTACK_FLASH_MS,
  TIME_ATTACK_PENALTY_SECONDS,
} from "@/lib/time-attack";

vi.mock("@/app/time-attack/actions", () => ({
  submitTimeAttackRun: vi.fn(),
}));

// generateQuestionはMath.random依存なので、出題だけ固定にする
// (answerMaxLengthなど他のロジックは本物のまま使う)
vi.mock("@/lib/practice", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/practice")>();
  return { ...actual, generateQuestion: () => ({ a: 1, b: 1, answer: 2 }) };
});

const CONFIG = { minA: 1, maxA: 9, minB: 1, maxB: 9, carry: false };

// フェイクタイマー下ではuserEventの内部待機が固まるため、同期的なfireEventで操作する
// (practice-session.test.tsxと同じ理由)
const tap = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const start = () => tap("スタート！");
const answerWith = (digit: string) => {
  tap(digit);
  tap("こたえる");
};
const elapse = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.mocked(submitTimeAttackRun).mockResolvedValue({
    correctCount: 0,
    isNewBest: false,
    allTimeBest: 0,
    unlockedItems: [],
  });
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

test("shows the start screen before play begins", () => {
  render(<TimeAttackSession config={CONFIG} />);

  expect(screen.getByText("たいむあたっく")).toBeInTheDocument();
  expect(
    screen.getByText(`${TIME_ATTACK_DURATION_SECONDS}びょうで なんもん とけるかな？`),
  ).toBeInTheDocument();
});

test("starts the run and shows the first question with a fresh timer", () => {
  render(<TimeAttackSession config={CONFIG} />);

  start();

  expect(screen.getByText("1 ＋ 1 ＝")).toBeInTheDocument();
  expect(screen.getByText(`のこり ${TIME_ATTACK_DURATION_SECONDS}びょう`)).toBeInTheDocument();
  expect(screen.getByText("せいかい 0もん")).toBeInTheDocument();
});

test("a correct answer increases the score and clears the input for the next question", () => {
  render(<TimeAttackSession config={CONFIG} />);
  start();

  answerWith("2");

  expect(screen.getByText("せいかい 1もん")).toBeInTheDocument();
});

test("an incorrect answer does not increase the score and applies a time penalty", () => {
  render(<TimeAttackSession config={CONFIG} />);
  start();

  answerWith("9");

  expect(screen.getByText("せいかい 0もん")).toBeInTheDocument();
  expect(screen.getByText(`-${TIME_ATTACK_PENALTY_SECONDS}びょう`)).toBeInTheDocument();

  elapse(200);
  expect(
    screen.getByText(`のこり ${TIME_ATTACK_DURATION_SECONDS - TIME_ATTACK_PENALTY_SECONDS}びょう`),
  ).toBeInTheDocument();
});

test("the keypad stays enabled while the feedback flash is on screen", () => {
  render(<TimeAttackSession config={CONFIG} />);
  start();

  answerWith("2");

  expect(screen.getByRole("button", { name: "9" })).toBeEnabled();
});

test("the feedback flash disappears on its own without blocking input", () => {
  render(<TimeAttackSession config={CONFIG} />);
  start();

  answerWith("2");
  expect(screen.getByText("○")).toBeInTheDocument();

  elapse(TIME_ATTACK_FLASH_MS);
  expect(screen.queryByText("○")).not.toBeInTheDocument();
});

test("finishes when the clock runs out and submits the score", () => {
  render(<TimeAttackSession config={CONFIG} />);
  start();

  answerWith("2");
  answerWith("2");
  elapse(TIME_ATTACK_DURATION_SECONDS * 1000);

  expect(screen.getByText("タイムアップ！")).toBeInTheDocument();
  expect(screen.getByText("2もん せいかい できたよ！")).toBeInTheDocument();
  expect(submitTimeAttackRun).toHaveBeenCalledWith({ correctCount: 2 });
});

test("shows the new best badge once the record comes back", async () => {
  vi.mocked(submitTimeAttackRun).mockResolvedValue({
    correctCount: 5,
    isNewBest: true,
    allTimeBest: 5,
    unlockedItems: [],
  });
  render(<TimeAttackSession config={CONFIG} />);
  start();
  elapse(TIME_ATTACK_DURATION_SECONDS * 1000);
  vi.useRealTimers();

  expect(await screen.findByText("あたらしい じこベスト！ 5てん")).toBeInTheDocument();
});

test("tells the child about newly unlocked wardrobe items", async () => {
  vi.mocked(submitTimeAttackRun).mockResolvedValue({
    correctCount: 20,
    isNewBest: true,
    allTimeBest: 20,
    unlockedItems: ["にじの ネックレス"],
  });
  render(<TimeAttackSession config={CONFIG} />);
  start();
  elapse(TIME_ATTACK_DURATION_SECONDS * 1000);
  vi.useRealTimers();

  expect(
    await screen.findByText("あたらしい にじの ネックレスを てにいれた！"),
  ).toBeInTheDocument();
});

test("retrying starts a brand new run", () => {
  render(<TimeAttackSession config={CONFIG} />);
  start();
  answerWith("2");
  elapse(TIME_ATTACK_DURATION_SECONDS * 1000);

  tap("もういちど");

  expect(screen.getByText("1 ＋ 1 ＝")).toBeInTheDocument();
  expect(screen.getByText("せいかい 0もん")).toBeInTheDocument();
  expect(screen.getByText(`のこり ${TIME_ATTACK_DURATION_SECONDS}びょう`)).toBeInTheDocument();
});

test("can be answered with a physical keyboard", () => {
  render(<TimeAttackSession config={CONFIG} />);
  start();

  fireEvent.keyDown(window, { key: "2" });
  fireEvent.keyDown(window, { key: "Enter" });

  expect(screen.getByText("せいかい 1もん")).toBeInTheDocument();
});
