import type { Snapshot } from "./types";

/** Client-side helpers for talking to the /api/state cloud store. */

export async function fetchRemote(): Promise<{
  configured: boolean;
  state: Snapshot | null;
}> {
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (!res.ok) return { configured: false, state: null };
    const data = (await res.json()) as {
      configured?: boolean;
      state?: Snapshot | null;
    };
    return { configured: Boolean(data.configured), state: data.state ?? null };
  } catch {
    return { configured: false, state: null };
  }
}

export async function pushRemote(state: Snapshot): Promise<boolean> {
  try {
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
}
