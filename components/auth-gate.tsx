"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Status = "loading" | "open" | "locked";

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="size-2 animate-pulse rounded-full bg-primary" />
        Loading…
      </div>
    </div>
  );
}

function PasscodeScreen({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || busy) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode: code }),
      });
      if (res.ok) {
        onUnlock();
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-xs rounded-2xl border bg-card p-6 text-center shadow-xl duration-300 animate-in fade-in-0 zoom-in-95"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="one task"
          className="mx-auto size-14 rounded-xl"
        />
        <h1 className="mt-4 font-pixel-square text-base tracking-wide">
          one task
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your passcode to continue.
        </p>
        <Input
          type="password"
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          placeholder="Passcode"
          className="mt-4 text-center tracking-widest"
        />
        {error && (
          <p className="mt-2 text-xs text-destructive">Incorrect passcode.</p>
        )}
        <Button type="submit" className="mt-4 w-full" disabled={busy || !code}>
          {busy ? "Unlocking…" : "Unlock"}
        </Button>
        <p className="mt-3 text-[11px] text-muted-foreground">
          This device will stay unlocked.
        </p>
      </form>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<Status>("loading");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth", { cache: "no-store" });
        const data = (await res.json()) as {
          required?: boolean;
          authed?: boolean;
        };
        if (cancelled) return;
        setStatus(!data.required || data.authed ? "open" : "locked");
      } catch {
        // Network error — don't lock the user out of their local data;
        // the server still gates /api/state independently.
        if (!cancelled) setStatus("open");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") return <Splash />;
  if (status === "locked") {
    return <PasscodeScreen onUnlock={() => setStatus("open")} />;
  }
  return <>{children}</>;
}
