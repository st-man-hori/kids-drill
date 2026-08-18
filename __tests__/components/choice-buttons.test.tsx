import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChoiceButtons } from "@/components/choice-buttons";

const CHOICES = ["いち", "にん", "さつ", "くん"];

test("calls onSelect with the tapped choice", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<ChoiceButtons choices={CHOICES} onSelect={onSelect} />);

  await user.click(screen.getByRole("button", { name: "にん" }));

  expect(onSelect).toHaveBeenCalledWith("にん");
});

test("disables every choice when disabled is true", () => {
  render(<ChoiceButtons choices={CHOICES} onSelect={() => {}} disabled />);

  for (const choice of CHOICES) {
    expect(screen.getByRole("button", { name: choice })).toBeDisabled();
  }
});
