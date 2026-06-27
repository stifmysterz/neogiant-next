import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A1628",
          mid: "#112240",
          light: "#1A3355",
        },
        brand: {
          red: "#C0272D",
          "red-dark": "#9B1F24",
          "red-light": "#E8393F",
          gold: "#D4941A",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(10,22,40,0.10)",
        "card-lg": "0 8px 40px rgba(10,22,40,0.16)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.22s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
