import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { 50: "#fffaf3", 100: "#fff3e3", 200: "#fde6cc" },
        peach: { 100: "#ffe3d3", 200: "#ffcdb2", 300: "#ffb18a", 400: "#ff9566", 500: "#f57c4a" },
        rose: { 400: "#f4768f", 500: "#e85a79" },
        plum: { 50: "#f6eef4", 300: "#a98aa6", 500: "#6b3f69", 700: "#46264a", 800: "#33193a", 900: "#22102a", 950: "#170a1d" },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "ui-rounded", "system-ui", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem" },
      boxShadow: {
        cozy: "0 10px 30px -10px rgba(51, 25, 58, 0.45)",
        glow: "0 0 0 3px rgba(255, 177, 138, 0.55)",
      },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        popin: { "0%": { opacity: "0", transform: "scale(.94) translateY(6px)" }, "100%": { opacity: "1", transform: "none" } },
        heartRise: {
          "0%": { opacity: "0", transform: "translateY(0) scale(.4)" },
          "15%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-220px) scale(1.4)" },
        },
      },
      animation: {
        floaty: "floaty 4s ease-in-out infinite",
        popin: "popin .25s ease-out both",
        heart: "heartRise 2.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
