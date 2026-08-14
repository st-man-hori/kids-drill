import { expect, test } from "vitest";
import { AVATAR_GREETINGS, pickGreeting } from "@/lib/avatar-greeting";

test("every greeting can be drawn", () => {
  const drawn = new Set(
    Array.from({ length: AVATAR_GREETINGS.length }, (_, i) =>
      pickGreeting(i / AVATAR_GREETINGS.length),
    ),
  );

  expect(drawn.size).toBe(AVATAR_GREETINGS.length);
});

test("the first and last slice of the range map to the ends", () => {
  expect(pickGreeting(0)).toBe(AVATAR_GREETINGS[0]);
  expect(pickGreeting(0.999)).toBe(AVATAR_GREETINGS[AVATAR_GREETINGS.length - 1]);
});

// Math.randomは0以上1未満だが、範囲外を渡されても配列の外に出ないこと
test.each([1, 1.5, -0.2, Number.NaN])("stays inside the list for %s", (random) => {
  expect(AVATAR_GREETINGS).toContain(pickGreeting(random));
});

test("picks something without being given a number", () => {
  expect(AVATAR_GREETINGS).toContain(pickGreeting());
});
