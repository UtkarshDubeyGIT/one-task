import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import {
  GeistPixelCircle,
  GeistPixelGrid,
  GeistPixelLine,
  GeistPixelSquare,
  GeistPixelTriangle,
} from "geist/font/pixel";

import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";

// Geist is the only type family in the app: Sans (default), Mono (code/labels),
// and the five Pixel variants (available as font-pixel-* utilities).
const fontVariables = [
  GeistSans.variable,
  GeistMono.variable,
  GeistPixelSquare.variable,
  GeistPixelGrid.variable,
  GeistPixelCircle.variable,
  GeistPixelTriangle.variable,
  GeistPixelLine.variable,
].join(" ");

export const metadata: Metadata = {
  title: "one task — deadline-first task manager",
  description:
    "Break tasks into daily milestones, map them across your week, and always know what to work on next.",
  applicationName: "one task",
  appleWebApp: {
    capable: true,
    title: "one task",
    statusBarStyle: "black-translucent",
  },
};

// Set the theme class before paint to avoid a flash. Defaults to dark.
const themeScript = `(function(){try{var t=localStorage.getItem('dtm-theme');var dark=t? t==='dark':true;document.documentElement.classList.toggle('dark',dark);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AuthGate>
          <AppShell>{children}</AppShell>
        </AuthGate>
      </body>
    </html>
  );
}
