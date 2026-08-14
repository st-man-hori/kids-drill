import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeaderContent } from "@/components/site-header-content";

test("points to the login page when logged out", () => {
  render(<SiteHeaderContent isLoggedIn={false} />);

  expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute("href", "/login");
  expect(screen.queryByRole("link", { name: "マイページ" })).not.toBeInTheDocument();
});

test("points to my page when logged in", () => {
  render(<SiteHeaderContent isLoggedIn={true} />);

  expect(screen.getByRole("link", { name: "マイページ" })).toHaveAttribute("href", "/mypage");
  expect(screen.queryByRole("link", { name: "ログイン" })).not.toBeInTheDocument();
});

// 遊んでいる最中に誤って押されると中断されるので、ヘッダーには置かない
test.each([true, false])("never offers to log out from the header (logged in: %s)", (isLoggedIn) => {
  render(<SiteHeaderContent isLoggedIn={isLoggedIn} />);

  expect(screen.queryByRole("button", { name: "ログアウト" })).not.toBeInTheDocument();
});
