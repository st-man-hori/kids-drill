import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumericKeypad } from "@/components/numeric-keypad";

test("calls onDigit with the pressed number", async () => {
  const user = userEvent.setup();
  const onDigit = vi.fn();
  render(<NumericKeypad onDigit={onDigit} onBackspace={() => {}} />);

  await user.click(screen.getByRole("button", { name: "5" }));

  expect(onDigit).toHaveBeenCalledWith("5");
});

test("calls onBackspace when the delete key is pressed", async () => {
  const user = userEvent.setup();
  const onBackspace = vi.fn();
  render(<NumericKeypad onDigit={() => {}} onBackspace={onBackspace} />);

  await user.click(screen.getByRole("button", { name: "いちもじ けす" }));

  expect(onBackspace).toHaveBeenCalledOnce();
});

test("disables every key when disabled is true", () => {
  render(<NumericKeypad onDigit={() => {}} onBackspace={() => {}} disabled />);

  expect(screen.getByRole("button", { name: "5" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "いちもじ けす" })).toBeDisabled();
});
