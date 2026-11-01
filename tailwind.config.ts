import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // linen / oat cushions
        cream: { 50: "#fffaf2", 100: "#fbf1e0", 200: "#f3e3c8", 300: "#e6d2b0" },
        // candle + fairy-light glow
        glow: { 100: "#fdf0cf", 200: "#fbe2a6", 300: "#f8cf7f", 400: "#f2b95a", 500: "#e39b34" },
        // terracotta pots, rattan, warm blush
        clay: { 400: "#d98467", 500: "#c4684b" },
        // plants
        sage: { 100: "#edf2e4", 200: "#d6e3c8", 300: "#b6cca0", 400: "#93b07a", 500: "#6f9360", 600: "#55774a", 700: "#3f5c3a" },
        // wood, baskets, text
        walnut: { 50: "#f8f2ea", 100: "#efe4d4", 300: "#b8a28d", 400: "#9a8068", 500: "#7a604b", 600: "#62493a", 700: "#4d3a2e", 800: "#3b2c23", 900: "#2a1f18", 950: "#1c140f" },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "ui-rounded", "system-ui", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem" },
      boxShadow: {
        cozy: "0 12px 32px -12px rgba(98, 73, 58, 0.35)",
        glow: "0 0 0 3px rgba(242, 185, 90, 0.55)",
      },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        popin: { "0%": { opacity: "0", transform: "scale(.94) translateY(6px)" }, "100%": { opacity: "1", transform: "none" } },
        twinkle: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".45" } },
        sway: { "0%,100%": { transform: "rotate(-1.5deg)" }, "50%": { transform: "rotate(1.5deg)" } },
        heartRise: {
          "0%": { opacity: "0", transform: "translateY(0) scale(.4)" },
          "15%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-220px) scale(1.4)" },
        },
      },
      animation: {
        floaty: "floaty 4s ease-in-out infinite",
        popin: "popin .25s ease-out both",
        twinkle: "twinkle 3.2s ease-in-out infinite",
        sway: "sway 7s ease-in-out infinite",
        heart: "heartRise 2.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
