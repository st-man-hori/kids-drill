import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/login/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

test("typing digits builds up the login ID and enables the next button", async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  const nextButton = screen.getByRole("button", { name: "つぎへ" });
  expect(nextButton).toBeDisabled();

  await user.click(screen.getByRole("button", { name: "1" }));
  await user.click(screen.getByRole("button", { name: "2" }));
  await user.click(screen.getByRole("button", { name: "3" }));

  expect(screen.getByText("123", { selector: "div" })).toBeInTheDocument();
  expect(nextButton).toBeEnabled();
});

test("backspace removes the last digit of the login ID", async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  await user.click(screen.getByRole("button", { name: "1" }));
  await user.click(screen.getByRole("button", { name: "2" }));
  await user.click(screen.getByRole("button", { name: "いちもじ けす" }));

  expect(screen.getByText("1", { selector: "div" })).toBeInTheDocument();
});

test("moving to the pin step shows the secret-number heading", async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  await user.click(screen.getByRole("button", { name: "1" }));
  await user.click(screen.getByRole("button", { name: "つぎへ" }));

  expect(
    screen.getByRole("heading", { name: "ひみつのばんごうを おしてね" }),
  ).toBeInTheDocument();
});
