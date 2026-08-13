import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import TopPage from "../src/app/page";

test("TopPage renders the main heading", () => {
  render(<TopPage />);
  expect(
    screen.getByRole("heading", { level: 1, name: /キャラクターをそだてよう/ }),
  ).toBeDefined();
});
