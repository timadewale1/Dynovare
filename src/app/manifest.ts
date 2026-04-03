import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dynovare",
    short_name: "Dynovare",
    description: "AI policy intelligence for drafting, critique, simulation, and public energy policy analysis.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5fbff",
    theme_color: "#003869",
    icons: [
      {
        src: "/logo/Dynovare_Favicon.png",
        sizes: "704x704",
        type: "image/png",
      },
    ],
  };
}
