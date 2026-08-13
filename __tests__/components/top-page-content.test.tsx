import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopPageContent } from "@/components/top-page-content";

test("renders the main heading", () => {
  render(<TopPageContent isLoggedIn={false} />);
  expect(
    screen.getByRole("heading", { level: 1, name: /キャラクターをそだてよう/ }),
  ).toBeInTheDocument();
});

test("shows signup and login links when logged out", () => {
  render(<TopPageContent isLoggedIn={false} />);

  expect(screen.getByRole("link", { name: "はじめる" })).toHaveAttribute("href", "/signup");
  expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute("href", "/login");
  expect(screen.queryByRole("link", { name: "マイページへ" })).not.toBeInTheDocument();
});

test("shows a link to mypage when logged in", () => {
  render(<TopPageContent isLoggedIn={true} />);

  expect(screen.getByRole("link", { name: "マイページへ" })).toHaveAttribute("href", "/mypage");
  expect(screen.queryByRole("link", { name: "はじめる" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "ログイン" })).not.toBeInTheDocument();
});
