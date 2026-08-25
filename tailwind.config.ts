import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F8F7",
        surface: "#FFFFFF",
        border: "#E4E5E7",
        ink: "#14171A",
        muted: "#5E6D6F",
        accent: {
          DEFAULT: "#14A800",
          dark: "#0D7A00",
          light: "#E9F7E9",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20,168,0,0.12), transparent)",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        marquee: "marquee 50s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
