import { beforeEach, expect, test, vi } from "vitest";

const {
  mockFindFirst,
  mockCompare,
  mockLoginLimit,
  mockIsLoginLocked,
  mockRecordFailedLogin,
  mockResetLoginAttempts,
} = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockCompare: vi.fn(),
  mockLoginLimit: vi.fn(),
  mockIsLoginLocked: vi.fn(),
  mockRecordFailedLogin: vi.fn(),
  mockResetLoginAttempts: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: { query: { childProfiles: { findFirst: mockFindFirst } } },
}));

vi.mock("@/db/schema", () => ({
  childProfiles: { loginId: "login_id-column" },
}));

vi.mock("bcryptjs", () => ({
  default: { compare: mockCompare },
  compare: mockCompare,
}));

vi.mock("@/lib/rate-limit", () => ({
  loginRateLimit: { limit: mockLoginLimit },
  isLoginLocked: mockIsLoginLocked,
  recordFailedLogin: mockRecordFailedLogin,
  resetLoginAttempts: mockResetLoginAttempts,
}));

import { authorizeChild } from "@/lib/authorize-child";

const fakeRequest = () =>
  new Request("http://localhost/api/auth/callback/credentials", {
    headers: { "x-forwarded-for": "1.2.3.4" },
  });

beforeEach(() => {
  mockFindFirst.mockReset();
  mockCompare.mockReset();
  mockLoginLimit.mockReset().mockResolvedValue({ success: true });
  mockIsLoginLocked.mockReset().mockResolvedValue(false);
  mockRecordFailedLogin.mockReset();
  mockResetLoginAttempts.mockReset();
});

test("returns the user and resets the failure count on a correct pin", async () => {
  mockFindFirst.mockResolvedValue({
    id: "child-1",
    pinHash: "hash",
    displayNickname: "げんきなトラ402",
  });
  mockCompare.mockResolvedValue(true);

  const result = await authorizeChild({ loginId: "123456", pin: "654321" }, fakeRequest());

  expect(result).toEqual({ id: "child-1", name: "げんきなトラ402" });
  expect(mockResetLoginAttempts).toHaveBeenCalledWith("123456");
  expect(mockRecordFailedLogin).not.toHaveBeenCalled();
});

test("records a failure and returns null when the pin is wrong", async () => {
  mockFindFirst.mockResolvedValue({
    id: "child-1",
    pinHash: "hash",
    displayNickname: "げんきなトラ402",
  });
  mockCompare.mockResolvedValue(false);

  const result = await authorizeChild({ loginId: "123456", pin: "000000" }, fakeRequest());

  expect(result).toBeNull();
  expect(mockRecordFailedLogin).toHaveBeenCalledWith("123456");
});

test("records a failure and returns null when the login id does not exist", async () => {
  mockFindFirst.mockResolvedValue(undefined);

  const result = await authorizeChild({ loginId: "999999", pin: "000000" }, fakeRequest());

  expect(result).toBeNull();
  expect(mockRecordFailedLogin).toHaveBeenCalledWith("999999");
  expect(mockCompare).not.toHaveBeenCalled();
});

test("refuses without touching the database once the account is locked", async () => {
  mockIsLoginLocked.mockResolvedValue(true);

  const result = await authorizeChild({ loginId: "123456", pin: "000000" }, fakeRequest());

  expect(result).toBeNull();
  expect(mockFindFirst).not.toHaveBeenCalled();
});

test("refuses without touching the database once the per-IP rate limit is hit", async () => {
  mockLoginLimit.mockResolvedValue({ success: false });

  const result = await authorizeChild({ loginId: "123456", pin: "000000" }, fakeRequest());

  expect(result).toBeNull();
  expect(mockFindFirst).not.toHaveBeenCalled();
});
