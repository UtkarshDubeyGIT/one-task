import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "one task",
    short_name: "one task",
    description:
      "Deadline-first task manager — break tasks into daily milestones and always know what's next.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0f13",
    theme_color: "#0e0f13",
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
      { src: "/logo.png", sizes: "any", type: "image/png", purpose: "any" },
    ],
  };
}
