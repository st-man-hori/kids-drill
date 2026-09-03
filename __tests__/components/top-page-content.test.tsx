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

  // ヒーローと紹介セクション末尾の2箇所にCTAがあるため複数ヒットしうる
  for (const link of screen.getAllByRole("link", { name: "はじめる" })) {
    expect(link).toHaveAttribute("href", "/signup");
  }
  for (const link of screen.getAllByRole("link", { name: "ログイン" })) {
    expect(link).toHaveAttribute("href", "/login");
  }
  expect(screen.queryByRole("link", { name: "マイページへ" })).not.toBeInTheDocument();
});

test("shows an introduction for logged-out visitors", () => {
  render(<TopPageContent isLoggedIn={false} />);

  expect(
    screen.getByRole("heading", { level: 2, name: "対応している教科・学年" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "保護者の方へ" })).toBeInTheDocument();
});

test("hides the introduction sections when logged in", () => {
  render(<TopPageContent isLoggedIn={true} />);

  expect(
    screen.queryByRole("heading", { level: 2, name: "対応している教科・学年" }),
  ).not.toBeInTheDocument();
});

test("shows a link to mypage when logged in", () => {
  render(<TopPageContent isLoggedIn={true} />);

  expect(screen.getByRole("link", { name: "マイページへ" })).toHaveAttribute("href", "/mypage");
  expect(screen.queryByRole("link", { name: "はじめる" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "ログイン" })).not.toBeInTheDocument();
});
