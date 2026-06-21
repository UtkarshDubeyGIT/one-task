"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, Plus, X } from "lucide-react";

import { usePlanner } from "@/lib/store";
import { Sidebar } from "./sidebar";
import { SyncManager } from "./sync-manager";
import { TaskDialogProvider, useTaskDialog } from "./app-providers";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/unlumen/kbd";

const TITLES: Record<string, string> = {
  "/": "What's next",
  "/timeline": "Timeline",
  "/board": "Board",
  "/planning": "Planning",
};

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TaskDialogProvider>
      <Shell>{children}</Shell>
    </TaskDialogProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const hasHydrated = usePlanner((s) => s.hasHydrated);
  const pathname = usePathname();
  const { openCreate } = useTaskDialog();
  const [drawer, setDrawer] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.key === "n" || e.key === "N") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isTypingTarget(e.target)
      ) {
        e.preventDefault();
        openCreate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openCreate]);

  React.useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const title = TITLES[pathname] ?? "Deadline";

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          Loading your plan…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SyncManager />
      <aside className="hidden w-64 shrink-0 border-r bg-card/30 lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto scrollbar-thin">
          <Sidebar />
        </div>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] border-r bg-card duration-200 animate-in slide-in-from-left">
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
              >
                <X />
              </Button>
            </div>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>
          <h1 className="text-sm font-semibold">{title}</h1>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              Quick add <Kbd size="sm">N</Kbd>
            </span>
            <Button size="sm" onClick={() => openCreate()}>
              <Plus /> New task
            </Button>
          </div>
        </header>

        <main className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-60" />
          <div className="relative mx-auto w-full max-w-6xl p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
