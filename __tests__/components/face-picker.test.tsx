import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FacePicker } from "@/components/face-picker";
import { updateFaceAction } from "@/app/face/actions";
import type { ChildFace } from "@/lib/face";

vi.mock("@/app/face/actions", () => ({
  updateFaceAction: vi.fn(),
}));

const face: ChildFace = { skinTone: "light", eyeStyle: "dot", mouthStyle: "smile" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(updateFaceAction).mockResolvedValue({ ok: true });
});

test("tapping a swatch marks it selected and saves it", async () => {
  const user = userEvent.setup();
  render(<FacePicker initialFace={face} />);

  const skinRow = screen.getByText("はだの いろ").closest("div");
  const buttons = skinRow ? Array.from(skinRow.querySelectorAll("button")) : [];
  // 1番目(light)は初期選択、2番目(beige)をタップする
  await user.click(buttons[1]);

  expect(buttons[1]).toHaveClass("ring-2");
  expect(buttons[0]).not.toHaveClass("ring-2");
  expect(updateFaceAction).toHaveBeenCalledWith({ skinTone: "beige" });
});

test("reverts the selection when the server refuses to save it", async () => {
  vi.mocked(updateFaceAction).mockResolvedValue({ ok: false });
  const user = userEvent.setup();
  render(<FacePicker initialFace={face} />);

  const mouthRow = screen.getByText("くち").closest("div");
  const buttons = mouthRow ? Array.from(mouthRow.querySelectorAll("button")) : [];
  await user.click(buttons[1]);

  expect(
    await screen.findByText("うまく へんこう できなかったよ。もういちど ためしてね"),
  ).toBeInTheDocument();
  expect(buttons[0]).toHaveClass("ring-2");
  expect(buttons[1]).not.toHaveClass("ring-2");
});

test("each row only changes its own part", async () => {
  const user = userEvent.setup();
  render(<FacePicker initialFace={face} />);

  const eyeRow = screen.getByText("め").closest("div");
  const eyeButtons = eyeRow ? Array.from(eyeRow.querySelectorAll("button")) : [];
  await user.click(eyeButtons[2]);

  expect(updateFaceAction).toHaveBeenCalledTimes(1);
  expect(updateFaceAction).toHaveBeenCalledWith({ eyeStyle: "happy" });

  const skinRow = screen.getByText("はだの いろ").closest("div");
  const skinButtons = skinRow ? Array.from(skinRow.querySelectorAll("button")) : [];
  expect(skinButtons[0]).toHaveClass("ring-2");
});
