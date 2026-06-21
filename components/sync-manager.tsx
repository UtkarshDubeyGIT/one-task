"use client";

import * as React from "react";

import type { Snapshot } from "@/lib/types";
import { usePlanner } from "@/lib/store";
import { fetchRemote, pushRemote } from "@/lib/sync";

function snapshot(): Snapshot {
  const s = usePlanner.getState();
  return {
    areas: s.areas,
    labels: s.labels,
    tasks: s.tasks,
    milestones: s.milestones,
  };
}

/**
 * Bridges the local Zustand store to the cloud KV store:
 * - On first load (after localStorage hydration), pull the remote snapshot and
 *   adopt it; if the remote is empty, seed it with the local snapshot.
 * - On subsequent data changes, debounce-push to the remote.
 * - If no DB is configured, stays in local-only mode and never pushes.
 */
export function SyncManager() {
  const hasHydrated = usePlanner((s) => s.hasHydrated);
  const replaceAll = usePlanner((s) => s.replaceAll);
  const setSyncStatus = usePlanner((s) => s.setSyncStatus);

  React.useEffect(() => {
    if (!hasHydrated) return;
    let cancelled = false;
    let ready = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      setSyncStatus("syncing");
      const { configured, state } = await fetchRemote();
      if (cancelled) return;
      if (!configured) {
        setSyncStatus("local");
        return; // local-only mode — never push
      }
      if (state && Array.isArray(state.tasks) && Array.isArray(state.areas)) {
        replaceAll(state);
      } else {
        await pushRemote(snapshot());
      }
      setSyncStatus("synced");
      ready = true;
    })();

    const unsubscribe = usePlanner.subscribe((s, prev) => {
      if (!ready) return;
      // Only react to data changes (ignore filter / status updates).
      if (
        s.tasks === prev.tasks &&
        s.areas === prev.areas &&
        s.labels === prev.labels &&
        s.milestones === prev.milestones
      ) {
        return;
      }
      if (timer) clearTimeout(timer);
      setSyncStatus("syncing");
      timer = setTimeout(async () => {
        const ok = await pushRemote(snapshot());
        setSyncStatus(ok ? "synced" : "local");
      }, 800);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  return null;
}
