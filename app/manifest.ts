import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "one task",
    short_name: "one task",
    description:
      "Deadline-first task manager — break tasks into daily milestones and always know what's next.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f0f10",
    theme_color: "#0f0f10",
    icons: [
      { src: "/app-icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/app-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
