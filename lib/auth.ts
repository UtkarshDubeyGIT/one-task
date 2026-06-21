import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

// Server-only passcode helpers. Auth is OFF unless APP_PASSCODE is set, so the
// app stays open until the user opts in.

export const AUTH_COOKIE = "ot_auth";

export function authRequired(): boolean {
  return Boolean(process.env.APP_PASSCODE);
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  try {
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Opaque device token derived from the passcode (+ optional secret salt). */
export function tokenFor(passcode: string): string {
  const secret = process.env.APP_AUTH_SECRET ?? "one-task-default-secret";
  return createHash("sha256").update(`${passcode}:${secret}`).digest("hex");
}

export function expectedToken(): string {
  return tokenFor(process.env.APP_PASSCODE ?? "");
}

export function verifyPasscode(passcode: string): boolean {
  const expected = process.env.APP_PASSCODE ?? "";
  if (!expected) return false;
  return safeEqual(passcode, expected);
}

/** True when no passcode is configured, or a valid device cookie is present. */
export function isAuthed(): boolean {
  if (!authRequired()) return true;
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, expectedToken());
}
