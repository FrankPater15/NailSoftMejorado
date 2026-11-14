import animate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{html,js,jsx,ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Texto: Inter. Títulos: Fraunces (serif de la marca). Ambas autoalojadas.
        sans: ['"Inter Variable"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Fraunces Variable"', "Fraunces", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        // Sombras cálidas y suaves, con el color de los tokens
        xs: "0 1px 2px 0 hsl(var(--shadow-color) / 0.06)",
        soft: "0 1px 2px 0 hsl(var(--shadow-color) / 0.05), 0 4px 12px -2px hsl(var(--shadow-color) / 0.08)",
        elevated: "0 2px 4px 0 hsl(var(--shadow-color) / 0.06), 0 12px 32px -8px hsl(var(--shadow-color) / 0.18)",
      },
      colors: {
        gold: {
          DEFAULT: "hsl(var(--gold) / <alpha-value>)",
          foreground: "hsl(var(--gold-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
        },
        info: {
          DEFAULT: "hsl(var(--info) / <alpha-value>)",
          foreground: "hsl(var(--info-foreground) / <alpha-value>)",
        },
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar, var(--background)) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground, var(--foreground)) / <alpha-value>)",
          border: "hsl(var(--sidebar-border, var(--border)) / <alpha-value>)",
          primary: "hsl(var(--sidebar-primary, var(--primary)) / <alpha-value>)",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground, var(--primary-foreground)) / <alpha-value>)",
          accent: "hsl(var(--sidebar-accent, var(--accent)) / <alpha-value>)",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground, var(--accent-foreground)) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring, var(--ring)) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.8 },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-gentle": "pulse-gentle 3s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-shine":
          "linear-gradient(45deg, transparent 25%, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.1) 50%, transparent 50%, transparent 75%, rgba(255, 255, 255, 0.1) 75%, rgba(255, 255, 255, 0.1))",
      },
    },
  },
  plugins: [animate],
}