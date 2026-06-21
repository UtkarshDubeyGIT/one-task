"use client";

import * as React from "react";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shows a lock button only when a passcode is configured and the device is unlocked. */
export function LockButton() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { required?: boolean; authed?: boolean }) => {
        if (!cancelled) setShow(Boolean(d.required && d.authed));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Lock app"
      title="Lock app"
      onClick={async () => {
        try {
          await fetch("/api/auth", { method: "DELETE" });
        } catch {
          /* ignore */
        }
        window.location.reload();
      }}
    >
      <Lock />
    </Button>
  );
}
