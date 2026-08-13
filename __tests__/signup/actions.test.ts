import { beforeEach, expect, test, vi } from "vitest";

const { mockInsert, mockValues, mockOnConflictDoNothing, mockReturning } = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockOnConflictDoNothing = vi.fn(() => ({ returning: mockReturning }));
  const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  return { mockInsert, mockValues, mockOnConflictDoNothing, mockReturning };
});

vi.mock("@/db", () => ({
  db: { insert: mockInsert },
}));

vi.mock("@/db/schema", () => ({
  childProfiles: { id: "id-column" },
}));

import { registerChild } from "@/app/signup/actions";

beforeEach(() => {
  mockInsert.mockClear();
  mockValues.mockClear();
  mockOnConflictDoNothing.mockClear();
  mockReturning.mockReset();
});

test("returns plaintext credentials when the insert succeeds on the first attempt", async () => {
  mockReturning.mockResolvedValueOnce([{ id: "uuid-1" }]);

  const result = await registerChild();

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.loginId).toMatch(/^\d{6}$/);
    expect(result.pin).toMatch(/^\d{6}$/);
    expect(result.nickname.length).toBeGreaterThan(0);
  }
  expect(mockInsert).toHaveBeenCalledTimes(1);
});

test("retries with newly generated values when the insert conflicts", async () => {
  mockReturning.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "uuid-2" }]);

  const result = await registerChild();

  expect(result.success).toBe(true);
  expect(mockInsert).toHaveBeenCalledTimes(2);
});

test("gives up and reports failure after repeated conflicts", async () => {
  mockReturning.mockResolvedValue([]);

  const result = await registerChild();

  expect(result).toEqual({ success: false });
  expect(mockInsert).toHaveBeenCalledTimes(5);
});
