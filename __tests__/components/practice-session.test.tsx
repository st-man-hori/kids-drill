import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { submitPracticeSession } from "@/app/practice/add/actions";
import { PracticeSession } from "@/components/practice-session";
import { TOTAL_QUESTIONS } from "@/lib/practice";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/app/practice/add/actions", () => ({
  submitPracticeSession: vi.fn(),
}));

const CONFIG = { minA: 1, maxA: 9, minB: 1, maxB: 9, carry: false };
const questions = Array.from({ length: TOTAL_QUESTIONS }, () => ({ a: 1, b: 1, answer: 2 }));

const renderSession = () =>
  render(<PracticeSession config={CONFIG} questions={questions} />);

// レベル番号は画面に出さないので、「どのレベルの問題が出ているか」は
// 出題されている式そのもの（繰り上がりの有無）で確かめる
const displayedCarry = () => {
  const [a, b] = (screen.getByRole("heading", { level: 1 }).textContent ?? "")
    .match(/\d+/g)!
    .map(Number);
  return (a % 10) + b >= 10;
};

// 1問ぶん「こたえる」→「つぎへ」まで進める
const answerOnce = async (user: ReturnType<typeof userEvent.setup>, digit: string) => {
  await user.click(screen.getByRole("button", { name: digit }));
  await user.click(screen.getByRole("button", { name: "こたえる" }));
  await user.click(screen.getByRole("button", { name: "つぎへ" }));
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(submitPracticeSession).mockResolvedValue({
    pointsEarned: 150,
    leveledUp: false,
    levelNumber: 1,
    config: CONFIG,
  });
});

test("shows the question and a correct answer produces positive feedback", async () => {
  const user = userEvent.setup();
  renderSession();

  expect(screen.getByText("1 ＋ 1 ＝")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "2" }));
  await user.click(screen.getByRole("button", { name: "こたえる" }));

  expect(screen.getByText("せいかい！")).toBeInTheDocument();
});

test("an incorrect answer reveals the correct answer", async () => {
  const user = userEvent.setup();
  renderSession();

  await user.click(screen.getByRole("button", { name: "5" }));
  await user.click(screen.getByRole("button", { name: "こたえる" }));

  expect(screen.getByText("ざんねん…こたえは 2 だよ")).toBeInTheDocument();
});

test("celebrates a streak once three answers in a row are correct", async () => {
  const user = userEvent.setup();
  renderSession();

  await answerOnce(user, "2");
  await answerOnce(user, "2");
  await user.click(screen.getByRole("button", { name: "2" }));
  await user.click(screen.getByRole("button", { name: "こたえる" }));

  expect(screen.getByText("3れんぞく せいかい！")).toBeInTheDocument();
});

test("a wrong answer resets the streak", async () => {
  const user = userEvent.setup();
  renderSession();

  await answerOnce(user, "2");
  await answerOnce(user, "2");
  await answerOnce(user, "5");
  await user.click(screen.getByRole("button", { name: "2" }));
  await user.click(screen.getByRole("button", { name: "こたえる" }));

  expect(screen.getByText("せいかい！")).toBeInTheDocument();
});

test("does not accept more digits than the level's largest answer", async () => {
  const user = userEvent.setup();
  renderSession();

  // このレベルの最大の答えは18なので2桁まで
  await user.click(screen.getByRole("button", { name: "1" }));
  await user.click(screen.getByRole("button", { name: "2" }));
  await user.click(screen.getByRole("button", { name: "3" }));

  expect(screen.getByRole("status")).toHaveTextContent("12");
});

test("can be answered with a physical keyboard", async () => {
  const user = userEvent.setup();
  renderSession();

  await user.keyboard("12");
  expect(screen.getByRole("status")).toHaveTextContent("12");

  await user.keyboard("{Backspace}");
  expect(screen.getByRole("status")).toHaveTextContent("1");

  await user.keyboard("{Backspace}2{Enter}");
  expect(screen.getByText("せいかい！")).toBeInTheDocument();

  await user.keyboard("{Enter}");
  expect(screen.getByText("2 もんめ ／ 10もん")).toBeInTheDocument();
});

