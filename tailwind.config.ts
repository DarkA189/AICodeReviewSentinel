import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sentinel: {
          red: "#FF2D55",
          orange: "#FF6B35",
          yellow: "#FFD60A",
          green: "#32D74B",
          blue: "#0A84FF",
          purple: "#BF5AF2",
          teal: "#5AC8FA",
          dark: "#0A0A0F",
          darker: "#05050A",
          panel: "#12121A",
          border: "#1E1E2E",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(10, 132, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(10, 132, 255, 0.8)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "scan-line": "scan-line 3s linear infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(30,30,46,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,46,0.5) 1px, transparent 1px)",
        "sentinel-gradient":
          "linear-gradient(135deg, #0A0A0F 0%, #12121A 50%, #0A0A0F 100%)",
      },
      backgroundSize: {
        "grid-sm": "20px 20px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
