import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CIEGMA Policy",
    short_name: "CIEGMA",
    description: "Central Intelligence for Energy Governance and Market Analytics.",
    start_url: "/ciegma",
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
