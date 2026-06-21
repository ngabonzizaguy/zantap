import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zt: {
          blush: {
            50: "#f3e0d6",
            100: "#ecd2cf",
            200: "#e7d4e4",
            bg: "#efd9ce",
          },
          brown: {
            DEFAULT: "#33241d",
            dark: "#3a2c26",
            muted: "#5a463c",
          },
          warm: {
            DEFAULT: "#8a7268",
            light: "#b59d92",
            lighter: "#a08b80",
          },
          accent: {
            DEFAULT: "#b5773f",
            gold: "#F5A623",
            goldLight: "#FFD24C",
          },
          success: {
            DEFAULT: "#0a6b3b",
            light: "#0f9a55",
            glow: "#7ee2a8",
          },
        },
        zk: {
          bg: "#17110c",
          surface: "#221913",
          surfaceAlt: "#1a130d",
          border: "#3a2c20",
          borderDark: "#34281f",
          text: "#faf4ee",
          muted: "#9a8676",
          sub: "#b9a89b",
          dim: "#6f5d4f",
        },
        momo: {
          DEFAULT: "#F5A623",
          light: "#FFD24C",
          dark: "#4a3500",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.125rem",
      },
      boxShadow: {
        glass: "0 12px 30px rgba(176,116,104,0.16), inset 0 1px 0 rgba(255,255,255,0.65)",
        "glass-lg": "0 18px 44px rgba(176,116,104,0.22), inset 0 1px 0 rgba(255,255,255,0.7)",
        cart: "0 16px 40px rgba(150,90,80,0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
        kds: "0 10px 28px rgba(0,0,0,0.42)",
      },
      animation: {
        ztfloat: "ztfloat 14s ease-in-out infinite",
        ztspin: "ztspin 0.9s linear infinite",
        ztshim: "ztshim 1.3s ease-in-out infinite",
        ztpulse: "ztpulse 1.4s ease-in-out infinite",
        zkpulse: "zkpulse 1.6s ease-in-out infinite",
      },
      keyframes: {
        ztfloat: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-26px,0) scale(1.06)" },
        },
        ztspin: {
          to: { transform: "rotate(360deg)" },
        },
        ztshim: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        ztpulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.8)" },
        },
        zkpulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.78)" },
        },
      },
      maxWidth: {
        customer: "450px",
        kds: "560px",
      },
    },
  },
  plugins: [],
};

export default config;
