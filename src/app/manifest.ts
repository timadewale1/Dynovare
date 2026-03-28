import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dynovare",
    short_name: "Dynovare",
    description: "AI policy intelligence for drafting, critique, simulation, and public energy policy analysis.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5fbff",
    theme_color: "#125669",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
