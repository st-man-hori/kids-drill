import { expect, test } from "vitest";
import { generateLoginId, generateNickname, generatePin } from "@/lib/credentials";

test("generateLoginId returns a 6-digit numeric string", () => {
  expect(generateLoginId()).toMatch(/^\d{6}$/);
});

test("generatePin returns a 6-digit numeric string", () => {
  expect(generatePin()).toMatch(/^\d{6}$/);
});

test("generateNickname combines an adjective, an animal, and a 3-digit number", () => {
  const nickname = generateNickname();
  const match = nickname.match(/^([぀-ヿ]+?)(\d{3})$/);

  expect(match).not.toBeNull();

  const number = Number(match![2]);
  expect(number).toBeGreaterThanOrEqual(100);
  expect(number).toBeLessThanOrEqual(999);
});
