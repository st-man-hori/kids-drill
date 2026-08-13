import { beforeEach, expect, test, vi } from "vitest";

const { mockInsert, mockValues, mockOnConflictDoNothing, mockReturning, mockSignupLimit } =
  vi.hoisted(() => {
    const mockReturning = vi.fn();
    const mockOnConflictDoNothing = vi.fn(() => ({ returning: mockReturning }));
    const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
    const mockInsert = vi.fn(() => ({ values: mockValues }));
    const mockSignupLimit = vi.fn();
    return { mockInsert, mockValues, mockOnConflictDoNothing, mockReturning, mockSignupLimit };
  });

vi.mock("@/db", () => ({
  db: { insert: mockInsert },
}));

vi.mock("@/db/schema", () => ({
  childProfiles: { id: "id-column" },
}));

vi.mock("@/lib/rate-limit", () => ({
  signupRateLimit: { limit: mockSignupLimit },
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => null }),
}));

import { registerChild } from "@/app/signup/actions";

beforeEach(() => {
  mockInsert.mockClear();
  mockValues.mockClear();
  mockOnConflictDoNothing.mockClear();
  mockReturning.mockReset();
  mockSignupLimit.mockReset();
  mockSignupLimit.mockResolvedValue({ success: true });
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

  expect(result).toEqual({ success: false, reason: "unknown" });
  expect(mockInsert).toHaveBeenCalledTimes(5);
});

test("refuses to create an account once the per-IP signup rate limit is hit", async () => {
  mockSignupLimit.mockResolvedValue({ success: false });

  const result = await registerChild();

  expect(result).toEqual({ success: false, reason: "rate_limited" });
  expect(mockInsert).not.toHaveBeenCalled();
});
