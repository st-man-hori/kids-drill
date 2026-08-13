import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { CtaButton } from "@/components/cta-button";

test("renders as a link pointing to the given href", () => {
  render(<CtaButton href="/signup">はじめる</CtaButton>);

  const link = screen.getByRole("link", { name: "はじめる" });
  expect(link).toHaveAttribute("href", "/signup");
});
