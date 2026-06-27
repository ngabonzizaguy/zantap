import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // DESIGN.md editorial tokens (ADR-0005) — canonical for all new UI.
        primary: {
          DEFAULT: "#292524",
          active: "#0c0a09",
        },
        ink: "#0c0a09",
        body: {
          DEFAULT: "#4e4e4e",
          strong: "#292524",
        },
        muted: {
          DEFAULT: "#777169",
          soft: "#a8a29e",
        },
        hairline: {
          DEFAULT: "#e7e5e4",
          soft: "#f0efed",
          strong: "#d6d3d1",
        },
        canvas: {
          DEFAULT: "#f5f5f5",
          soft: "#fafafa",
          deep: "#0c0a09",
        },
        surface: {
          card: "#ffffff",
          strong: "#f0efed",
          dark: "#0c0a09",
          "dark-elevated": "#1c1917",
        },
        "on-primary": "#ffffff",
        "on-dark": {
          DEFAULT: "#ffffff",
          soft: "#a8a29e",
        },
        "gradient-mint": "#a7e5d3",
        "gradient-peach": "#f4c5a8",
        "gradient-lavender": "#c8b8e0",
        "gradient-sky": "#a8c8e8",
        "gradient-rose": "#e8b8c4",
        success: "#16a34a",
        error: "#dc2626",
        // DEPRECATED — legacy storefront blush palette. Do not use in new UI.
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
        momo: {
          DEFAULT: "#F5A623",
          light: "#FFD24C",
          dark: "#4a3500",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        "display-mega": [
          "64px",
          { lineHeight: "1.05", letterSpacing: "-1.92px", fontWeight: "300" },
        ],
        "display-xl": [
          "48px",
          { lineHeight: "1.08", letterSpacing: "-0.96px", fontWeight: "300" },
        ],
        "display-lg": [
          "36px",
          { lineHeight: "1.17", letterSpacing: "-0.36px", fontWeight: "300" },
        ],
        "display-md": [
          "32px",
          { lineHeight: "1.13", letterSpacing: "-0.32px", fontWeight: "300" },
        ],
        "display-sm": [
          "24px",
          { lineHeight: "1.2", letterSpacing: "0", fontWeight: "300" },
        ],
        "title-md": [
          "20px",
          { lineHeight: "1.35", letterSpacing: "0", fontWeight: "500" },
        ],
        "title-sm": [
          "18px",
          { lineHeight: "1.44", letterSpacing: "0.18px", fontWeight: "500" },
        ],
        "body-md": [
          "16px",
          { lineHeight: "1.5", letterSpacing: "0.16px", fontWeight: "400" },
        ],
        "body-strong": [
          "16px",
          { lineHeight: "1.5", letterSpacing: "0.16px", fontWeight: "500" },
        ],
        "body-sm": [
          "15px",
          { lineHeight: "1.47", letterSpacing: "0.15px", fontWeight: "400" },
        ],
        caption: [
          "14px",
          { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" },
        ],
        "caption-uppercase": [
          "12px",
          {
            lineHeight: "1.4",
            letterSpacing: "0.96px",
            fontWeight: "600",
          },
        ],
        button: [
          "15px",
          { lineHeight: "1", letterSpacing: "0", fontWeight: "500" },
        ],
        "nav-link": [
          "15px",
          { lineHeight: "1.4", letterSpacing: "0", fontWeight: "500" },
        ],
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        base: "16px",
        md: "20px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "96px",
      },
      borderRadius: {
        "brand-xs": "4px",
        "brand-sm": "6px",
        "brand-md": "8px",
        "brand-lg": "12px",
        "brand-xl": "16px",
        "brand-xxl": "24px",
        pill: "9999px",
        "4xl": "2rem",
        "5xl": "2.125rem",
      },
      boxShadow: {
        "brand-soft": "0 4px 16px rgba(0, 0, 0, 0.04)",
        glass: "0 12px 30px rgba(176,116,104,0.16), inset 0 1px 0 rgba(255,255,255,0.65)",
        "glass-lg": "0 18px 44px rgba(176,116,104,0.22), inset 0 1px 0 rgba(255,255,255,0.7)",
        cart: "0 16px 40px rgba(150,90,80,0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
        kds: "0 10px 28px rgba(0,0,0,0.42)",
      },
      animation: {
        brandfloat: "brandfloat 14s ease-in-out infinite",
        ztfloat: "ztfloat 14s ease-in-out infinite",
        ztspin: "ztspin 0.9s linear infinite",
        ztshim: "ztshim 1.3s ease-in-out infinite",
        ztpulse: "ztpulse 1.4s ease-in-out infinite",
      },
      keyframes: {
        brandfloat: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-26px,0) scale(1.06)" },
        },
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