test("the keypad is disabled while feedback is on screen", async () => {
  const user = userEvent.setup();
  renderSession();

  await user.click(screen.getByRole("button", { name: "2" }));
  await user.click(screen.getByRole("button", { name: "こたえる" }));

  // キーパッドは押せなくなるが、画面が動かないよう表示は残す
  expect(screen.getByRole("button", { name: "5" })).toBeDisabled();
});

test("submits the per-question results and shows what was earned", async () => {
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await answerOnce(user, i === 0 ? "5" : "2");
  }

  expect(screen.getByText("10もんちゅう 9もん せいかい！")).toBeInTheDocument();

  // 記録は結果画面に着いた時点で送る（もどるボタン待ちにしない）
  expect(submitPracticeSession).toHaveBeenCalledOnce();
  const submitted = vi.mocked(submitPracticeSession).mock.calls[0][0];
  expect(submitted.results).toEqual([false, ...Array(TOTAL_QUESTIONS - 1).fill(true)]);
  expect(typeof submitted.startedAt).toBe("string");

  expect(await screen.findByText("150 ポイント ゲット！")).toBeInTheDocument();
  expect(screen.getByText("さいこう 9れんぞく！")).toBeInTheDocument();
});

test("announces a level up and plays the next set at the new level", async () => {
  vi.mocked(submitPracticeSession).mockResolvedValue({
    pointsEarned: 150,
    leveledUp: true,
    levelNumber: 2,
    config: { minA: 1, maxA: 9, minB: 1, maxB: 9, carry: true },
  });
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await answerOnce(user, "2");
  }

  expect(
    await screen.findByText("レベルアップ！ つぎは もうすこし むずかしいよ"),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "もっと やる" }));

  // 次の10問は繰り上がりありのレベルになっている
  expect(displayedCarry()).toBe(true);
  expect(screen.getByText("1 もんめ ／ 10もん")).toBeInTheDocument();
});

test("plays the next set at the lower level after a silent demotion", async () => {
  vi.mocked(submitPracticeSession).mockResolvedValue({
    pointsEarned: 20,
    // 降級は演出しないのでleveledUpはfalseのまま、configだけ下のレベルになる
    leveledUp: false,
    levelNumber: 1,
    config: CONFIG,
  });
  const user = userEvent.setup();
  render(
    <PracticeSession
      config={{ minA: 1, maxA: 9, minB: 1, maxB: 9, carry: true }}
      questions={questions}
    />,
  );

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await answerOnce(user, "2");
  }
  await screen.findByText("20 ポイント ゲット！");

  // 「レベルが下がった」ことを子どもに知らせる表示は出さない
  expect(screen.queryByText(/レベル/)).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "もっと やる" }));

  // 黙って易しい（繰り上がりなしの）問題に戻っている
  expect(displayedCarry()).toBe(false);
});

test("keeps playing the same level when the level is unchanged", async () => {
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await answerOnce(user, "2");
  }
  await screen.findByText("150 ポイント ゲット！");
  await user.click(screen.getByRole("button", { name: "もっと やる" }));

  // レベルが変わっていないので、次の10問も繰り上がりなしのまま
  expect(displayedCarry()).toBe(false);

  // 次の10問も終われば、その10問ぶんの記録が別に送られる
  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await answerOnce(user, "2");
  }

  expect(submitPracticeSession).toHaveBeenCalledTimes(2);
});

test("going back to the my page navigates and refreshes", async () => {
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await answerOnce(user, "2");
  }
  await user.click(screen.getByRole("button", { name: "マイページへ もどる" }));

  expect(pushMock).toHaveBeenCalledWith("/mypage");
  expect(refreshMock).toHaveBeenCalledOnce();
});

test("still lets the child continue when saving the results fails", async () => {
  vi.mocked(submitPracticeSession).mockRejectedValue(new Error("network down"));
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await answerOnce(user, "2");
  }

  expect(screen.getByText("10もんちゅう 10もん せいかい！")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "もっと やる" }));
  expect(screen.getByText("1 もんめ ／ 10もん")).toBeInTheDocument();

  consoleError.mockRestore();
});
