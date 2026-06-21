import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

import { authRequired, isAuthed } from "@/lib/auth";
import type { Snapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "one-task:state:v1";

/**
 * Resolves an Upstash Redis client from whichever env-var naming the Vercel
 * integration provides (Vercel KV → KV_REST_API_*, Upstash → UPSTASH_*).
 * Returns null when no DB is configured, so the app falls back to localStorage.
 */
function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET() {
  if (authRequired() && !isAuthed()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) return NextResponse.json({ configured: false, state: null });
  try {
    const state = await redis.get<Snapshot>(KEY);
    return NextResponse.json({ configured: true, state: state ?? null });
  } catch {
    return NextResponse.json({ configured: true, state: null });
  }
}

export async function PUT(request: Request) {
  if (authRequired() && !isAuthed()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) return NextResponse.json({ configured: false });
  try {
    const body = (await request.json()) as Snapshot;
    await redis.set(KEY, body);
    return NextResponse.json({ configured: true, ok: true });
  } catch {
    return NextResponse.json({ configured: true, ok: false }, { status: 400 });
  }
}
