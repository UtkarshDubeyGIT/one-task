import { NextResponse } from "next/server";

import {
  AUTH_COOKIE,
  authRequired,
  isAuthed,
  tokenFor,
  verifyPasscode,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ required: authRequired(), authed: isAuthed() });
}

export async function POST(request: Request) {
  if (!authRequired()) {
    return NextResponse.json({ required: false, authed: true });
  }
  let passcode = "";
  try {
    const body = (await request.json()) as { passcode?: string };
    passcode = body.passcode ?? "";
  } catch {
    passcode = "";
  }
  if (!verifyPasscode(passcode)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, tokenFor(passcode), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year — remember this device
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
