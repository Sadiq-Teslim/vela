import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  // Dark mode toggled by `.dark` class on <html>. Default is light.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        vela: {
          void: "var(--vela-void)",
          surface: "var(--vela-surface)",
          panel: "var(--vela-panel)",
          border: "var(--vela-border)",
          cyan: "var(--vela-cyan)",
          gold: "var(--vela-gold)",
          mint: "var(--vela-mint)",
          violet: "var(--vela-violet)",
          red: "var(--vela-red)",
          primary: "var(--vela-primary)",
          muted: "var(--vela-muted)",
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
