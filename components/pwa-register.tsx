"use client";

import * as React from "react";

/**
 * Registers the service worker for installability + offline, and — critically —
 * auto-reloads to the latest version when a new service worker takes control,
 * so users are never stranded on a stale cached build.
 */
export function PwaRegister() {
  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;
    // If a service worker already controls this page, a future controller
    // change means a NEW version activated → reload once to pick it up.
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Force an update check so a changed sw.js is fetched immediately.
          reg.update().catch(() => undefined);
        })
        .catch(() => undefined);
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
