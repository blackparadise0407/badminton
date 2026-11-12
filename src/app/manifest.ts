import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Badminton Sessions",
    short_name: "Badminton",
    description: "Manage badminton sessions and payments",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f6f9",
    theme_color: "#1f5c99",
    icons: [
      {
        src: "/badminton-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
