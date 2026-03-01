/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "sf-primary": {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        "sf-surface": "#0f172a",
        "sf-surface-elevated": "#020617",
        "sf-border": "#1f2933",
        "sf-text": "#e5e7eb",
        "sf-muted": "#9ca3af",
        "sf-success": "#22c55e",
        "sf-danger": "#ef4444",
        "sf-invest": "#38bdf8",
      },
      borderRadius: {
        xl: "1rem",
      },
      boxShadow: {
        "sf-card": "0 18px 45px rgba(15,23,42,0.65)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
