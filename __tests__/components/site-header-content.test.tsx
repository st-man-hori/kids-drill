import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeaderContent } from "@/components/site-header-content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

test("does not show a logout button when logged out", () => {
  render(<SiteHeaderContent isLoggedIn={false} />);
  expect(screen.queryByRole("button", { name: "ログアウト" })).not.toBeInTheDocument();
});

test("shows a logout button when logged in", () => {
  render(<SiteHeaderContent isLoggedIn={true} />);
  expect(screen.getByRole("button", { name: "ログアウト" })).toBeInTheDocument();
});
