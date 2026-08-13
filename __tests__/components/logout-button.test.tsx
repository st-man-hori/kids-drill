import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signOut } from "next-auth/react";
import { LogoutButton } from "@/components/logout-button";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

test("signs out and navigates to the top page when pressed", async () => {
  vi.mocked(signOut).mockResolvedValue({} as Awaited<ReturnType<typeof signOut>>);
  const user = userEvent.setup();
  render(<LogoutButton />);

  await user.click(screen.getByRole("button", { name: "ログアウト" }));

  expect(signOut).toHaveBeenCalledWith({ redirect: false });
  expect(pushMock).toHaveBeenCalledWith("/");
  expect(refreshMock).toHaveBeenCalledOnce();
});
