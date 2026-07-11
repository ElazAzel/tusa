import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TUSA.game — Твоя туса. Твои правила.",
    short_name: "TUSA.game",
    description: "Одна ссылка для людей, игр, покупок, фото и воспоминаний.",
    id: "/app",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#0d0d0d",
    theme_color: "#c9ff05",
    lang: "ru",
    icons: [
      {
        src: "/brand/tusa-game-icon.png",
        sizes: "265x277",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
