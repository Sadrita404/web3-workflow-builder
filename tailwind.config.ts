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
        background: "#F8F8F8",
        foreground: "#1a1a1a",
        primary: "#FF6B6B",
        secondary: "#4ECDC4",
        accent: "#FFE66D",
        success: "#6BCF7F",
        error: "#FF6B6B",
        warning: "#FFB547",
        node: {
          bg: "#FFFFFF",
          border: "#E0E0E0",
          hover: "#F5F5F5",
        },
        canvas: {
          grid: "rgba(0, 0, 0, 0.1)",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'node': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'node-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'panel': '0 0 20px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flow 2s ease-in-out infinite',
      },
      keyframes: {
        flow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
