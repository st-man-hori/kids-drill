"use server";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { childProfiles } from "@/db/schema";
import { generateLoginId, generateNickname, generatePin } from "@/lib/credentials";

const MAX_ATTEMPTS = 5;
const PIN_SALT_ROUNDS = 10;

// 小学1年生の算数のみ提供中のため学年は固定（docs/architecture.md参照）。
// 学年拡張時にここを見直す。
const INITIAL_GRADE = 1;

export type RegisterChildResult =
  | { success: true; loginId: string; pin: string; nickname: string }
  | { success: false };

export const registerChild = async (): Promise<RegisterChildResult> => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const loginId = generateLoginId();
    const pin = generatePin();
    const nickname = generateNickname();
    const pinHash = await bcrypt.hash(pin, PIN_SALT_ROUNDS);

    const created = await db
      .insert(childProfiles)
      .values({
        loginId,
        pinHash,
        displayNickname: nickname,
        grade: INITIAL_GRADE,
      })
      .onConflictDoNothing()
      .returning({ id: childProfiles.id });

    if (created.length > 0) {
      return { success: true, loginId, pin, nickname };
    }
  }

  return { success: false };
};
