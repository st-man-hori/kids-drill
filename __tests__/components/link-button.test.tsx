import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { LinkButton } from "@/components/link-button";

test("renders as a link pointing to the given href", () => {
  render(<LinkButton href="/signup">はじめる</LinkButton>);

  const link = screen.getByRole("link", { name: "はじめる" });
  expect(link).toHaveAttribute("href", "/signup");
});
