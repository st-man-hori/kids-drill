import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "@/app/signup/page";
import { registerChild } from "@/app/signup/actions";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/app/signup/actions", () => ({
  registerChild: vi.fn(),
}));

beforeEach(() => {
  pushMock.mockClear();
  vi.mocked(registerChild).mockReset();
});

test("tapping はじめる reveals the issued credentials", async () => {
  vi.mocked(registerChild).mockResolvedValue({
    success: true,
    loginId: "123456",
    pin: "654321",
    nickname: "げんきなトラ402",
  });
  const user = userEvent.setup();
  render(<SignupPage />);

  await user.click(screen.getByRole("button", { name: "はじめる" }));

  expect(await screen.findByText(/げんきなトラ402/)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "とうろく できたよ！" })).toBeInTheDocument();
});

test("confirming after reveal navigates to the login page", async () => {
  vi.mocked(registerChild).mockResolvedValue({
    success: true,
    loginId: "123456",
    pin: "654321",
    nickname: "げんきなトラ402",
  });
  const user = userEvent.setup();
  render(<SignupPage />);

  await user.click(screen.getByRole("button", { name: "はじめる" }));
  await user.click(await screen.findByRole("button", { name: "かいたよ！つぎへ" }));

  expect(pushMock).toHaveBeenCalledWith("/login");
});

test("shows an error message and stays on the start screen when registration fails", async () => {
  vi.mocked(registerChild).mockResolvedValue({ success: false });
  const user = userEvent.setup();
  render(<SignupPage />);

  await user.click(screen.getByRole("button", { name: "はじめる" }));

  expect(
    await screen.findByText("うまく とうろく できなかったよ。もういちど ためしてね"),
  ).toBeInTheDocument();
});
