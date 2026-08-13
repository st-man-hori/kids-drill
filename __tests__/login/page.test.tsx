import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/login/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

test("typing fewer than 6 digits keeps the user on the ID step", async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  await user.click(screen.getByRole("button", { name: "1" }));
  await user.click(screen.getByRole("button", { name: "2" }));
  await user.click(screen.getByRole("button", { name: "3" }));

  expect(screen.getByText("1", { selector: "div" })).toBeInTheDocument();
  expect(screen.getByText("2", { selector: "div" })).toBeInTheDocument();
  expect(screen.getByText("3", { selector: "div" })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "ID（あいでぃー）を おしてね" }),
  ).toBeInTheDocument();
});

test("backspace removes the last digit of the login ID", async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  await user.click(screen.getByRole("button", { name: "1" }));
  await user.click(screen.getByRole("button", { name: "2" }));
  await user.click(screen.getByRole("button", { name: "いちもじ けす" }));

  expect(screen.getByText("1", { selector: "div" })).toBeInTheDocument();
});

test("typing 6 digits auto-advances to the pin step", async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  for (const digit of ["1", "2", "3", "4", "5", "6"]) {
    await user.click(screen.getByRole("button", { name: digit }));
  }

  expect(
    screen.getByRole("heading", { name: "ひみつのばんごうを おしてね" }),
  ).toBeInTheDocument();
});
