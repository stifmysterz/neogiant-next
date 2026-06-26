import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Neo Giant Brand Tokens ──────────────────────
      colors: {
        navy: {
          DEFAULT: "#0A1628",
          mid:     "#112240",
          light:   "#1A3355",
        },
        brand: {
          red:       "#C0272D",
          "red-dark":"#9B1F24",
          "red-light":"#E8393F",
          gold:      "#D4941A",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body:    ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(10,22,40,0.12)",
        "card-lg": "0 8px 40px rgba(10,22,40,0.18)",
        red: "0 6px 20px rgba(192,39,45,0.35)",
      },
      animation: {
        "pulse-dot": "pulse 2s ease-in-out infinite",
        "fade-in":   "fadeIn 0.2s ease-out",
        "slide-up":  "slideUp 0.25s ease-out",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
