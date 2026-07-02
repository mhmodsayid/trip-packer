import type { MetadataRoute } from "next";

const THEME_COLOR = "#2563eb";
const BACKGROUND_COLOR = "#f8fafc";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trip Packer | مُنَظِّم الرحلة",
    short_name: "Packer",
    description:
      "Coordinate shared packing lists for your trips — نسّق قوائم التعبئة المشتركة لرحلاتك",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
