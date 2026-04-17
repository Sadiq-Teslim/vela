import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vela: {
          void: "#040812",
          surface: "#0d1830",
          panel: "#111e38",
          border: "rgba(255,255,255,0.08)",
          cyan: "#00e5ff",
          gold: "#f0b429",
          mint: "#00d68f",
          violet: "#7c3aed",
          red: "#ff4d4d",
          primary: "#f0f4ff",
          muted: "rgba(200,215,255,0.5)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Syne", "sans-serif"],
        body: ["var(--font-body)", "Outfit", "sans-serif"],
        mono: ["var(--font-mono)", "DM Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
