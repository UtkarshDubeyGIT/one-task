"use client";

import * as React from "react";
import { Download, MonitorDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "safari" | "desktop" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const iOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1);
  if (iOS) return "ios";
  if (/android/i.test(ua)) return "android";
  const safari =
    /safari/i.test(ua) && !/chrome|chromium|crios|edg|android/i.test(ua);
  if (safari) return "safari";
  return "desktop";
}

const STEPS: Record<Platform, { label: string; steps: string }> = {
  desktop: {
    label: "Chrome / Edge (desktop)",
    steps:
      "Click the install icon in the address bar, or open the browser menu and choose Install one task.",
  },
  safari: {
    label: "Safari (Mac)",
    steps: "Open the File menu and choose Add to Dock.",
  },
  android: {
    label: "Android (Chrome)",
    steps: "Open the browser menu and choose Install app / Add to Home Screen.",
  },
  ios: {
    label: "iPhone / iPad (Safari)",
    steps: "Tap the Share button, then choose Add to Home Screen.",
  },
  other: {
    label: "Your browser",
    steps: "Look for an install or Add to Home Screen option in the menu.",
  },
};

export function InstallButton() {
  const [deferred, setDeferred] = React.useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [platform, setPlatform] = React.useState<Platform>("other");

  React.useEffect(() => {
    setPlatform(detectPlatform());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setHelpOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      setDeferred(null);
    } else {
      setHelpOpen(true);
    }
  };

  const ordered: Platform[] = [
    platform,
    ...(["desktop", "safari", "android", "ios"] as Platform[]).filter(
      (p) => p !== platform,
    ),
  ];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={handleClick}
      >
        <Download className="size-4" /> Install app
      </Button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-sm">
          <button
            type="button"
            onClick={() => setHelpOpen(false)}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
          <div className="mb-2 flex items-center gap-2">
            <MonitorDown className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Install one task</h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Add it to your dock or home screen to run it like a native app — own
            window, works offline.
          </p>
          <div className="flex flex-col gap-2">
            {ordered.map((p, i) => (
              <div
                key={p}
                className={cn(
                  "rounded-lg border p-2.5",
                  i === 0 && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="text-xs font-medium text-foreground">
                  {STEPS[p].label}
                  {i === 0 ? " · you're here" : ""}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {STEPS[p].steps}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
